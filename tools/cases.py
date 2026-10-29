#!/usr/bin/env python3
"""
Krimi-Dinner: alles, was aus data/cases.json entsteht – an einer Stelle.

Aufruf (macht deploy.sh automatisch, als ERSTES Skript):
    python3 tools/cases.py

data/cases.json ist die einzige Quelle für die Fälle (Titel, Spieler, Dauer,
Cover, Murdernight-Adresse, Teaser, Menü, passende Rezepte). Dieses Skript
schreibt daraus:

  1. Auf JEDER Seite: Navigation (Murder Mystery zuerst), Ankündigungsleiste
     (Nov–Dez tauscht site.js den Text gegen den Fall mit Saison), im Fuß die
     Spalte "Murder Mystery" mit allen Fällen.
  2. murder-mystery/<id>.html – eine Seite je Fall (Teaser, Figuren, Menü,
     Kurz-FAQ, Kauf-Knopf). Kopf und Schema schreibt seo.py gleich mit.
  3. Die Fallkarten auf krimi-dinner.html, die Abschnitte der Startseite
     (Hero-Cover, "Pick your evening", Beispielmenü, neue Rezepte,
     Kundenstimmen) und die Box "Hosting a dinner?" auf jeder Rezeptseite.
  4. Den Datenblock in assets/js/krimi-dinner-data.js (für Filter und die
     Karte im Rezept-Raster).

MURDERNIGHT-LINKS: Jeder Link nach Murdernight entsteht in mn_url() und
trägt utm_source/medium/campaign aus cases.json plus utm_content = die Stelle
auf der Seite (home-pick, krimi-card, recipe-box …). Links von Navigation,
Leiste, Fuß usw. führen erst auf eigene Seiten; sie tragen data-via="<stelle>",
und site.js hängt diese Herkunft an utm_content der Kaufknöpfe mit
data-mn-funnel an ("krimi-card--from-nav"). So zeigt Murdernight auch, über
welchen Weg ein Kauf kam.

Läuft das Skript zweimal, ändert sich beim zweiten Mal nichts.
"""
import html
import json
import os
import re
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo import ROOT, SKIP_DIRS  # noqa: E402
import seo  # noqa: E402

DATA = json.load(open(os.path.join(ROOT, "data", "cases.json"), encoding="utf-8"))
SITE_CFG = DATA["site"]
LANG = SITE_CFG["lang"]
CASES = [c for c in DATA["cases"] if c.get(LANG)]
BY_ID = {c["id"]: c for c in CASES}
FOLDER = "murder-mystery"

LABELS = {
    "difficulty": {"easy": "Easy", "medium": "Medium", "tricky": "Tricky"},
    # Gleiche Sätze wie KRIMI_LABELS.en.difficultyHelp in krimi-dinner-data.js.
    # TODO: Erklärungen mit Murdernight abgleichen.
    "difficultyHelp": {
        "easy": "Easy: the clues lead fairly directly to the culprit – good for a first murder mystery night.",
        "medium": "Medium: some clues only make sense together – fine for mixed groups.",
        "tricky": "Tricky: the decisive clues are well hidden – for groups who like a real puzzle.",
    },
    "occasions": {
        "christmas": "Christmas party", "halloween": "Halloween party", "new-years-eve": "New Year's Eve",
        "birthday": "Birthday", "game-night": "Game night", "team-event": "Office party",
    },
    "courses": [("starter", "Starter"), ("main", "Main"), ("dessert", "Dessert")],
}

ICON_PLAYERS = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
                'stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M2.8 19.2a6.2 6.2 0 0 1 12.4 0"/>'
                '<path d="M16 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M18.2 14.4a6.2 6.2 0 0 1 3 4.8"/></svg>')
ICON_CLOCK = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>')
ICON_LENS = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>')
ICON_CASE = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><circle cx="10.6" cy="10.6" r="6.4"/><path d="m15.4 15.4 5.2 5.2"/>'
             '<path d="M8.2 10.6a2.4 2.4 0 0 1 2.4-2.4"/></svg>')
NEW_TAB = ' <span aria-hidden="true">↗</span><span class="sr-only"> (opens Murdernight in a new tab)</span>'


def esc(value):
    return html.escape(str(value), quote=True)


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


def write(path, text):
    full = os.path.join(ROOT, path)
    old = open(full, encoding="utf-8").read() if os.path.exists(full) else None
    if old == text:
        return False
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text)
    return True


def replace_between(src, start, end, block):
    """Ersetzt den Bereich von start bis end (beide eingeschlossen)."""
    pattern = r"[ \t]*" + re.escape(start) + r".*?" + re.escape(end)
    return re.sub(pattern, lambda _: block, src, count=1, flags=re.S)


def pages():
    found = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and d != "data")
        found += [os.path.relpath(os.path.join(dirpath, n), ROOT) for n in sorted(filenames) if n.endswith(".html")]
    return found


def root_of(page):
    # 404.html erscheint unter jeder Adresse – dort nur absolute Pfade.
    return "/" if page == "404.html" else "../" * page.count("/")


# --- Daten -------------------------------------------------------------------

def t(case):
    return case[LANG]


def price(value):
    return "€%.2f" % value


def players_range():
    nums = [int(n) for c in CASES for n in re.findall(r"\d+", c["players"])]
    return "%d–%d" % (min(nums), max(nums))


def hours_range():
    hs = sorted({c["hours"] for c in CASES})
    fmt = lambda h: ("%g" % h)
    return fmt(hs[0]) if len(hs) == 1 else "%s–%s" % (fmt(hs[0]), fmt(hs[-1]))


def lowest_price():
    return price(min(c["price"] for c in CASES))


def seasonal_cases():
    return [c for c in CASES if c.get("seasonal")]


def months(case):
    return ",".join(str(m) for m in case.get("seasonal", []))


