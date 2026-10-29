#!/usr/bin/env python3
"""
SEO-Kopf aller Seiten und sitemap.xml – an einer Stelle.

Aufruf (macht deploy.sh automatisch):   python3 tools/seo.py

Was das Skript tut:
  1. Schreibt in jede Seite den Block von <title> bis <!-- /Vorschau -->
     neu: Titel, Beschreibung, Favicon, Canonical, Open Graph, Twitter.
     Titel und Beschreibung kommen aus tools/seo-pages.json; Seiten, die
     dort fehlen, behalten ihre eigenen. og:type, og:image und noindex
     werden aus der Seite selbst gelesen und bleiben, wie sie sind.
  2. Erzeugt sitemap.xml aus allen Seiten mit Canonical und ohne noindex.
     lastmod = Datum des letzten Commits der Datei, bei ungespeicherten
     Änderungen das heutige Datum.
  3. Meldet Titel und Beschreibungen außerhalb der Richtwerte. Das ist nur
     ein Hinweis, das Skript bricht deshalb nicht ab.

Läuft das Skript zweimal, ändert sich beim zweiten Mal nichts.
"""
import datetime
import html
import json
import os
import re
import struct
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://constantinteck.com/"
SKIP_DIRS = {".git", ".github", ".claude", ".wrangler", "node_modules", "worker", "tools"}
LOCALES = {"en": "en_GB", "de": "de_DE"}

# Rechtsseiten tragen ihre Titel bewusst unverändert und werden bei den
# Längen-Hinweisen übergangen.
LEGAL = {"imprint.html", "privacy.html", "terms.html", "shipping-returns.html"}

TITLE_RANGE = (40, 65)
DESC_RANGE = (120, 165)


def pages():
    found = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for name in sorted(filenames):
            if name.endswith(".html"):
                found.append(os.path.relpath(os.path.join(dirpath, name), ROOT))
    return found


def attr(text):
    return text.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def first(pattern, text):
    m = re.search(pattern, text, re.S)
    return html.unescape(m.group(1)).strip() if m else None


def image_size(path):
    """Breite und Höhe einer JPEG- oder PNG-Datei, ohne Zusatzpakete."""
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack(">HH", data[i + 5:i + 9])
            return w, h
        i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    return None


def head_block(page, src, meta):
    depth = page.count("/")
    # 404.html erscheint unter jeder unbekannten Adresse, auch unter
    # /recipes/tippfehler – relative Pfade fänden dort nichts.
    rel = "/" if page == "404.html" else "../" * depth
    url = SITE + ("" if page == "index.html" else page)

    title = meta.get("title") or first(r"<title>(.*?)</title>", src)
    desc = meta.get("description") or first(r'<meta name="description" content="([^"]*)"', src)
    og_title = re.sub(r"\s*\|\s*Constantinteck( Shop)?$", "", title) if page != "index.html" else title
    og_type = first(r'property="og:type" content="([^"]+)"', src) or "website"
    og_image = first(r'property="og:image" content="([^"]+)"', src) or SITE + "assets/img/hero-kitchen.jpg"
    noindex = 'name="robots" content="noindex"' in src
    lang = first(r'<html[^>]*lang="([^"]+)"', src) or "en"
    h1 = first(r"<h1[^>]*>(.*?)</h1>", src)
    image_alt = meta.get("imageAlt") or re.sub(r"<[^>]+>", "", h1 or og_title)

    lines = [
        "<title>%s</title>" % attr(title),
        '<meta name="description" content="%s">' % attr(desc),
        "<!-- Favicon, canonical, Vorschaubild beim Teilen (geschrieben von tools/seo.py) -->",
        '<link rel="icon" href="%sassets/img/favicon.svg" type="image/svg+xml">' % rel,
        '<link rel="apple-touch-icon" href="%sassets/img/apple-touch-icon.png">' % rel,
    ]
    if noindex:
        lines.append('<meta name="robots" content="noindex">')
    else:
        lines.append('<link rel="canonical" href="%s">' % url)
    lines += [
        '<meta property="og:type" content="%s">' % og_type,
        '<meta property="og:site_name" content="Constantinteck">',
        '<meta property="og:locale" content="%s">' % LOCALES.get(lang, "en_GB"),
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:title" content="%s">' % attr(og_title),
        '<meta property="og:description" content="%s">' % attr(desc),
        '<meta property="og:image" content="%s">' % og_image,
    ]
    if og_image.startswith(SITE):
        local = os.path.join(ROOT, og_image[len(SITE):])
        size = image_size(local) if os.path.exists(local) else None
        if size:
            lines.append('<meta property="og:image:width" content="%d">' % size[0])
            lines.append('<meta property="og:image:height" content="%d">' % size[1])
    lines += [
        '<meta property="og:image:alt" content="%s">' % attr(image_alt),
        '<meta name="twitter:card" content="summary_large_image">',
        "<!-- /Vorschau -->",
    ]
    return "\n".join("  " + l for l in lines), title, desc, noindex, url


