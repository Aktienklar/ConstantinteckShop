"""
Strukturierte Daten (JSON-LD) für jede Seite – aus dem, was schon da ist.

Wird von tools/seo.py aufgerufen, nicht direkt. Quelle ist immer der sichtbare
Inhalt der Seite oder eine Datei, die ohnehin gepflegt wird:

  Rezept    Name, Teaser, Zeit, Portionen, Zutaten und Schritte aus dem HTML
            der Rezeptseite; Schlagwörter aus der Karte in recipes.html;
            Video aus assets/js/recipe-data.js (nur mit Link UND Datum).
  Produkt   Name, Teaser und Bilder aus dem HTML der Produktseite; Preis,
            Farben und Größen aus assets/js/shop-data.js – derselben Stelle,
            aus der auch der Warenkorb rechnet.
  Marke     ORGANIZATION und PERSON unten. Name, Beschreibung und Profile
            stehen nur hier und erscheinen auf jeder Seite gleich.

Nichts hier wird geschätzt. Fehlt eine Angabe (Nährwerte, Versand ins
Ausland, Upload-Datum eines Videos), fehlt sie auch im Schema; offene Punkte
stehen in OFFENE-FRAGEN.md.
"""
import html
import json
import os
import re
import subprocess

SITE = "https://constantinteck.com/"
ORG_ID = SITE + "#organization"
PERSON_ID = SITE + "about.html#constantin"
WEBSITE_ID = SITE + "#website"

SOCIAL = [
    "https://instagram.com/constantinteck",
    "https://tiktok.com/@constantinteck",
    "https://youtube.com/@constantinteck",
]
DESCRIPTION = ("Food brand by Constantin: easy recipes from his Instagram, TikTok and "
               "YouTube videos, and kitchen aprons designed by his mom and sewn by hand "
               "in Germany.")

ORGANIZATION = {
    "@type": "Organization",
    "@id": ORG_ID,
    "name": "Constantinteck",
    "url": SITE,
    "logo": {"@type": "ImageObject", "url": SITE + "assets/img/apple-touch-icon.png"},
    "description": DESCRIPTION,
    "email": "info@constantinteck.com",
    "founder": {"@id": PERSON_ID},
    "sameAs": SOCIAL,
}
PERSON = {
    "@type": "Person",
    "@id": PERSON_ID,
    "name": "Constantin",
    "url": SITE + "about.html",
    "image": SITE + "assets/img/about-constantin.jpg",
    "worksFor": {"@id": ORG_ID},
    "sameAs": SOCIAL,
}
AUTHOR = {"@type": "Person", "@id": PERSON_ID, "name": "Constantin", "url": SITE + "about.html"}

# Gerichtsart für recipeCategory, nach dem Namen. Die Reihenfolge zählt:
# "Smoothie Bowl" ist Frühstück, kein Getränk.
CATEGORIES = [
    (r"sorbet|ice cream|nice cream", "Dessert"),
    (r"smoothie bowl|chia pudding", "Breakfast"),
    (r"smoothie", "Drink"),
    (r"banana bread", "Baking"),
    (r"baba ganoush", "Dip"),
    (r".", "Main course"),
]


def text(fragment):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", fragment))).strip()


def first(pattern, src):
    m = re.search(pattern, src, re.S)
    return m.group(1) if m else None


def duration(value):
    """'65 min' -> PT1H5M, '4 h' -> PT4H; alles andere -> None."""
    m = re.fullmatch(r"\s*(\d+)\s*(min|h)\s*", value or "")
    if not m:
        return None
    minutes = int(m.group(1)) * (60 if m.group(2) == "h" else 1)
    h, mi = divmod(minutes, 60)
    return "PT" + ("%dH" % h if h else "") + ("%dM" % mi if mi else "")


def added(root, page):
    """Datum, an dem die Seite ins Repository kam = veröffentlicht."""
    out = subprocess.run(["git", "log", "--diff-filter=A", "--follow", "--format=%cs", "--", page],
                         cwd=root, capture_output=True, text=True).stdout.split()
    return out[-1] if out else None


def js_object(root, path, key):
    """Den Block `"key": { ... }` aus einer JS-Datei als Text (Klammern gezählt)."""
    with open(os.path.join(root, path), encoding="utf-8") as f:
        src = f.read()
    m = re.search(r'"%s"\s*:\s*\{' % re.escape(key), src)
    if not m:
        return ""
    depth, i = 1, m.end()
    while depth and i < len(src):
        depth += {"{": 1, "}": -1}.get(src[i], 0)
        i += 1
    return src[m.end():i - 1]


def labels(root, var):
    with open(os.path.join(root, "assets/js/shop-data.js"), encoding="utf-8") as f:
        src = f.read()
    block = first(r"var %s = \[(.*?)\];" % var, src) or ""
    return re.findall(r'label:\s*"([^"]+)"', block)