def mn_url(path, content, campaign=None):
    """Der eine Weg zu einem Link nach Murdernight (siehe Kopf der Datei)."""
    params = dict(SITE_CFG["utm"])
    if campaign:
        params["utm_campaign"] = campaign
    params["utm_content"] = content
    return SITE_CFG["base"][LANG] + path + ("&" if "?" in path else "?") + urllib.parse.urlencode(params)


def case_url(case, content, campaign=None):
    return mn_url(t(case)["path"], content, campaign)


def buy_link(case, content, cls="btn btn--primary", label=None, campaign=None, funnel=False):
    label = label or "Get the case – %s" % price(case["price"])
    return ('<a class="%s" href="%s" target="_blank" rel="noopener" data-track="krimi-click/%s/%s"%s>%s%s</a>'
            % (cls, esc(case_url(case, content, campaign)), content, case["id"],
               " data-mn-funnel" if funnel else "", esc(label), NEW_TAB))


def case_page(case, root):
    return "%s%s/%s.html" % (root, FOLDER, case["id"])


_recipes = {}


def recipe(slug):
    """Titel und Bild eines Rezepts – aus seiner Seite, nicht doppelt gepflegt."""
    if slug not in _recipes:
        src = read("recipes/%s.html" % slug)
        title = html.unescape(re.sub(r"<[^>]+>", "", re.search(r"<h1[^>]*>(.*?)</h1>", src, re.S).group(1))).strip()
        _recipes[slug] = {"slug": slug, "title": title, "image": "assets/img/%s" % slug}
    return _recipes[slug]


def check_data():
    errors = []
    slugs = {os.path.basename(p)[:-5] for p in os.listdir(os.path.join(ROOT, "recipes")) if p.endswith(".html")}
    seen = {}
    for c in CASES:
        for k in ("id", "players", "hours", "difficulty", "price", "image"):
            if c.get(k) in (None, ""):
                errors.append("%s: Feld %s fehlt" % (c.get("id"), k))
        if not os.path.exists(os.path.join(ROOT, c["image"])):
            errors.append("%s: Cover %s fehlt" % (c["id"], c["image"]))
        for course, slug in c.get("menu", {}).items():
            if slug and slug not in slugs:
                errors.append("%s: Rezept %s (%s) gibt es nicht" % (c["id"], slug, course))
        for slug in c.get("recipes", []):
            if slug not in slugs:
                errors.append("%s: Rezept %s gibt es nicht" % (c["id"], slug))
            if slug in seen:
                errors.append("Rezept %s steht bei %s und %s – jedes Rezept zeigt auf genau einen Fall"
                              % (slug, seen[slug], c["id"]))
            seen[slug] = c["id"]
    for key in ("picks", "heroCovers"):
        errors += ["home.%s: Fall %s gibt es nicht" % (key, i) for i in DATA["home"][key] if i not in BY_ID]
    if DATA["home"]["exampleMenu"] not in BY_ID:
        errors.append("home.exampleMenu: Fall gibt es nicht")
    missing = sorted(slugs - set(seen))
    if errors:
        print("  FEHLER in data/cases.json:\n    " + "\n    ".join(errors))
        sys.exit(1)
    return missing


# --- Bausteine ---------------------------------------------------------------

def cover(case, root, sizes, eager=False, alt=None, priority=False):
    """Cover als <picture>: WebP 240/400/675 (tools/krimi-images.py), JPEG als
    Rückfall. Hochformat 3:4, wird nie beschnitten."""
    base = root + case["image"][:-4]
    if alt is None:
        alt = "Cover of the murder mystery dinner %s – %s" % (t(case)["title"], t(case)["setting"])
    return ('<picture><source type="image/webp" srcset="%s-240.webp 240w, %s-400.webp 400w, %s-675.webp 675w" sizes="%s">'
            '<img src="%s%s" width="675" height="900" alt="%s" loading="%s" decoding="async"%s></picture>'
            % (base, base, base, sizes, root, case["image"], esc(alt), "eager" if eager else "lazy",
               ' fetchpriority="high"' if priority else ""))


def meta_line(case):
    return ('<span>%s%s players</span><span>%sapprox. %g hrs</span>'
            % (ICON_PLAYERS, esc(case["players"]), ICON_CLOCK, case["hours"]))


def difficulty(case, scope):
    level = {"easy": 1, "medium": 2, "tricky": 3}[case["difficulty"]]
    ident = "krimi-diff-%s-%s" % (scope, case["id"])
    icons = "".join('<span class="krimi-diff__step%s">%s</span>' % (" is-on" if i <= level else "", ICON_LENS)
                    for i in range(1, 4))
    return ('<button type="button" class="krimi-diff" aria-describedby="%s"><span class="krimi-diff__icons" aria-hidden="true">%s</span>'
            '<span class="sr-only">Difficulty: </span>%s</button><span class="krimi-diff__tip" role="tooltip" id="%s">%s</span>'
            % (ident, icons, LABELS["difficulty"][case["difficulty"]], ident, esc(LABELS["difficultyHelp"][case["difficulty"]])))


def perfect_for(case):
    names = [LABELS["occasions"][k] for k in case.get("occasions", []) if k in LABELS["occasions"]]
    if not names:
        return ""
    return ('<p class="krimi-card__for"><b>Perfect for:</b> %s</p>'
            % " ".join('<span class="tag">%s</span>' % esc(n) for n in names))


def teaser(case, cls="krimi-card__teaser"):
    text = t(case).get("teaser")
    if text:
        return '<p class="%s">%s</p>' % (cls, esc(text))
    return "<!-- TODO: Teaser für %s (1–2 Sätze: wer ist tot, warum ist jeder verdächtig?) in data/cases.json -->" % case["id"]