def lastmod(page):
    dirty = subprocess.run(["git", "status", "--porcelain", "--", page], cwd=ROOT,
                           capture_output=True, text=True).stdout.strip()
    if not dirty:
        date = subprocess.run(["git", "log", "-1", "--format=%cs", "--", page], cwd=ROOT,
                              capture_output=True, text=True).stdout.strip()
        if date:
            return date
    return datetime.date.today().isoformat()


def main():
    with open(os.path.join(ROOT, "tools", "seo-pages.json"), encoding="utf-8") as f:
        data = {k: v for k, v in json.load(f).items() if not k.startswith("_")}

    unknown = [p for p in data if not os.path.exists(os.path.join(ROOT, p))]
    if unknown:
        print("  seo-pages.json nennt Seiten, die es nicht gibt: " + ", ".join(unknown))
        sys.exit(1)

    changed, warnings, indexable = [], [], []
    for page in pages():
        path = os.path.join(ROOT, page)
        with open(path, encoding="utf-8") as f:
            src = f.read()
        m = re.search(r"[ \t]*<title>.*?<!-- /Vorschau -->", src, re.S)
        if not m:
            warnings.append("%s: kein Block <title> … <!-- /Vorschau --> gefunden" % page)
            continue
        block, title, desc, noindex, url = head_block(page, src, data.get(page, {}))
        new = src[:m.start()] + block + src[m.end():]
        if new != src:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
            changed.append(page)
        if noindex:
            continue
        indexable.append((page, url))
        if page in LEGAL:
            continue
        if not TITLE_RANGE[0] <= len(title) <= TITLE_RANGE[1]:
            warnings.append("%s: Titel hat %d Zeichen" % (page, len(title)))
        if not DESC_RANGE[0] <= len(desc) <= DESC_RANGE[1]:
            warnings.append("%s: Beschreibung hat %d Zeichen" % (page, len(desc)))

    # Erst nach dem Schreiben der Seiten, damit lastmod die Änderung mitzählt.
    entries = ["  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n  </url>" % (url, lastmod(page))
               for page, url in sorted(indexable, key=lambda x: (x[0] != "index.html", x[0]))]
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<!-- Wird von tools/seo.py erzeugt. Nicht von Hand bearbeiten. -->\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "\n".join(entries) + "\n</urlset>\n")
    sitemap_path = os.path.join(ROOT, "sitemap.xml")
    with open(sitemap_path, encoding="utf-8") as f:
        old = f.read()
    if old != sitemap:
        with open(sitemap_path, "w", encoding="utf-8") as f:
            f.write(sitemap)
        changed.append("sitemap.xml")

    print("  %d Seiten geprüft, %d Dateien aktualisiert, %d URLs in der Sitemap."
          % (len(pages()), len(changed), len(indexable)))
    for w in warnings:
        print("  Hinweis: " + w)


if __name__ == "__main__":
    main()
