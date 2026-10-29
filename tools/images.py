#!/usr/bin/env python3
"""
Bilder schlanker ausliefern – ohne ein einziges Foto anzufassen.

Aufruf (macht deploy.sh automatisch):   python3 tools/images.py

  1. Legt neben jedem JPEG in assets/img/ eine AVIF-Fassung an
     (<name>.avif, rund ein Viertel der Größe) und für Fotos ab 800 px
     Breite zusätzlich eine kleine (<name>-480.avif) für Karten und
     Vorschaubilder. Das JPEG bleibt das Original und der Rückfall für
     Browser ohne AVIF. Ist das JPEG neuer als die AVIF-Datei, wird sie
     neu erzeugt.
  2. Setzt in den Seiten um jedes JPEG ein <picture> mit der AVIF-Quelle,
     ergänzt fehlende width/height (gegen Layout-Sprünge) und gibt dem
     Rezeptfoto oben fetchpriority="high".

Die Produktgalerie bleibt außen vor: assets/js/gallery.js tauscht dort das
src des Hauptbilds, und ein <source> davor würde den Tausch überdecken.

Braucht macOS (sips). Läuft das Skript zweimal, ändert sich nichts.
"""
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo import ROOT, image_size, pages  # noqa: E402

IMG_DIR = os.path.join(ROOT, "assets", "img")
QUALITY = "50"
SMALL = 480

# Wie breit ein Bild ungefähr angezeigt wird, nach der Klasse des
# umgebenden Elements. Der Browser wählt damit zwischen klein und groß.
SIZES = {
    "recipe-card__media": "(min-width: 768px) 33vw, 100vw",
    "product-card__media": "(min-width: 768px) 33vw, 100vw",
    "krimi-teaser__media": "(min-width: 768px) 33vw, 100vw",
    "showcase__media": "(min-width: 768px) 50vw, 100vw",
    "lift": "96px",
    "kids-hint lift": "96px",
    "muted": "96px",
    "wall-card": "200px",
}
SKIP_CONTEXT = ("product-gallery__thumb", "product-gallery__main")


def avif(jpg, out, width=None):
    cmd = ["sips", "-s", "format", "avif", "-s", "formatOptions", QUALITY]
    if width:
        cmd += ["--resampleWidth", str(width)]
    subprocess.run(cmd + [jpg, "--out", out], check=True, capture_output=True)


def stale(src, out):
    return not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src)


def convert():
    made = 0
    for dirpath, _, filenames in os.walk(IMG_DIR):
        for name in sorted(filenames):
            if not name.lower().endswith(".jpg"):
                continue
            # Vorschaubilder für geteilte Links (tools/krimi-images.py) liest
            # nur WhatsApp & Co. – dafür braucht es kein AVIF.
            if os.path.basename(dirpath) == "og" or name.startswith("og-"):
                continue
            jpg = os.path.join(dirpath, name)
            base = jpg[:-4]
            if stale(jpg, base + ".avif"):
                avif(jpg, base + ".avif")
                made += 1
            if image_size(jpg)[0] >= 800 and stale(jpg, base + "-%d.avif" % SMALL):
                avif(jpg, base + "-%d.avif" % SMALL, SMALL)
                made += 1
    return made


def rewrite(page):
    path = os.path.join(ROOT, page)
    with open(path, encoding="utf-8") as f:
        src = f.read()
    folder = os.path.dirname(path)

    def fix(m):
        tag = m.group(0)
        url = re.search(r'src="([^"]+\.jpg)"', tag)
        if not url or url.group(1).startswith("http"):
            return tag
        before = src[:m.start()]
        context = (re.findall(r'class="([^"]+)"', before) or [""])[-1]
        own = re.search(r'class="([^"]+)"', tag)
        own = own.group(1) if own else ""
        jpg = os.path.normpath(os.path.join(ROOT if url.group(1).startswith("/") else folder,
                                            url.group(1).lstrip("/")))
        if not os.path.exists(jpg):
            return tag

        if "width=" not in tag:
            w, h = image_size(jpg)
            tag = tag.replace("<img ", '<img width="%d" height="%d" ' % (w, h), 1)
        if own == "video-embed__poster" and "fetchpriority" not in tag:
            tag = tag.replace("<img ", '<img fetchpriority="high" ', 1)

        if context in SKIP_CONTEXT or re.search(r"<source[^>]*>\s*$", before):
            return tag
        if not os.path.exists(jpg[:-4] + ".avif"):
            return tag

        rel = url.group(1)[:-4]
        if os.path.exists(jpg[:-4] + "-%d.avif" % SMALL):
            srcset = "%s-%d.avif %dw, %s.avif %dw" % (rel, SMALL, SMALL, rel, image_size(jpg)[0])
            sizes = ' sizes="%s"' % SIZES.get(context, "100vw")
        else:
            srcset, sizes = rel + ".avif", ""
        return '<picture><source type="image/avif" srcset="%s"%s>%s</picture>' % (srcset, sizes, tag)

    new = re.sub(r"<img\b[^>]*>", fix, src)
    if new != src:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
        return True
    return False


def main():
    made = convert()
    changed = [p for p in pages() if rewrite(p)]
    print("  %d AVIF-Dateien erzeugt, %d Seiten angepasst." % (made, len(changed)))


if __name__ == "__main__":
    main()