def menu_list(case, root, via):
    """Menü als Liste: Gang + Rezeptlink. Leere Gänge -> TODO-Kommentar."""
    items = []
    for key, label in LABELS["courses"]:
        slug = case.get("menu", {}).get(key)
        if not slug:
            items.append("<!-- TODO: %s für %s in data/cases.json (menu.%s) -->" % (label, case["id"], key))
            continue
        items.append('<li><span class="case-menu__course">%s</span><a href="%srecipes/%s.html" data-track="krimi-menu/%s/%s">%s</a></li>'
                     % (label, root, slug, via, slug, esc(recipe(slug)["title"])))
    return '<ul class="case-menu">%s</ul>' % "".join(items)


def case_card(case, root, placement, index, menu=True):
    """Fallkarte: Cover und Titel führen auf die eigene Fallseite, der Knopf
    direkt zu Murdernight (utm_content = placement)."""
    page = case_page(case, root)
    via = ' data-via="%s"' % placement
    return (
        '<article class="card krimi-card">'
        '<a class="krimi-card__media" href="%s" tabindex="-1" aria-hidden="true"%s>%s'
        '<span class="krimi-card__badge" data-season-badge hidden>Seasonal pick</span></a>'
        '<div class="krimi-card__head"><span class="tag krimi-card__genre">%s</span>'
        '<h3><a href="%s"%s>%s</a></h3><p class="krimi-card__setting">%s</p>'
        '<div class="recipe-card__meta">%s</div><div class="krimi-card__diff">%s</div></div>'
        '<div class="krimi-card__body">%s%s%s'
        '<div class="krimi-card__foot">%s<a class="krimi-card__more" href="%s"%s>Details &amp; menu <span aria-hidden="true">→</span></a></div>'
        "</div></article>"
        % (page, via, cover(case, root, "(min-width: 1024px) 330px, (min-width: 640px) 45vw, 40vw",
                                    eager=index < 2 and placement == "krimi-card"),
           esc(t(case)["genre"]), page, via, esc(t(case)["title"]), esc(t(case)["setting"]),
           meta_line(case), difficulty(case, placement), teaser(case), perfect_for(case),
           ('<div class="krimi-card__menu"><p class="krimi-card__menu-title">Menu for this case</p>%s</div>'
            % menu_list(case, root, placement)) if menu else "",
           buy_link(case, placement, funnel=placement == "krimi-card",
                    label=None if menu else "Get it – %s" % price(case["price"])), page, via))


def season_attrs(case):
    return ' data-seasonal="%s"' % months(case) if case.get("seasonal") else ""


# --- 1. Auf jeder Seite ------------------------------------------------------

NAV = [("krimi-dinner.html", "Murder Mystery"), ("recipes.html", "Recipes"), ("shop.html", "Shop"), ("about.html", "About")]


def active(page):
    if page == "krimi-dinner.html" or page.startswith(FOLDER + "/"):
        return "krimi-dinner.html"
    if page in ("recipes.html",) or page.startswith(("recipes/", "collections/")):
        return "recipes.html"
    if page in ("shop.html", "cart.html") or page.startswith("shop/"):
        return "shop.html"
    return page


def nav(page, root):
    on = active(page)
    desk, mobile = [], []
    for href, label in NAV:
        feature = href == "krimi-dinner.html"
        is_on = href == on
        cur = ' aria-current="page"' if is_on else ""
        via = ' data-via="nav"' if feature else ""
        desk.append('<a class="nav__link%s%s" href="%s%s"%s%s>%s</a>'
                    % (" nav__link--feature" if feature else "", " is-active" if is_on else "", root, href, cur, via, label))
        mobile.append('<a class="chip%s%s" href="%s%s"%s%s>%s</a>'
                      % (" chip--feature" if feature else "", " is-active" if is_on else "", root, href, cur, via, label))
    return ('<nav class="nav" aria-label="Main">\n        ' + "\n        ".join(desk) + "\n        </nav>",
            '<nav class="nav-mobile no-scrollbar" aria-label="Main">\n      ' + "\n      ".join(mobile) + "\n    </nav>")


def banner(root):
    """Standardtext für alle Monate; die Daten für den Fall mit Saison stehen
    als data-season-* am Link, site.js tauscht sie im Browser (Datum des
    Besuchers – eine statische Seite kennt das heutige Datum nicht)."""
    season = ""
    sc = seasonal_cases()
    if sc:
        c = sc[0]
        occasion = LABELS["occasions"].get((c.get("occasions") or [""])[0], "")
        tip = "Christmas tip" if "christmas" in c.get("occasions", []) else "Seasonal pick"
        season = (' data-season-months="%s" data-season-href="%s" data-season-short="%s" data-season-long="%s"'
                  ' data-season-track="banner-click/%s"'
                  % (months(c), case_page(c, root), esc("%s: %s · %s" % (tip, t(c)["title"], price(c["price"]))),
                     esc("%s: %s – the murder mystery dinner for your %s, %s players · %s"
                         % (tip, t(c)["title"], occasion or "evening", c["players"], price(c["price"]))),
                     c["id"]))
    return """<!-- Ankündigungsleiste (geschrieben von tools/cases.py aus data/cases.json). Im
       Zeitraum des Falls mit Saison tauscht assets/js/site.js Text und Ziel
       (data-season-*). Schürzen werden hier nicht beworben. -->
  <div class="announcement">
    <div class="container announcement__inner">
      <a class="announcement__deal" href="%skrimi-dinner.html" data-via="banner" data-track="banner-click/all-cases"%s>
        <span class="announcement__dot" aria-hidden="true"></span>
        <span class="only-narrow">%d murder mystery dinners · %s each</span>
        <span class="only-wide">%d murder mystery dinners – %s each · cook the menu, solve the case</span>
        <span aria-hidden="true">→</span>
      </a>
      <p class="announcement__terms">Instant PDF · %s players</p>
    </div>
  </div>""" % (root, season, len(CASES), lowest_price(), len(CASES), lowest_price(), players_range())


