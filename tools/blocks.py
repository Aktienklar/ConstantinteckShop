#!/usr/bin/env python3
"""
Wiederkehrende Bausteine, die sonst in vielen Dateien von Hand gleich
gehalten werden müssten.

Aufruf (macht deploy.sh automatisch, vor images.py und seo.py):
    python3 tools/blocks.py

  1. Autorenbox auf jeder Rezeptseite, zwischen <!-- Autor --> und
     <!-- /Autor -->, direkt vor "More from …". Text steht unten in AUTHOR_BOX.
  2. Rezeptsammlungen collections/<slug>.html aus tools/collections.json.
     Die Karten werden aus recipes.html übernommen, Kopf und Fuß aus einer
     Rezeptseite. Dazu die Leiste mit den Sammlungen auf recipes.html und
     unter jedem Rezept drei thematisch passende Rezepte mit Link zur
     Sammlung (zwischen <!-- Verwandt --> und <!-- /Verwandt -->).
  3. llms.txt im Hauptordner: Kurzbeschreibung und Inhaltsverzeichnis der
     Seite für KI-Assistenten (https://llmstxt.org).

Läuft das Skript zweimal, ändert sich beim zweiten Mal nichts.
"""
import glob
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from schema import DESCRIPTION, SITE  # noqa: E402
import seo  # noqa: E402
from seo import ROOT  # noqa: E402

AUTHOR_BOX = """\
<!-- Autor (geschrieben von tools/blocks.py) -->
      <aside class="panel author-box mt-12" aria-label="About the author">
        <picture><source type="image/avif" srcset="../assets/img/constantin-avatar.avif"><img class="author-box__photo" src="../assets/img/constantin-avatar.jpg" alt="Constantin" width="192" height="192" loading="lazy"></picture>
        <div>
          <p class="author-box__name">Recipe by Constantin</p>
          <p class="muted author-box__text">I cook for anyone who&apos;ll sit at the table and film it as @constantinteck – 100M+ views, 50,000+ people cooking along. Every recipe on this site is one from my videos.</p>
          <a class="link-brand author-box__link" href="../about.html">More about me →</a>
        </div>
      </aside>
      <!-- /Autor -->"""


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


def write(path, text):
    full = os.path.join(ROOT, path)
    old = open(full, encoding="utf-8").read() if os.path.exists(full) else None
    if old != text:
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(text)
        return True
    return False


def replace_between(src, start, end, block, anchor):
    """Ersetzt start…end durch block; fehlt der Block, kommt er vor anchor."""
    pattern = r"[ \t]*" + re.escape(start) + r".*?" + re.escape(end)
    if re.search(pattern, src, re.S):
        return re.sub(pattern, lambda _: block, src, count=1, flags=re.S)
    return src.replace(anchor, block + "\n" + anchor, 1)


# --- 1. Autorenbox -----------------------------------------------------------

def author_boxes():
    changed = 0
    for page in sorted(glob.glob(os.path.join(ROOT, "recipes", "*.html"))):
        rel = os.path.relpath(page, ROOT)
        src = read(rel)
        anchor = re.search(r'[ \t]*(<!-- Verwandt|<section class="mt-12">\s*<h2[^>]*>More from)', src)
        new = replace_between(src, "<!-- Autor", "<!-- /Autor -->", "      " + AUTHOR_BOX,
                              anchor.group(0) if anchor else "</article>")
        changed += write(rel, new)
    return changed


# --- 2. Rezeptsammlungen -----------------------------------------------------

def recipe_cards():
    """{slug: (name, tags, Karten-HTML)} aus recipes.html, in dessen Reihenfolge."""
    cards = {}
    grid = read("recipes.html")
    # Nur das Raster – die Reihe "From the latest videos" darüber (tools/cases.py)
    # trägt Kopien ohne loading="lazy".
    grid = grid[grid.find("<!-- /Neueste -->"):]
    for m in re.finditer(r'<a class="(card recipe-card[^"]*)" href="recipes/([^"]+)\.html"[^>]*>(.*?)</a>',
                         grid, re.S):
        cls, slug, inner = m.groups()
        if slug in cards:
            continue
        name = html.unescape(re.sub(r"<[^>]+>", "", re.search(r"<h3>(.*?)</h3>", inner, re.S).group(1)))
        tags = [html.unescape(t) for t in re.findall(r'<span class="tag">(.*?)</span>', inner)]
        inner = re.sub(r'(src|srcset)="assets/', r'\1="../assets/', inner)
        inner = re.sub(r'(, )assets/', r"\1../assets/", inner)
        cards[slug] = (name, tags, '<a class="%s" href="../recipes/%s.html">%s</a>' % (cls, slug, inner))
    return cards