def breadcrumbs(*items):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": url}
            for i, (name, url) in enumerate(items)
        ],
    }


def recipe_tags(root, slug):
    with open(os.path.join(root, "recipes.html"), encoding="utf-8") as f:
        src = f.read()
    card = re.search(r'href="recipes/%s\.html"(.*?)</a>' % re.escape(slug), src, re.S)
    return [text(t) for t in re.findall(r'<span class="tag">(.*?)</span>', card.group(1))] if card else []


def recipe(root, page, src, url, image):
    slug = os.path.basename(page)[:-5]
    name = text(first(r"<h1[^>]*>(.*?)</h1>", src))
    facts = {text(k): text(v) for k, v in re.findall(r"<dt>(.*?)</dt>\s*<dd>(.*?)</dd>", src, re.S)}

    ingredients_html = first(r'<section class="panel ingredients".*?<ul>(.*?)</ul>', src) or ""
    ingredients = [text(li) for li in re.findall(r"<li>(.*?)</li>", ingredients_html, re.S)]
    method_html = first(r'<section class="panel method.*?<ol>(.*?)</ol>', src) or ""
    steps = [text(p) for p in re.findall(r"<li>.*?<p>(.*?)</p>", method_html, re.S)]

    data = {
        "@type": "Recipe",
        "@id": url + "#recipe",
        "name": name,
        "description": text(first(r'<p class="lede">(.*?)</p>', src)),
        "image": [image],
        "author": AUTHOR,
        "publisher": {"@id": ORG_ID},
        "datePublished": added(root, page),
        "recipeCategory": next(c for p, c in CATEGORIES if re.search(p, name, re.I)),
        "keywords": ", ".join([name.lower()] + [t.lower() for t in recipe_tags(root, slug)]),
        "recipeYield": "%s servings" % facts.get("Servings") if facts.get("Servings") else None,
        "recipeIngredient": ingredients,
        "recipeInstructions": [
            {"@type": "HowToStep", "position": i + 1, "text": s} for i, s in enumerate(steps)
        ],
        "inLanguage": "en",
    }

    # "5 min" -> totalTime. "10 min + 4 h" -> Arbeitszeit + Gesamtzeit.
    # "5 min + overnight" -> nur die Arbeitszeit; "über Nacht" ist keine Zahl.
    parts = [p.strip() for p in facts.get("Time", "").split("+")]
    times = [duration(p) for p in parts]
    if len(parts) == 1 and times[0]:
        data["totalTime"] = times[0]
    elif len(parts) == 2 and times[0]:
        data["prepTime"] = times[0]
        if times[1]:
            total = int(re.search(r"\d+", parts[0]).group()) + int(re.search(r"\d+", parts[1]).group()) * (
                60 if parts[1].endswith("h") else 1)
            data["totalTime"] = duration("%d min" % total)

    video_block = js_object(root, "assets/js/recipe-data.js", slug)
    video = first(r'video:\s*"([^"]+)"', video_block)
    uploaded = first(r'uploaded:\s*"(\d{4}-\d{2}-\d{2})"', video_block)
    if video and uploaded:
        data["video"] = {
            "@type": "VideoObject",
            "name": name,
            "description": data["description"],
            "thumbnailUrl": [image],
            "uploadDate": uploaded,
            "embedUrl" if "instagram.com" in video else "url": video,
        }

    return [{k: v for k, v in data.items() if v not in (None, "", [])},
            breadcrumbs(("Home", SITE), ("Recipes", SITE + "recipes.html"), (name, url))]


def product(root, page, src, url):
    slug = os.path.basename(page)[:-5]
    block = js_object(root, "assets/js/shop-data.js", slug)
    price = float(first(r"\bprice:\s*([\d.]+)", block))
    name = text(first(r"<h1[^>]*>(.*?)</h1>", src))
    gallery = re.findall(r'data-gallery-thumb[^>]*><img[^>]*src="\.\./([^"]+)"', src)

    data = {
        "@type": "Product",
        "@id": url + "#product",
        "name": name,
        "description": text(first(r'<p class="lede">(.*?)</p>', src)),
        "image": [SITE + g for g in dict.fromkeys(gallery)],
        "sku": slug,
        "brand": {"@type": "Brand", "name": "Constantinteck"},
        "material": "Waffle piqué",
        "color": ", ".join(labels(root, "SHOP_COLOURS")),
        "countryOfOrigin": "DE",
        "offers": {
            "@type": "Offer",
            "url": url,
            "price": "%.2f" % price,
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {"@id": ORG_ID},
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {"@type": "MonetaryAmount", "value": "4.90", "currency": "EUR"},
                "shippingDestination": {"@type": "DefinedRegion", "addressCountry": "DE"},
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": ["DE", "AT"],
                "returnPolicyCountry": "DE",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 14,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn",
            },
        },
    }
    if "SHOP_KIDS_SIZES" in block:
        data["size"] = ", ".join(labels(root, "SHOP_KIDS_SIZES"))
    return [data, breadcrumbs(("Home", SITE), ("Shop", SITE + "shop.html"), (name, url))]