def footer_column(root):
    links = "\n".join('          <li><a href="%s" data-via="footer">%s</a></li>' % (case_page(c, root), esc(t(c)["title"]))
                      for c in CASES)
    return """      <!-- Faelle (geschrieben von tools/cases.py) -->
      <div>
        <h2>Murder Mystery</h2>
        <ul>
%s
          <li><a href="%skrimi-dinner.html" data-via="footer">All %d cases →</a></li>
        </ul>
      </div>
      <!-- /Faelle -->""" % (links, root, len(CASES))


def static_links(src):
    """<a data-mn="shop|home" data-mn-content="stelle"> -> fertiger Murdernight-Link."""
    def fix(m):
        tag = re.sub(r'\s(?:href|target|rel)="[^"]*"', "", m.group(0))
        attrs = dict(re.findall(r'(data-mn(?:-content)?)="([^"]*)"', tag))
        url = mn_url(SITE_CFG["paths"][LANG][attrs["data-mn"]], attrs.get("data-mn-content", "link"))
        return tag[:-1] + ' href="%s" target="_blank" rel="noopener">' % esc(url)
    return re.sub(r"<a\b[^>]*\bdata-mn=\"[^\"]+\"[^>]*>", fix, src)


def apply_global(page, src):
    root = root_of(page)
    src = static_links(src)
    desk, mobile = nav(page, root)
    src = re.sub(r'<nav class="nav" aria-label="Main">.*?</nav>', lambda _: desk, src, count=1, flags=re.S)
    src = re.sub(r'<nav class="nav-mobile[^"]*" aria-label="Main">.*?</nav>', lambda _: mobile, src, count=1, flags=re.S)
    src = re.sub(r'(?:<!--(?:(?!-->).)*-->\s*)?<div class="announcement">\s*<div class="container announcement__inner">.*?</div>\s*</div>',
                 lambda _: banner(root), src, count=1, flags=re.S)
    src = re.sub(r'<p class="site-footer__claim">.*?</p>',
                 '<p class="site-footer__claim">Murder mystery dinners – and the recipes from my videos to cook for them.</p>',
                 src, count=1, flags=re.S)
    src = re.sub(r"(<h2>Pages</h2>\s*<ul>).*?(</ul>)", lambda m: m.group(1) + "\n" + "\n".join(
        '          <li><a href="%s%s">%s</a></li>' % (root, h, l)
        for h, l in [("index.html", "Home")] + NAV) + "\n        " + m.group(2), src, count=1, flags=re.S)
    if "<!-- Streifen (geschrieben" in src:
        via = "recipes-strip" if page == "recipes.html" else "shop-strip"
        lead = "Turn dinner into a mystery" if page == "recipes.html" else "New: murder mystery dinners"
        strip = ('    <a class="mystery-strip" href="%skrimi-dinner.html" data-via="%s">'
                 '<span class="container mystery-strip__inner"><span class="mystery-strip__icon">%s</span>'
                 '<span class="mystery-strip__text"><b>%s</b> – %d cases with a menu to cook, %s each</span>'
                 '<span class="mystery-strip__arrow" aria-hidden="true">→</span></span></a>'
                 % (root, via, ICON_CASE, lead, len(CASES), lowest_price()))
        src = replace_between(src, "<!-- Streifen (geschrieben", "<!-- /Streifen -->", block("Streifen", strip, "    "))
    src = re.sub(r"(<span data-krimi-count>)[^<]*(</span>)", lambda m: m.group(1) + str(len(CASES)) + m.group(2), src)
    src = re.sub(r"(<span data-krimi-from-price>)[^<]*(</span>)", lambda m: m.group(1) + lowest_price() + m.group(2), src)
    col = footer_column(root)
    if "<!-- Faelle (geschrieben" in src:
        src = replace_between(src, "<!-- Faelle (geschrieben", "<!-- /Faelle -->", col)
    else:
        src = re.sub(r"([ \t]*<div>\s*<h2>Pages</h2>)", lambda m: col + "\n\n" + m.group(1), src, count=1)
    return src


# --- 2. Fallseiten -----------------------------------------------------------

def shell():
    """Kopf und Fuß von krimi-dinner.html, Pfade eine Ebene tiefer."""
    src = read("krimi-dinner.html")
    top, bottom = src[:src.index("<main")], src[src.index("</main>") + len("</main>"):]
    top = re.sub(r"[ \t]*<!-- Strukturierte Daten.*?<!-- /Strukturierte Daten -->\n?", "", top, flags=re.S)
    bottom = re.sub(r'\s*<script src="assets/js/(?!shop-data|site-config|site\.js|cart\.js)[^"]+"[^>]*></script>', "", bottom)

    def deeper(part):
        return re.sub(r'((?:href|src)=")(?!https?:|mailto:|tel:|#|/|data:)', r"\1../", part)
    return deeper(top), deeper(bottom)


def page_title(case):
    title, players = t(case)["title"], case["players"]
    for pattern in ("{t} – Murder Mystery Dinner for {p} Players (PDF)",
                    "{t} – Murder Mystery Dinner for {p} Players",
                    "{t} – Murder Mystery Dinner, {p} Players",
                    "{t} – Murder Mystery Dinner"):
        text = pattern.format(t=title, p=players)
        if len(text) <= 65:
            return text
    return title


def page_description(case):
    c, x = case, t(case)
    first = x["setting"].split(" ", 1)[0]
    setting = x["setting"][0].lower() + x["setting"][1:] if first in ("A", "An", "The") else x["setting"]
    for pattern in (
        "Printable murder mystery dinner for {p} players: {s}. About {h:g} hours, {d}. "
        "Instant PDF for {pr} – plus a menu to cook from my recipes.",
        "Murder mystery dinner for {p} players: {s}. About {h:g} hours. Instant PDF, {pr} – with a menu to cook.",
        "Murder mystery dinner for {p} players, about {h:g} hours. Instant PDF, {pr} – with a menu to cook.",
    ):
        text = pattern.format(p=c["players"], s=setting, h=c["hours"], d=LABELS["difficulty"][c["difficulty"]].lower(),
                              pr=price(c["price"]))
        if len(text) <= 165:
            return text
    return text