def shell():
    """Kopf und Fuß einer Rezeptseite als Rahmen für die Sammlungen."""
    src = read("recipes/peach-sorbet.html")
    head_end = src.index("<main")
    top = src[:head_end]
    bottom = src[src.index("</main>") + len("</main>"):]
    # Nur die Skripte, die jede Seite braucht (Warenkorb-Zähler, Leiste).
    bottom = re.sub(r'\s*<script src="\.\./assets/js/(?!shop-data|site-config|site\.js|cart\.js)[^"]+"[^>]*></script>',
                    "", bottom)
    # Schema und Vorschau schreibt seo.py neu; hier nur ein leerer Rahmen.
    top = re.sub(r"[ \t]*<!-- Strukturierte Daten.*?<!-- /Strukturierte Daten -->\n?", "", top, flags=re.S)
    return top, bottom


def collection_page(slug, c, members, top, bottom):
    first_slug = members[0][0]
    head = re.sub(r"<title>.*?</title>", "<title>%s</title>" % html.escape(c["title"], quote=False), top, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*">',
                  '<meta name="description" content="%s">' % html.escape(c["description"]), head)
    head = re.sub(r'property="og:type" content="[^"]*"', 'property="og:type" content="website"', head)
    head = re.sub(r'property="og:image" content="[^"]*"',
                  'property="og:image" content="%sassets/img/%s.jpg"' % (SITE, first_slug), head)
    cards = "\n".join("        " + card for _, (_, _, card) in members)
    main = """<main id="content">
    <!-- Diese Seite wird von tools/blocks.py aus tools/collections.json erzeugt.
         Änderungen hier gehen beim nächsten Deploy verloren. -->
    <div class="container section--tight">
      <a class="back-link" href="../recipes.html">‹ All recipes</a>
      <h1 style="font-size:1.875rem;margin-top:1rem">%s</h1>
      <p class="muted" style="margin-top:.5rem;max-width:65ch">%s</p>
      <p class="muted" style="margin-top:.5rem;font-size:.875rem">%d recipes</p>
      <div class="grid grid--3 mt-6">
%s
      </div>
    </div>
  </main>""" % (html.escape(c["h1"], quote=False), html.escape(c["intro"], quote=False), len(members), cards)
    return head + main + bottom


def collections():
    data = {k: v for k, v in json.loads(read("tools/collections.json")).items() if not k.startswith("_")}
    cards = recipe_cards()
    top, bottom = shell()
    changed, result = 0, {}
    for slug, c in data.items():
        members = [(s, v) for s, v in cards.items()
                   if any(re.search(c["match"], t, re.I) for t in [v[0]] + v[1])]
        if not members:
            print("  Sammlung %s ist leer – übersprungen." % slug)
            continue
        result[slug] = (c, [s for s, _ in members])
        page = "collections/%s.html" % slug
        changed += write(page, seo.render(page, collection_page(slug, c, members, top, bottom))[0])

    # Verwaiste Sammlungen (aus der JSON gelöscht) wieder entfernen.
    for path in glob.glob(os.path.join(ROOT, "collections", "*.html")):
        if os.path.basename(path)[:-5] not in result:
            os.remove(path)
            changed += 1

    nav = ('<!-- Sammlungen (geschrieben von tools/blocks.py) -->\n'
           '      <nav class="collections-nav no-scrollbar" aria-label="Recipe collections">\n'
           + "".join('        <a class="chip" href="collections/%s.html">%s</a>\n'
                     % (slug, html.escape(c["label"], quote=False)) for slug, (c, _) in result.items())
           + "      </nav>\n      <!-- /Sammlungen -->")
    src = read("recipes.html")
    anchor = re.search(r"[ \t]*<!-- Die neuesten Videos", src).group(0)
    changed += write("recipes.html", replace_between(src, "<!-- Sammlungen", "<!-- /Sammlungen -->",
                                                     "      " + nav, anchor))
    return changed, result


# --- 2b. Passende Rezepte unter jedem Rezept ---------------------------------