def item_list(src, folder):
    urls = []
    for href in re.findall(r'<a class="card (?:recipe|product)-card[^"]*" href="(?:\.\./)?(%s/[^"]+\.html)"' % folder, src):
        if SITE + href not in urls:
            urls.append(SITE + href)
    return {
        "@type": "ItemList",
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": u} for i, u in enumerate(urls)],
    }


def build(root, page, src, url, image, title):
    """Liste der Knoten für @graph, oder None für Seiten ohne Schema."""
    brand = [ORGANIZATION, PERSON]
    if page == "index.html":
        return brand + [{
            "@type": "WebSite", "@id": WEBSITE_ID, "name": "Constantinteck", "url": SITE,
            "description": DESCRIPTION, "inLanguage": "en", "publisher": {"@id": ORG_ID},
        }]
    if page.startswith("recipes/"):
        return recipe(root, page, src, url, image) + brand
    if page.startswith("shop/"):
        return product(root, page, src, url) + brand
    if page == "recipes.html":
        return [{"@type": "CollectionPage", "@id": url, "name": title, "url": url,
                 "isPartOf": {"@id": WEBSITE_ID}, "mainEntity": item_list(src, "recipes")},
                breadcrumbs(("Home", SITE), ("Recipes", url))] + brand
    if page == "shop.html":
        return [{"@type": "CollectionPage", "@id": url, "name": title, "url": url,
                 "isPartOf": {"@id": WEBSITE_ID}, "mainEntity": item_list(src, "shop")},
                breadcrumbs(("Home", SITE), ("Shop", url))] + brand
    if page == "about.html":
        return [{"@type": "AboutPage", "@id": url, "name": title, "url": url,
                 "isPartOf": {"@id": WEBSITE_ID}, "mainEntity": {"@id": PERSON_ID}},
                breadcrumbs(("Home", SITE), ("About", url))] + brand
    if page.startswith("collections/"):
        h1 = text(first(r"<h1[^>]*>(.*?)</h1>", src))
        return [{"@type": "CollectionPage", "@id": url, "name": h1, "url": url,
                 "description": text(first(r'<p class="muted"[^>]*>(.*?)</p>', src)),
                 "isPartOf": {"@id": WEBSITE_ID}, "mainEntity": item_list(src, "recipes")},
                breadcrumbs(("Home", SITE), ("Recipes", SITE + "recipes.html"), (h1, url))] + brand
    if page == "krimi-dinner.html":
        return [breadcrumbs(("Home", SITE), ("Murder Mystery Dinner", url))] + brand
    return None


def block(nodes):
    data = json.dumps({"@context": "https://schema.org", "@graph": nodes}, ensure_ascii=False, indent=2)
    # "</" darf in einem <script> nicht vorkommen.
    data = data.replace("</", "<\\/")
    return ("  <!-- Strukturierte Daten fuer Suchmaschinen (geschrieben von tools/seo.py) -->\n"
            '  <script type="application/ld+json">\n%s\n  </script>\n'
            "  <!-- /Strukturierte Daten -->" % data)


# Was Google für Rich Results verlangt (REQUIRED) und empfiehlt (RECOMMENDED).
# Bewertungen und Nährwerte stehen absichtlich nicht in der Liste: Es gibt
# keine echten, und erfundene gehören nicht ins Schema.
REQUIRED = {
    "Recipe": ["name", "image"],
    "Product": ["name", "image", "offers.price", "offers.priceCurrency", "offers.availability"],
    "BreadcrumbList": ["itemListElement"],
}
RECOMMENDED = {
    "Recipe": ["author", "datePublished", "description", "keywords", "recipeCategory",
               "recipeIngredient", "recipeInstructions", "recipeYield", "totalTime", "video"],
    "Product": ["description", "brand", "sku", "offers.shippingDetails",
                "offers.hasMerchantReturnPolicy"],
}


def _has(node, path):
    for key in path.split("."):
        if not isinstance(node, dict) or node.get(key) in (None, "", []):
            return False
        node = node[key]
    return True


def check(nodes):
    """(fehlende Pflichtfelder, fehlende Empfehlungen) für die Knoten einer Seite."""
    missing, optional = [], []
    for node in nodes:
        t = node.get("@type")
        missing += ["%s.%s" % (t, f) for f in REQUIRED.get(t, []) if not _has(node, f)]
        optional += ["%s.%s" % (t, f) for f in RECOMMENDED.get(t, []) if not _has(node, f)]
    return missing, optional