def roles_section(case):
    roles = [r for r in t(case).get("roles", []) if r.get("name")]
    if not roles:
        return ("      <!-- TODO: Figuren-Überblick für %s (ohne Spoiler) in data/cases.json unter %s.roles "
                "eintragen: [{\"name\": \"…\", \"role\": \"…\", \"text\": \"…\"}]. Bis dahin erscheint der Abschnitt nicht. -->\n"
                % (case["id"], LANG))
    # Name und Rolle sichtbar, die Beschreibung zum Aufklappen – zwölf volle
    # Texte untereinander wären am Handy mehrere Bildschirme lang.
    items = "".join('<li><details class="case-role"><summary><span class="case-role__name">%s</span>%s</summary>'
                    '<p class="muted">%s</p></details></li>'
                    % (esc(r["name"]), ('<span class="case-role__role">%s</span>' % esc(r["role"])) if r.get("role") else "",
                       esc(r.get("text", ""))) for r in roles)
    return """      <section class="shop-section" aria-labelledby="roles">
        <div class="section-head"><div><h2 id="roles">Who's at the table</h2><p>%d characters – everyone plays one. Tap a name for more, no spoilers.</p></div></div>
        <ul class="case-roles">%s</ul>
      </section>
""" % (len(roles), items)


def course_cards(case, root, via):
    cards = []
    for key, label in LABELS["courses"]:
        slug = case.get("menu", {}).get(key)
        if not slug:
            cards.append("<!-- TODO: %s für %s in data/cases.json (menu.%s) -->" % (label, case["id"], key))
            continue
        r = recipe(slug)
        cards.append(
            '<a class="card course-card lift" href="%srecipes/%s.html" data-track="krimi-menu/%s/%s">'
            '<picture><source type="image/avif" srcset="%s%s-480.avif" sizes="96px"><img src="%s%s.jpg" width="900" height="1600" alt="" loading="lazy" decoding="async"></picture>'
            '<span class="course-card__text"><span class="course-card__course">%s</span><span class="course-card__title">%s</span>'
            '<span class="course-card__more">Get the recipe →</span></span></a>'
            % (root, slug, via, slug, root, r["image"], root, r["image"], label, esc(r["title"])))
    return '<div class="course-cards">%s</div>' % "".join(cards)


def case_faq(case):
    others = "All %d cases are also available in German at murdernight.de." % len(CASES) if case.get("de") else ""
    qa = [
        ("How many players do I need?",
         "%s is written for %s players. Need a case for a different group size? All %d cases are on the overview page."
         % (t(case)["title"], case["players"], len(CASES))),
        ("How long does the evening take?",
         "Plan about %g hours, including dinner – the case is solved between the courses." % case["hours"]),
        ("Do I have to print anything?", "No. You can print the PDF at home or play straight from your phones."),
        ("Which language is the game in?", ("This version is in English. " + others).strip()),
        ("How do I get the PDF?",
         "Pay at Murdernight, the shop I co-own – card, PayPal, Apple Pay and more. "
         "The PDF is ready to download right after payment."),
    ]
    return "\n".join(
        '          <details class="faq__item">\n            <summary>%s</summary>\n'
        '            <div class="faq__answer">\n              <p>%s</p>\n            </div>\n          </details>'
        % (esc(q), esc(a)) for q, a in qa)


def other_cases(case, root):
    others = [c for c in CASES if c is not case][:3]
    return "".join(
        '<li><a class="other-case lift" href="%s" data-via="case-page-others">%s<span>%s</span></a></li>'
        % (case_page(c, root), cover(c, root, "120px", alt=""), esc(t(c)["title"])) for c in others)


