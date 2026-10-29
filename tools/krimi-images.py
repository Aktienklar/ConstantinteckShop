#!/usr/bin/env python3
"""
Krimi-Dinner-Cover für das Web aufbereiten.

Aufruf (nur nötig, wenn ein Cover in assets/img/krimi/ neu ist oder sich
geändert hat):   python3 tools/krimi-images.py

  1. Legt neben jedem Cover <slug>.jpg drei WebP-Fassungen an:
     <slug>-240.webp, -400.webp und -675.webp. 240 px reicht für das
     Cover neben dem Text am Handy, 675 px ist die Originalbreite
     der Cover (675 × 900, 3:4) – größer zu rechnen brächte nur Bytes,
     keine Schärfe. krimi-dinner.js baut daraus srcset/sizes.
  2. Baut das Vorschaubild für geteilte Links von krimi-dinner.html und der
     Startseite: assets/img/krimi/og-krimi-dinner.jpg (1200 × 630), drei
     Cover nebeneinander auf dunklem Grund. Welche drei, steht in OG_COVERS.
  3. Baut je Fall das Vorschaubild seiner Fallseite:
     assets/img/krimi/og/<slug>.jpg (1200 × 630). Das Cover steht vollständig
     in der Mitte, dahinter dieselbe Grafik stark unscharf und abgedunkelt –
     so passt der Grund farblich zu jedem Cover, und nichts wird beschnitten.

Braucht Pillow mit WebP (pip3 install pillow). Anders als tools/images.py
läuft das Skript nicht bei jedem Deploy – die erzeugten Dateien werden mit
ins Repository gelegt. Läuft es zweimal, ändert sich nichts.
"""
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "assets", "img", "krimi")
WIDTHS = (240, 400, 675)
QUALITY = 78

OG_FILE = os.path.join(DIR, "og-krimi-dinner.jpg")
OG_SIZE = (1200, 630)
# Links, Mitte (größer, vorn), rechts.
OG_COVERS = ("witching-hour-at-ravenmoor", "the-last-sleigh-ride", "death-at-studio-7")
OG_BACKGROUND = (59, 42, 32)  # --cocoa aus styles.css


def stale(src, out):
    return not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src)


def covers():
    return sorted(
        name[:-4]
        for name in os.listdir(DIR)
        if name.endswith(".jpg") and not name.startswith("og-")
    )


def webp():
    made = 0
    for slug in covers():
        jpg = os.path.join(DIR, slug + ".jpg")
        for width in WIDTHS:
            out = os.path.join(DIR, "%s-%d.webp" % (slug, width))
            if not stale(jpg, out):
                continue
            img = Image.open(jpg).convert("RGB")
            if img.width != width:
                img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
            img.save(out, "WEBP", quality=QUALITY, method=6)
            made += 1
    return made


def shadowed(canvas, cover, x, y):
    """Cover mit weichem Schatten und runden Ecken auf die Fläche legen."""
    radius = 14
    mask = Image.new("L", cover.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, cover.width - 1, cover.height - 1), radius, fill=255)

    pad = 40
    shadow = Image.new("L", (cover.width + pad * 2, cover.height + pad * 2), 0)
    ImageDraw.Draw(shadow).rounded_rectangle(
        (pad, pad + 10, pad + cover.width, pad + cover.height + 10), radius, fill=150
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.paste((0, 0, 0), (x - pad, y - pad), shadow)
    canvas.paste(cover, (x, y), mask)


def og():
    sources = [os.path.join(DIR, slug + ".jpg") for slug in OG_COVERS]
    if os.path.exists(OG_FILE) and not any(stale(s, OG_FILE) for s in sources):
        return 0

    canvas = Image.new("RGB", OG_SIZE, OG_BACKGROUND)
    # Leichter Lichtkegel in der Mitte, damit die Fläche nicht flach wirkt.
    glow = Image.new("L", OG_SIZE, 0)
    ImageDraw.Draw(glow).ellipse((250, -150, 950, 780), fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    canvas.paste((110, 85, 68), (0, 0), glow)

    side_h, main_h = 470, 560
    side_w, main_w = round(side_h * 3 / 4), round(main_h * 3 / 4)
    left, middle, right = [Image.open(s).convert("RGB") for s in sources]
    left = left.resize((side_w, side_h), Image.LANCZOS)
    right = right.resize((side_w, side_h), Image.LANCZOS)
    middle = middle.resize((main_w, main_h), Image.LANCZOS)

    cx = OG_SIZE[0] // 2
    # Abstand der Mitten: nebeneinander mit 22 px Luft, damit kein Titel verdeckt wird.
    gap = main_w // 2 + 22 + side_w // 2
    shadowed(canvas, left, cx - gap - side_w // 2, (OG_SIZE[1] - side_h) // 2)
    shadowed(canvas, right, cx + gap - side_w // 2, (OG_SIZE[1] - side_h) // 2)
    shadowed(canvas, middle, cx - main_w // 2, (OG_SIZE[1] - main_h) // 2)

    canvas.save(OG_FILE, "JPEG", quality=85, optimize=True, progressive=True)
    return 1


OG_CASE_DIR = os.path.join(DIR, "og")


def og_cases():
    os.makedirs(OG_CASE_DIR, exist_ok=True)
    made = 0
    for slug in covers():
        src = os.path.join(DIR, slug + ".jpg")
        out = os.path.join(OG_CASE_DIR, slug + ".jpg")
        if not stale(src, out):
            continue
        cover = Image.open(src).convert("RGB")

        # Grund: Cover auf volle Breite, unscharf, abgedunkelt.
        scale = OG_SIZE[0] / cover.width
        bg = cover.resize((OG_SIZE[0], round(cover.height * scale)), Image.LANCZOS)
        top = (bg.height - OG_SIZE[1]) // 2
        bg = bg.crop((0, top, OG_SIZE[0], top + OG_SIZE[1])).filter(ImageFilter.GaussianBlur(40))
        bg = Image.blend(bg, Image.new("RGB", OG_SIZE, OG_BACKGROUND), 0.55)

        h = 560
        w = round(h * cover.width / cover.height)
        shadowed(bg, cover.resize((w, h), Image.LANCZOS), (OG_SIZE[0] - w) // 2, (OG_SIZE[1] - h) // 2)
        bg.save(out, "JPEG", quality=84, optimize=True, progressive=True)
        made += 1
    return made


def main():
    made = webp() + og() + og_cases()
    print("  %d Krimi-Bilder erzeugt." % made)


if __name__ == "__main__":
    main()