def related_recipes(result):
    """Drei thematisch passende Rezepte statt "More from <Grobkategorie>".

    Punkte: gleiche Sammlung 3, gleiches Wort im Namen ("sorbet", "mango")
    je 1, gleicher Tag 1, gleiche Grobkategorie (süß/herzhaft) 1. Bei Gleichstand gewinnt die Reihenfolge in recipes.html,
    also das neuere Rezept."""
    cards = recipe_cards()
    order = list(cards)
    member = {s: [c for c, (_, slugs) in result.items() if s in slugs] for s in cards}
    sweet = {s: "badge--sweet" in cards[s][2] for s in cards}

    def words(slug):
        return set(re.findall(r"[a-z]{4,}", cards[slug][0].lower())) - {"thick", "creamy", "easy", "healthy"}

    def score(a, b):
        return (3 * len(set(member[a]) & set(member[b]))
                + len(words(a) & words(b))
                + len(set(t.lower() for t in cards[a][1]) & set(t.lower() for t in cards[b][1]))
                + (sweet[a] == sweet[b]))

    changed = 0
    for slug in cards:
        picks = sorted((s for s in cards if s != slug), key=lambda s: (-score(slug, s), order.index(s)))[:3]
        head = '<h2 id="more-recipes" style="font-size:1.5rem">More like this</h2>'
        if member[slug]:
            c, slugs = result[member[slug][0]]
            head += ('\n          <a class="link-brand" href="../collections/%s.html">All %d in “%s” →</a>'
                     % (member[slug][0], len(slugs), html.escape(c["label"], quote=False)))
        block = ("<!-- Verwandt (geschrieben von tools/blocks.py) -->\n"
                 '      <section class="mt-12" aria-labelledby="more-recipes">\n'
                 '        <div class="section-head">\n          %s\n        </div>\n'
                 '        <div class="grid grid--3 mt-6">\n%s\n        </div>\n'
                 "      </section>\n      <!-- /Verwandt -->"
                 % (head, "\n".join("        " + cards[p][2] for p in picks)))
        path = "recipes/%s.html" % slug
        src = read(path)
        if "<!-- Verwandt" in src:
            new = replace_between(src, "<!-- Verwandt", "<!-- /Verwandt -->", "      " + block, "")
        else:
            new = re.sub(r'[ \t]*<section class="mt-12">\s*<h2[^>]*>More from.*?</section>',
                         lambda _: "      " + block, src, count=1, flags=re.S)
        changed += write(path, new)
    return changed


# --- 3. llms.txt -------------------------------------------------------------

def llms_txt(result):
    pages = {k: v for k, v in json.loads(read("tools/seo-pages.json")).items() if not k.startswith("_")}
    cards = recipe_cards()

    def line(path, name, desc):
        return "- [%s](%s%s): %s" % (name, SITE, "" if path == "index.html" else path, desc)

    out = [
        "# Constantinteck",
        "",
        "> " + DESCRIPTION,
        "",
        "Every recipe on this site is the written version of one of Constantin's videos "
        "(Instagram, TikTok and YouTube: @constantinteck): ingredients with quantities, numbered "
        "steps, time and servings, as plain text. The site is in English. Prices are in euros; "
        "no VAT is charged (small-business rule, § 19 UStG). Contact: info@constantinteck.com",
        "",
        "## Main pages",
        "",
        line("krimi-dinner.html", "Murder mystery dinners", pages["krimi-dinner.html"]["description"]),
        line("recipes.html", "All recipes", pages["recipes.html"]["description"]),
        line("shop.html", "Shop", pages["shop.html"]["description"]),
        line("about.html", "About Constantin", pages["about.html"]["description"]),
        "",
        "## Murder mystery dinners (sold by Murdernight, PDF)",
        "",
    ]
    for path in sorted(glob.glob(os.path.join(ROOT, "murder-mystery", "*.html"))):
        src = read(os.path.relpath(path, ROOT))
        name = html.unescape(re.search(r"<h1[^>]*>(.*?)</h1>", src, re.S).group(1))
        desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', src).group(1))
        out.append(line(os.path.relpath(path, ROOT), name, desc))
    out += [
        "",
        "## Recipe collections",
        "",
    ]
    out += [line("collections/%s.html" % s, c["h1"], c["description"]) for s, (c, _) in result.items()]
    out += ["", "## Recipes", ""]
    out += [line("recipes/%s.html" % s, cards[s][0], pages.get("recipes/%s.html" % s, {}).get("description", ""))
            for s in sorted(cards, key=lambda s: cards[s][0])]
    out += ["", "## Shop", ""]
    for path in ("shop/linen-apron.html", "shop/kids-apron.html", "shop/apron-set.html"):
        name = html.unescape(re.search(r"<h1[^>]*>(.*?)</h1>", read(path), re.S).group(1))
        out.append(line(path, name, pages[path]["description"]))
    out += [
        "",
        "## Optional",
        "",
        line("shipping-returns.html", "Shipping & returns", "Shipping costs, delivery and the 14-day return policy."),
        line("imprint.html", "Imprint (German)", "Legal notice: who runs this site."),
        "",
    ]
    return write("llms.txt", "\n".join(out))


def main():
    a = author_boxes()
    c, result = collections()
    r = related_recipes(result)
    l = llms_txt(result)
    print("  Autorenbox: %d Seiten, Sammlungen: %d Dateien, passende Rezepte: %d Seiten, llms.txt: %s."
          % (a, c, r, "neu" if l else "unverändert"))


if __name__ == "__main__":
    main()