def build_case_page(case, top, bottom):
    page = "%s/%s.html" % (FOLDER, case["id"])
    root = "../"
    x = t(case)
    head = re.sub(r"<title>.*?</title>", "<title>%s</title>" % esc(page_title(case)), top, count=1, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*">',
                  lambda _: '<meta name="description" content="%s">' % esc(page_description(case)), head, count=1)
    head = re.sub(r'<meta property="og:type" content="[^"]*">', '<meta property="og:type" content="product">', head, count=1)
    head = re.sub(r'<meta property="og:image" content="[^"]*">',
                  '<meta property="og:image" content="%sassets/img/krimi/og/%s.jpg">' % (seo.SITE, case["id"]), head, count=1)
    head = re.sub(r'<meta property="og:image:alt" content="[^"]*">',
                  lambda _: '<meta property="og:image:alt" content="%s">' % esc("Cover of the murder mystery dinner " + x["title"]),
                  head, count=1)

    facts = "".join('<div><dt>%s</dt><dd>%s</dd></div>' % (k, v) for k, v in [
        ("Players", esc(case["players"])), ("Duration", "approx. %g hrs" % case["hours"]),
        ("Difficulty", LABELS["difficulty"][case["difficulty"]]), ("Price", price(case["price"]) + " · PDF")])

    main = """<main id="content">
    <!-- Fallseite – geschrieben von tools/cases.py aus data/cases.json. Nicht von Hand ändern. -->
    <section class="band--dough">
      <div class="container case-hero">
        <a class="back-link" href="../krimi-dinner.html">‹ All murder mystery dinners</a>
        <div class="case-hero__grid">
          <div class="case-hero__cover">%(cover)s</div>
          <div class="case-hero__text">
            <p class="eyebrow">Murder mystery dinner · %(genre)s</p>
            <h1>%(title)s</h1>
            <p class="case-hero__setting">%(setting)s</p>
            %(teaser)s
            <dl class="recipe-facts case-facts">%(facts)s</dl>
            %(perfect)s
            <div class="case-hero__actions">
              %(buy)s
              <a class="btn btn--secondary" href="#menu">See the menu</a>
            </div>
            <p class="case-hero__note">Secure payment and instant PDF download via Murdernight – a shop I co-own.</p>
          </div>
        </div>
      </div>
    </section>

    <div class="container section">
      <section class="shop-section" aria-labelledby="menu">
        <div class="section-head">
          <div>
            <h2 id="menu">Menu for this case</h2>
            <p>Three courses from my videos – every recipe is free.</p>
          </div>
          <a class="link-brand" href="../recipes.html">All recipes</a>
        </div>
        %(courses)s
      </section>

%(roles)s
      <section class="shop-section" aria-labelledby="how">
        <div class="section-head"><div><h2 id="how">How the evening works</h2></div></div>
        <ol class="steps steps--3">
          <li><span class="steps__num" aria-hidden="true">1</span><h3>Buy &amp; print</h3><p>Instant PDF after payment – print it or play from your phones.</p></li>
          <li><span class="steps__num" aria-hidden="true">2</span><h3>Cook the menu</h3><p>Starter, main and dessert from the recipes above.</p></li>
          <li><span class="steps__num" aria-hidden="true">3</span><h3>Solve the case</h3><p>Everyone plays a role – the case unfolds between the courses.</p></li>
        </ol>
      </section>

      <section class="shop-section" aria-labelledby="faq">
        <div class="section-head"><div><h2 id="faq">Questions</h2></div></div>
        <div class="faq" data-faq>
%(faq)s
        </div>
      </section>

      <section class="feature feature--split mt-12">
        <div>
          <h2>Ready to host %(title)s?</h2>
          <p class="feature__text">%(players)s players · approx. %(hours)g hrs · %(price)s, instant PDF via Murdernight.</p>
        </div>
        <div class="feature__actions">
          %(buy_bottom)s
          <a href="../krimi-dinner.html">See all %(count)d cases</a>
        </div>
      </section>

      <section class="shop-section" aria-labelledby="more-cases">
        <div class="section-head"><div><h2 id="more-cases">More cases</h2></div>
          <a class="link-brand" href="../krimi-dinner.html">All %(count)d cases</a></div>
        <ul class="other-cases">%(others)s</ul>
      </section>
    </div>
  </main>""" % {
        "cover": cover(case, root, "(min-width: 768px) 320px, 60vw", eager=True, priority=True),
        "genre": esc(x["genre"]), "title": esc(x["title"]), "setting": esc(x["setting"]),
        "teaser": teaser(case, "lede case-hero__teaser"), "facts": facts, "perfect": perfect_for(case),
        "buy": buy_link(case, "case-page-hero", funnel=True),
        "buy_bottom": buy_link(case, "case-page-bottom", funnel=True),
        "roles": roles_section(case), "courses": course_cards(case, root, "case-page"),
        "faq": case_faq(case), "players": esc(case["players"]), "hours": case["hours"],
        "price": price(case["price"]), "count": len(CASES), "others": other_cases(case, root),
    }
    src = apply_global(page, head + main + bottom)
    # Kopf, Canonical und Schema gleich fertig schreiben (wie blocks.py).
    rendered = seo.render(page, src, {})
    return page, rendered[0] if rendered else src


def case_pages():
    top, bottom = shell()
    wanted = set()
    changed = 0
    for case in CASES:
        page, src = build_case_page(case, top, bottom)
        wanted.add(page)
        changed += write(page, src)
    folder = os.path.join(ROOT, FOLDER)
    for name in os.listdir(folder):
        if name.endswith(".html") and "%s/%s" % (FOLDER, name) not in wanted:
            os.remove(os.path.join(folder, name))
            changed += 1
    return changed


# --- 3. Blöcke auf bestehenden Seiten ----------------------------------------

def block(name, inner, indent="      "):
    source = "assets/js/recipe-data.js" if name == "Neueste" else "data/cases.json"
    return ("%s<!-- %s (geschrieben von tools/cases.py aus %s) -->\n%s\n%s<!-- /%s -->"
            % (indent, name, source, inner, indent, name))


def fill(src, name, inner, indent="      "):
    start = "<!-- %s (geschrieben" % name
    if start not in src:
        print("  Hinweis: Platzhalter <!-- %s ... --> nicht gefunden" % name)
        return src
    return replace_between(src, start, "<!-- /%s -->" % name, block(name, inner, indent))


def krimi_page():
    src = read("krimi-dinner.html")
    cards = "\n".join(
        '        <div class="krimi-cases__item" data-krimi-case="%s"%s>%s</div>'
        % (c["id"], season_attrs(c), case_card(c, "", "krimi-card", i)) for i, c in enumerate(CASES))
    src = fill(src, "Fallkarten", '        <div class="grid grid--cases" data-krimi-cases>\n%s\n        </div>' % cards, "        ")
    return write("krimi-dinner.html", apply_global("krimi-dinner.html", src))


def latest_row():
    """Die drei neuesten Rezepte oben auf recipes.html – fertig im HTML statt
    per Skript eingesetzt, damit nichts nachträglich verrutscht (CLS)."""
    src = read("recipes.html")
    cards = []
    for i, card in enumerate(latest_recipes(3, raw=True)):
        # In der Wisch-Reihe ist eine Karte ~72 % breit (styles.css .latest__row).
        card = card.replace('sizes="(min-width: 768px) 33vw, 100vw"', 'sizes="(min-width: 1024px) 25vw, (min-width: 640px) 16rem, 72vw"')
        if i == 0:
            card = card.replace("<img ", '<img fetchpriority="high" ', 1)
        card = re.sub(r'\s(?:data-recipe-card|data-category="[^"]*"|data-minutes="[^"]*"|data-difficulty="[^"]*"|data-search="[^"]*")', "", card)
        cards.append("        " + card.replace(' loading="lazy"', ""))
    src = fill(src, "Neueste", "\n".join(cards), "        ")
    return write("recipes.html", apply_global("recipes.html", src))


def latest_recipes(count=6, raw=False):
    order = dict((s, int(o)) for s, o in re.findall(r'"([a-z0-9-]+)"\s*:\s*\{\s*order:\s*(\d+)', read("assets/js/recipe-data.js")))
    cards = {}
    grid = read("recipes.html")
    grid = grid[grid.find("<!-- /Neueste -->"):]  # nur das Raster, nicht die Reihe oben
    for m in re.finditer(r'<a class="card recipe-card[^"]*" href="recipes/([^"]+)\.html".*?</a>', grid, re.S):
        cards.setdefault(m.group(1), m.group(0))
    slugs = sorted((s for s in cards if s in order), key=lambda s: -order[s])[:count]
    if raw:
        return [cards[s] for s in slugs]
    return "\n".join("        " + cards[s] for s in slugs)


def home():
    src = read("index.html")
    hd = DATA["home"]
    covers = [BY_ID[i] for i in hd["heroCovers"]]
    hero = "".join('<span class="home-hero__cover home-hero__cover--%d">%s</span>'
                   % (i + 1, cover(c, "", "(min-width: 1024px) 220px, 30vw", eager=True, alt="", priority=i == 1))
                   for i, c in enumerate(covers))
    src = fill(src, "Hero-Cover", '          <div class="home-hero__covers" role="img" aria-label="%s">%s</div>' % (
        esc("Covers of three murder mystery dinners: " + ", ".join(t(c)["title"] for c in covers)), hero), "          ")

    hero_facts = ('<li>%s players</li><li>approx. %s hrs</li><li>Instant PDF</li><li>%s per case</li>'
                  % (players_range(), hours_range(), lowest_price()))
    src = fill(src, "Hero-Fakten", '          <ul class="home-hero__facts">%s</ul>' % hero_facts, "          ")

    # Fälle mit Saison stehen vorn, aber nur in ihren Monaten (site.js); außerhalb
    # davon zeigt die Liste stattdessen den letzten der "picks".
    picks = [BY_ID[i] for i in hd["picks"]]
    items = []
    for c in seasonal_cases():
        if c in picks:
            continue
        items.append('<div class="krimi-cases__item" data-season-only="%s" hidden>%s</div>'
                     % (months(c), case_card(c, "", "home-pick", 0, menu=False)))
    for i, c in enumerate(picks):
        extra = ""
        if i == len(picks) - 1 and seasonal_cases():
            extra = ' data-off-season-only="%s"' % months(seasonal_cases()[0])
        items.append('<div class="krimi-cases__item"%s>%s</div>' % (extra, case_card(c, "", "home-pick", i + 1, menu=False)))
    src = fill(src, "Auswahl", '        <div class="grid grid--cases home-picks">\n          %s\n        </div>'
               % "\n          ".join(items), "        ")

    ex = BY_ID[hd["exampleMenu"]]
    example = """        <div class="menu-example">
          <a class="menu-example__cover lift" href="%(page)s" data-via="home-menu">%(cover)s</a>
          <div class="menu-example__body">
            <p class="eyebrow">Example: %(genre)s · %(players)s players</p>
            <h3 class="menu-example__title"><a href="%(page)s" data-via="home-menu">%(title)s</a></h3>
            <p class="muted">%(setting)s</p>
            %(courses)s
            <div class="menu-example__actions">
              %(buy)s
              <a class="link-brand" href="%(page)s#menu" data-via="home-menu">See the full case →</a>
            </div>
          </div>
        </div>""" % {
        "page": case_page(ex, ""), "cover": cover(ex, "", "(min-width: 768px) 240px, 40vw"),
        "genre": esc(t(ex)["genre"]), "players": esc(ex["players"]), "title": esc(t(ex)["title"]),
        "setting": esc(t(ex)["setting"]), "courses": course_cards(ex, "", "home-menu"),
        "buy": buy_link(ex, "home-menu", cls="btn btn--primary"),
    }
    src = fill(src, "Beispielmenue", example, "        ")
    src = fill(src, "Neue Rezepte", '        <div class="grid grid--3 mt-6">\n%s\n        </div>' % latest_recipes(), "        ")
    src = fill(src, "Stimmen", social_block(""), "    ")
    return write("index.html", apply_global("index.html", src))


def social_block(root):
    social = DATA.get("social") or {}
    reviews = [r for r in social.get("reviews", []) if r.get("quote")]
    photos = [p for p in social.get("photos", []) if p.get("image")]
    if not reviews and not photos:
        return ("    <!-- TODO: Echte Kundenstimmen/Fotos in data/cases.json unter social eintragen. "
                "Solange die Listen leer sind, erscheint dieser Abschnitt nicht. -->")
    quotes = "".join(
        '<figure class="panel krimi-review"><blockquote>%s</blockquote><figcaption>%s%s</figcaption></figure>'
        % (esc(r["quote"]), esc(r.get("by", "")), (" · " + esc(t(BY_ID[r["caseId"]])["title"])) if r.get("caseId") in BY_ID else "")
        for r in reviews)
    pics = "".join('<li><figure><img src="%s%s" alt="%s" loading="lazy">%s</figure></li>'
                   % (root, esc(p["image"]), esc(p.get("alt", "")), ("<figcaption>%s</figcaption>" % esc(p["by"])) if p.get("by") else "")
                   for p in photos)
    return """    <section class="container section" aria-labelledby="voices">
      <h2 id="voices">From your murder mystery nights</h2>
      %s%s
    </section>""" % (('<div class="grid grid--3 mt-6">%s</div>' % quotes) if quotes else "",
                     ('<ul class="customer-photos no-scrollbar mt-6">%s</ul>' % pics) if pics else "")


def recipe_box(case, slug):
    page = case_page(case, "../")
    return """      <aside class="panel panel--outline case-box" aria-labelledby="case-box-title">
        <a class="case-box__cover" href="%(page)s" tabindex="-1" aria-hidden="true" data-via="recipe-box">%(cover)s</a>
        <div class="case-box__text">
          <p class="eyebrow">Hosting a dinner?</p>
          <p class="case-box__lead" id="case-box-title">This dish fits the murder mystery <a href="%(page)s" data-via="recipe-box">%(title)s</a>.</p>
          <p class="case-box__meta">%(players)s players · approx. %(hours)g hrs · instant PDF</p>
          <div class="case-box__actions">
            %(buy)s
            <a class="link-brand" href="%(page)s#menu" data-via="recipe-box">See the full menu</a>
          </div>
        </div>
      </aside>""" % {
        "page": page, "cover": cover(case, "../", "88px", alt=""), "title": esc(t(case)["title"]),
        "players": esc(case["players"]), "hours": case["hours"],
        "buy": buy_link(case, "recipe-box", cls="btn btn--primary btn--sm", campaign=SITE_CFG["recipeCampaign"]),
    }


def outer_div(src, start):
    """Ende des <div>, das bei start beginnt (verschachtelte divs gezählt)."""
    depth, i = 0, start
    for m in re.finditer(r"<div\b|</div>", src[start:]):
        depth += 1 if m.group(0) == "<div" else -1
        if depth == 0:
            return start + m.end()
    raise ValueError("div ohne Ende")


def recipe_pages():
    owner = {slug: c for c in CASES for slug in c.get("recipes", [])}
    changed = 0
    for name in sorted(os.listdir(os.path.join(ROOT, "recipes"))):
        if not name.endswith(".html"):
            continue
        slug, page = name[:-5], "recipes/" + name
        src = read(page)
        case = owner.get(slug)
        inner = recipe_box(case, slug) if case else "      <!-- TODO: Rezept in data/cases.json einem Fall zuordnen -->"
        box = block("Krimi-Box", inner, "          ")
        if "<!-- Krimi-Box (geschrieben" in src:
            src = replace_between(src, "<!-- Krimi-Box (geschrieben", "<!-- /Krimi-Box -->", box)
        else:
            # Direkt nach der Zutatenliste.
            m = re.search(r'<section class="panel ingredients".*?</section>\n', src, re.S)
            src = src[:m.end()] + "\n" + box + "\n" + src[m.end():]

        # Die Schürzen-Karte steht nachrangig UNTER der Zubereitung (einmalig
        # verschoben; danach steht sie dort und wird nicht mehr angefasst).
        side = src.find('<div class="recipe-body__side">')
        prod = src.find('<div class="recipe-product"')
        if side != -1 and prod != -1 and prod < outer_div(src, side):
            comment = src.rfind("<!-- Der Shop-Block", 0, prod)
            begin = src.rfind("\n", 0, comment if comment != -1 else prod) + 1
            end = outer_div(src, prod)
            chunk = src[begin:end]
            src = src[:begin].rstrip(" ") + src[end:].lstrip("\n")
            side = src.find('<div class="recipe-body__side">')
            body = src.rfind('<div class="recipe-body">', 0, side)
            body_end = outer_div(src, body)
            chunk = re.sub(r"<!-- Der Shop-Block.*?-->",
                           "<!-- Schürzen-Karte, nachrangig unter der Zubereitung. Was hier im HTML\n"
                           "           steht, ist nur der Rückfall ohne JavaScript – assets/js/recipe-product.js\n"
                           "           setzt das zum Rezept passende Produkt ein. -->", chunk, flags=re.S)
            chunk = chunk.replace('class="recipe-product"', 'class="recipe-product mt-6"', 1)
            src = src[:body_end] + "\n\n      " + chunk.strip() + "\n" + src[body_end:]
        changed += write(page, apply_global(page, src))
    return changed


# --- 4. Datenblock für die Skripte --------------------------------------------

def js_data():
    path = "assets/js/krimi-dinner-data.js"
    src = read(path)
    site = {k: v for k, v in SITE_CFG.items() if not k.startswith("_")}
    cases = [{k: v for k, v in c.items() if not k.startswith("_")} for c in DATA["cases"]]
    body = ("/* Daten (geschrieben von tools/cases.py aus data/cases.json) – NICHT hier ändern. */\n"
            "var KRIMI_SITE = %s;\n\nvar KRIMI_CASES = %s;\n\nvar KRIMI_PREVIEWS = %s;\n\nvar KRIMI_SOCIAL = %s;\n"
            "/* /Daten */" % tuple(json.dumps(x, ensure_ascii=False, indent=2)
                                  for x in (site, cases, DATA.get("previews", []), DATA.get("social", {}))))
    new = replace_between(src, "/* Daten (geschrieben", "/* /Daten */", body)
    return write(path, new)


def main():
    missing = check_data()
    changed = js_data()
    changed += case_pages()
    changed += krimi_page()
    changed += home()
    changed += latest_row()
    changed += recipe_pages()
    special = {"index.html", "krimi-dinner.html", "recipes.html"}
    for page in pages():
        if page in special or page.startswith(("recipes/", FOLDER + "/")):
            continue
        changed += write(page, apply_global(page, read(page)))
    print("  Krimi-Dinner: %d Fälle, %d Dateien aktualisiert." % (len(CASES), changed))
    for slug in missing:
        print("  Hinweis: Rezept %s ist keinem Fall zugeordnet (data/cases.json, Feld recipes)" % slug)
    todo = [c["id"] for c in CASES if not t(c).get("teaser")]
    if todo:
        print("  TODO: Teaser fehlt bei %d Fällen" % len(todo))


if __name__ == "__main__":
    main()
