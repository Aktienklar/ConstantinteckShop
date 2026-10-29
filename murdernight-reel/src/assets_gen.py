"""Erzeugt alle Bildbausteine im Code und cached sie in build/assets/.

Falls murdernight-reel/assets/logo.* oder assets/covers/ existieren, werden diese
Dateien bevorzugt.
"""
import glob
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import layout as L
import timeline as T
from common import ASSETS, BUILD, Sprite, fbm, font, smoothstep

CACHE = os.path.join(BUILD, "assets")
CARD = np.array(T.CARDBOARD, np.float32) / 255
RED = np.array(T.BLOOD, np.float32) / 255
CREAM = np.array(T.CREAM, np.float32) / 255
SS = 2  # Supersampling fuer PIL-Zeichnungen


# =============================================================================
# Material-Helfer
# =============================================================================
def rgba(rgb, a=None):
    h, w = rgb.shape[:2]
    out = np.zeros((h, w, 4), np.float32)
    out[..., :3] = rgb
    out[..., 3] = 1.0 if a is None else a
    return out


def paper(h, w, color, seed, fiber=0.06, mottle=0.07, curl=0.06, edge=0.10):
    """Papier/Karton mit Faser, Wolken, Woelbung und Kantenabdunklung."""
    rng = np.random.default_rng(seed)
    n1 = fbm(h, w, octaves=3, base=6, seed=seed)
    fib = rng.normal(0, 1, (h, w)).astype(np.float32)
    fib = cv2.GaussianBlur(fib, (0, 0), sigmaX=2.2, sigmaY=0.5)
    fib = fib / (np.abs(fib).max() + 1e-6)
    speck = (rng.random((h, w)) > 0.9985).astype(np.float32)
    speck = cv2.GaussianBlur(speck, (0, 0), 0.8) * 3
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    u, v = xx / (w - 1), yy / (h - 1)
    bend = 1 + curl * (np.cos((u - 0.35) * np.pi * 1.3) - 0.5) + curl * 0.6 * (0.5 - v)
    d = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy])
    edge_dark = 1 - edge * np.exp(-d / 10.0) - edge * 0.6 * np.exp(-d / 40.0)
    shade = (1 + mottle * (n1 - 0.5) * 2 + fiber * fib - 0.25 * speck) * bend * edge_dark
    return np.clip(color[None, None, :] * shade[..., None], 0, 1)


def rounded_mask(h, w, r, ss=SS):
    im = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(im).rounded_rectangle([0, 0, w * ss - 1, h * ss - 1], r * ss, fill=255)
    return np.asarray(im.resize((w, h), Image.LANCZOS)).astype(np.float32) / 255


def pil_rgba(im):
    return np.asarray(im.convert("RGBA")).astype(np.float32) / 255


def over(dst, src, x, y):
    """src (straight RGBA) auf dst (straight RGBA) an Position x,y."""
    h, w = src.shape[:2]
    H, W = dst.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return dst
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]
    d = dst[y0:y1, x0:x1]
    sa = s[..., 3:4]
    da = d[..., 3:4]
    oa = sa + da * (1 - sa)
    rgb = (s[..., :3] * sa + d[..., :3] * da * (1 - sa)) / np.maximum(oa, 1e-6)
    d[..., :3] = rgb
    d[..., 3:4] = oa
    return dst


def rotate_rgba(img, deg):
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), deg, 1.0)
    c, s = abs(M[0, 0]), abs(M[0, 1])
    nw, nh = int(h * s + w * c) + 2, int(h * c + w * s) + 2
    M[0, 2] += nw / 2 - w / 2
    M[1, 2] += nh / 2 - h / 2
    pm = img.copy()
    pm[..., :3] *= pm[..., 3:4]
    out = cv2.warpAffine(pm, M, (nw, nh), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0))
    out = np.clip(out, 0, 1)
    out[..., :3] = np.where(out[..., 3:4] > 1e-4, out[..., :3] / np.maximum(out[..., 3:4], 1e-4), 0)
    return out


def text_layer(h, w, items):
    """items: (x, y, text, fontname, size, rgb, alpha). Gibt Alpha+Farbe zurueck."""
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for x, y, txt, fn, size, col, a in items:
        c = tuple(int(v * 255) for v in col) + (int(a * 255),)
        d.text((x * SS, y * SS), txt, font=font(fn, size * SS), fill=c)
    im = im.resize((w, h), Image.LANCZOS)
    return pil_rgba(im)


def ink(layer, seed, strength=0.35):
    """Schreibmaschinen-/Druckfarbe ungleichmaessig machen."""
    h, w = layer.shape[:2]
    n = fbm(h, w, octaves=4, base=40, seed=seed)
    layer[..., 3] *= np.clip(1 - strength * (n - 0.3) * 1.6, 0.45, 1.0)
    return layer


def pseudo_text(h, w, seed, size=16, color=(0.25, 0.2, 0.17), lines=8, lh=26, alpha=0.75):
    rng = np.random.default_rng(seed)
    letters = "abcdefghiklmnoprstuvwäöüeeennrrsstt"
    items = []
    for i in range(lines):
        x = 0
        y = i * lh
        line_w = w * (0.55 + 0.45 * rng.random()) if i < lines - 1 else w * 0.4
        while x < line_w - 30:
            word = "".join(rng.choice(list(letters), rng.integers(2, 9)))
            items.append((x, y, word, "elite", size, color, alpha))
            x += font("elite", size).getlength(word + " ")
    return ink(text_layer(lines * lh + size, w, items), seed, 0.5)


def drop_shadow(img, sigma, opacity, grow=0):
    a = img[..., 3]
    pad = int(sigma * 3) + grow + 2
    a = np.pad(a, pad)
    if grow:
        a = cv2.dilate(a, np.ones((grow * 2 + 1, grow * 2 + 1), np.uint8))
    a = cv2.GaussianBlur(a, (0, 0), sigma) * opacity
    out = np.zeros(a.shape + (4,), np.float32)
    out[..., 3] = a
    return out, pad


# =============================================================================
# Korkwand
# =============================================================================
def build_wall():
    h, w = L.WALL_H, L.WALL_W
    rng = np.random.default_rng(7)
    small = fbm(h, w, octaves=3, base=520, seed=11, persistence=0.55)
    gran = fbm(h, w, octaves=2, base=1300, seed=12, persistence=0.5)
    mott = fbm(h, w, octaves=4, base=5, seed=13)
    light = np.array([0.42, 0.28, 0.165], np.float32)
    dark = np.array([0.21, 0.13, 0.07], np.float32)
    t = np.clip((small - 0.5) * 2.0 + 0.5 + (gran - 0.5) * 0.6, 0, 1)[..., None]
    col = dark * (1 - t) + light * t
    pores = (fbm(h, w, octaves=1, base=1500, seed=14) > 0.70).astype(np.float32)
    pores = cv2.GaussianBlur(pores, (0, 0), 1.0)
    col *= (1 - 0.35 * pores)[..., None]
    col *= (0.78 + 0.35 * mott)[..., None]
    # alte Nadelloecher
    holes = np.zeros((h, w), np.float32)
    for _ in range(260):
        x, y = rng.integers(0, w), rng.integers(0, h)
        cv2.circle(holes, (int(x), int(y)), int(rng.integers(2, 4)), 1.0, -1, cv2.LINE_AA)
    holes = cv2.GaussianBlur(holes, (0, 0), 0.8)
    col *= (1 - 0.6 * holes)[..., None]
    wall = rgba(col.astype(np.float32))
    dress_wall(wall, rng)
    return wall


def scribble(h, w, seed, lines=5, color=(0.12, 0.10, 0.12)):
    """Handschrift-artige Kritzelzeilen (keine lesbaren Woerter)."""
    rng = np.random.default_rng(seed)
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lh = h / (lines + 1)
    for i in range(lines):
        y0 = (i + 0.8) * lh
        x = 10 + rng.random() * 10
        end = w * (0.6 + 0.35 * rng.random())
        pts = []
        ph = rng.random() * 6
        while x < end:
            ph += 0.7 + rng.random() * 0.6
            yy = y0 + np.sin(ph * 2.3) * lh * 0.18 + np.sin(ph * 5.1) * lh * 0.08
            pts.append((x * SS, yy * SS))
            x += 3 + rng.random() * 3
            if rng.random() < 0.05:
                d.line(pts, fill=tuple(int(c * 255) for c in color) + (220,), width=int(2.2 * SS), joint="curve")
                pts = []
                x += 14
        if len(pts) > 1:
            d.line(pts, fill=tuple(int(c * 255) for c in color) + (220,), width=int(2.2 * SS), joint="curve")
    return pil_rgba(im.resize((w, h), Image.LANCZOS))


def note_card(w, h, seed, color):
    img = rgba(paper(h, w, np.array(color, np.float32), seed, curl=0.04))
    sc = scribble(h - 30, w - 30, seed + 1, lines=max(3, h // 45))
    over(img, sc, 15, 15)
    return img


def dark_photo(w, h, seed, kind):
    """Kleines, dunkles Hintergrundfoto (unscharf) fuer die Wand."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32) / max(h, w)
    sky = np.stack([0.20 + 0.1 * yy, 0.22 + 0.08 * yy, 0.24 + 0.02 * yy], -1)
    img = sky.copy()
    if kind == "forest":
        for i in range(14):
            x = rng.integers(0, w)
            th = h * (0.4 + 0.4 * rng.random())
            cv2.fillPoly(img, [np.array([[x, h], [x - 14, h], [x - 5, h - th], [x + 5, h - th]], np.int32)],
                         (0.06, 0.06, 0.07))
    else:
        cv2.fillPoly(img, [np.array([[0, h], [0, int(h * .6)], [w // 3, int(h * .45)], [w // 2, int(h * .62)],
                                     [w, int(h * .5)], [w, h]], np.int32)], (0.07, 0.07, 0.08))
    img = cv2.GaussianBlur(img, (0, 0), 1.2)
    img *= (0.85 + 0.15 * fbm(h, w, 3, 6, seed))[..., None]
    B = 12
    frame = rgba(paper(h + B * 2 + 26, w + B * 2, np.array([0.86, 0.84, 0.78], np.float32), seed + 3))
    frame[B:B + h, B:B + w, :3] = img
    return frame


def map_fragment(w, h, seed):
    base = paper(h, w, np.array([0.80, 0.74, 0.60], np.float32), seed, curl=0.03)
    n = fbm(h, w, 4, 4, seed + 5)
    lines = np.zeros((h, w), np.float32)
    for lvl in np.linspace(0.2, 0.8, 11):
        lines = np.maximum(lines, np.exp(-((n - lvl) / 0.006) ** 2))
    base *= (1 - 0.35 * lines)[..., None]
    road = np.zeros((h, w), np.float32)
    pts = np.array([[0, h * .7], [w * .3, h * .55], [w * .55, h * .62], [w, h * .3]], np.int32)
    cv2.polylines(road, [pts], False, 1.0, 3, cv2.LINE_AA)
    base *= (1 - 0.4 * road)[..., None]
    return rgba(base)


def place(wall, item, cx, cy, deg, shadow=True):
    it = rotate_rgba(item, deg)
    if shadow:
        sh, pad = drop_shadow(it, 10, 0.55)
        over(wall, sh, int(cx - it.shape[1] / 2 - pad + 6), int(cy - it.shape[0] / 2 - pad + 10))
    over(wall, it, int(cx - it.shape[1] / 2), int(cy - it.shape[0] / 2))


def dress_wall(wall, rng):
    items = [
        (note_card(260, 200, 21, (0.88, 0.80, 0.52)), 820, 1640, 7),
        (note_card(300, 210, 22, (0.90, 0.88, 0.82)), 1880, 1180, -5),
        (dark_photo(220, 160, 23, "forest"), 1780, 1640, 4),
        (map_fragment(420, 300, 24), 640, 2050, -3),
        (note_card(240, 180, 25, (0.86, 0.82, 0.70)), 2120, 2900, 6),
        (dark_photo(240, 170, 26, "hills"), 560, 3000, -6),
        (note_card(280, 220, 27, (0.88, 0.80, 0.52)), 620, 3650, 4),
        (map_fragment(380, 280, 28), 2150, 3800, 5),
        (note_card(300, 200, 29, (0.90, 0.88, 0.82)), 2250, 600, -4),
        (dark_photo(230, 160, 30, "forest"), 600, 520, 5),
        (note_card(260, 190, 31, (0.86, 0.82, 0.70)), 760, 4500, -7),
        (dark_photo(220, 160, 32, "hills"), 2150, 4650, 3),
    ]
    for img, cx, cy, deg in items:
        cy = cy - L.WALL_ORIGIN_Y
        place(wall, img, cx, cy, deg)
        # Nadel-Andeutung (alt, ohne Faden): kleine dunkle Kuppe
        cv2.circle(wall, (int(cx), int(cy - img.shape[0] / 2 + 18)), 7, (0.12, 0.10, 0.09, 1.0), -1, cv2.LINE_AA)


# =============================================================================
# Cover-Motive (nur Formen + Licht)
# =============================================================================
CW, CH = 320, 232


def glow(h, w, x, y, r, strength=1.0):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - x) ** 2 + (yy - y) ** 2) / r
    return strength * np.exp(-d * d)


def finish_photo(img, seed, tone=(1.0, 0.92, 0.80), gain=1.0):
    h, w = img.shape[:2]
    img = img * np.array(tone, np.float32) * gain
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = 1 - 0.45 * (((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) ** 1.3
    img = img * np.clip(v, 0, 1)[..., None]
    g = np.random.default_rng(seed).normal(0, 0.025, (h, w, 1)).astype(np.float32)
    img = np.clip(img + g, 0, 1)
    img = cv2.GaussianBlur(img, (0, 0), 0.6)
    return img


def poly(img, pts, col):
    cv2.fillPoly(img, [np.round(np.array(pts) * 4).astype(np.int32)], col, cv2.LINE_AA, shift=2)


def cover_castle():
    h, w = CH, CW
    yy = np.linspace(0, 1, h)[:, None, None]
    img = (np.array([0.10, 0.12, 0.16]) * (1 - yy) + np.array([0.22, 0.22, 0.24]) * yy).astype(np.float32)
    img = np.broadcast_to(img, (h, w, 3)).copy()
    moon = glow(h, w, 228, 62, 60, 0.55)
    img += moon[..., None] * np.array([0.8, 0.8, 0.75])
    cv2.circle(img, (228, 62), 22, (0.92, 0.9, 0.82), -1, cv2.LINE_AA)
    sil = (0.035, 0.035, 0.045)
    poly(img, [(40, 232), (40, 120), (52, 120), (52, 112), (60, 112), (60, 120), (72, 120), (72, 140),
               (96, 140), (96, 96), (104, 80), (112, 96), (112, 140), (150, 140), (150, 70), (160, 48),
               (170, 70), (170, 140), (196, 140), (196, 108), (204, 108), (204, 100), (212, 100), (212, 108),
               (220, 108), (220, 150), (250, 150), (250, 128), (262, 112), (274, 128), (274, 232)], sil)
    poly(img, [(0, 232), (0, 200), (80, 186), (160, 196), (240, 182), (320, 194), (320, 232)], (0.025, 0.025, 0.03))
    for x, y in [(104, 118), (160, 92), (160, 112), (208, 124), (60, 150), (262, 140)]:
        cv2.rectangle(img, (x - 2, y - 4), (x + 2, y + 4), (1.0, 0.70, 0.32), -1)
        img += glow(h, w, x, y, 9, 0.18)[..., None] * np.array([1.0, 0.6, 0.25])
    fog = fbm(h, w, 4, 6, 41)
    band = smoothstep(120, 232, np.arange(h, dtype=np.float32))[:, None]
    fa = np.clip((fog - 0.35) * 1.8, 0, 1) * band * 0.75
    img = img * (1 - fa[..., None]) + fa[..., None] * np.array([0.55, 0.58, 0.62])
    return finish_photo(img, 41, tone=(0.95, 0.95, 1.0))


def cover_wine():
    h, w = CH, CW
    yy = np.linspace(0, 1, h)[:, None, None]
    img = (np.array([0.05, 0.06, 0.12]) * (1 - yy) + np.array([0.18, 0.12, 0.14]) * yy).astype(np.float32)
    img = np.broadcast_to(img, (h, w, 3)).copy()
    rng = np.random.default_rng(5)
    for _ in range(60):
        x, y = rng.integers(0, w), rng.integers(0, 120)
        img[y, x] += 0.4 * rng.random()
    # Komet mit Schweif
    tail = np.zeros((h, w), np.float32)
    for i in range(60):
        u = i / 59
        x = 250 - u * 170
        y = 38 + u * 46
        cv2.circle(tail, (int(x), int(y)), int(2 + u * 10), (1 - u) * 0.35 + 0.05, -1, cv2.LINE_AA)
    tail = cv2.GaussianBlur(tail, (0, 0), 5)
    img += tail[..., None] * np.array([0.75, 0.85, 1.0])
    img += glow(h, w, 250, 38, 14, 0.9)[..., None] * np.array([1.0, 1.0, 0.95])
    # Weinberg-Reihen
    for k in range(9):
        y0 = 150 + k * 10
        pts = [(x, y0 + 12 * np.sin(x / 70 + k * .4)) for x in range(0, w + 10, 10)]
        cv2.polylines(img, [np.round(np.array(pts) * 4).astype(np.int32)], False, (0.04, 0.04, 0.05), 3,
                      cv2.LINE_AA, shift=2)
    poly(img, [(0, 232), (0, 170), (90, 150), (200, 160), (320, 140), (320, 232)], (0.05, 0.04, 0.05))
    # Weinflasche
    bx = 112
    poly(img, [(bx - 8, 54), (bx + 8, 54), (bx + 8, 104), (bx + 26, 128), (bx + 26, 232), (bx - 26, 232),
               (bx - 26, 128), (bx - 8, 104)], (0.06, 0.05, 0.05))
    cv2.line(img, (bx + 18, 134), (bx + 18, 226), (0.30, 0.32, 0.40), 2, cv2.LINE_AA)
    cv2.rectangle(img, (bx - 20, 160), (bx + 20, 196), (0.72, 0.64, 0.50), -1, cv2.LINE_AA)
    cv2.rectangle(img, (bx - 20, 166), (bx + 20, 168), (0.45, 0.10, 0.12), -1)
    return finish_photo(img, 42, gain=1.7)


def cover_studio():
    h, w = CH, CW
    img = np.zeros((h, w, 3), np.float32) + np.array([0.06, 0.06, 0.07])
    beams = np.zeros((h, w), np.float32)
    for x0, ang in [(90, -0.35), (230, 0.32)]:
        c = np.array([x0, 210])
        d1 = np.array([np.sin(ang - 0.08), -np.cos(ang - 0.08)]) * 320
        d2 = np.array([np.sin(ang + 0.08), -np.cos(ang + 0.08)]) * 320
        cv2.fillPoly(beams, [np.array([c, c + d1, c + d2], np.int32)], 1.0, cv2.LINE_AA)
    beams = cv2.GaussianBlur(beams, (0, 0), 6)
    yy = np.linspace(1, 0.3, h)[:, None]
    img += (beams * yy)[..., None] * np.array([0.55, 0.55, 0.5]) * 0.6
    # Tor mit Bogen
    gate = (0.03, 0.03, 0.035)
    poly(img, [(80, 232), (80, 110), (104, 110), (104, 232)], gate)
    poly(img, [(216, 232), (216, 110), (240, 110), (240, 232)], gate)
    cv2.ellipse(img, (160, 112), (80, 40), 0, 180, 360, gate, 12, cv2.LINE_AA)
    cv2.rectangle(img, (130, 50), (190, 82), gate, -1, cv2.LINE_AA)
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.text((160, 66), "7", font=font("playfair", 30), fill=(232, 220, 196), anchor="mm")
    img = np.asarray(im).astype(np.float32) / 255
    img += glow(h, w, 160, 66, 26, 0.25)[..., None] * np.array([1, 0.9, 0.7])
    poly(img, [(0, 232), (0, 214), (320, 214), (320, 232)], (0.10, 0.09, 0.09))
    return finish_photo(img, 43, tone=(1.0, 0.95, 0.85), gain=1.6)


def cover_hotel():
    h, w = CH, CW
    yy = np.linspace(0, 1, h)[:, None, None]
    img = (np.array([0.08, 0.10, 0.16]) * (1 - yy) + np.array([0.30, 0.32, 0.36]) * yy).astype(np.float32)
    img = np.broadcast_to(img, (h, w, 3)).copy()
    poly(img, [(0, 150), (60, 70), (110, 120), (170, 40), (240, 110), (290, 80), (320, 100), (320, 232), (0, 232)],
         (0.28, 0.30, 0.34))
    poly(img, [(150, 62), (170, 40), (192, 62), (178, 58), (170, 66), (160, 58)], (0.80, 0.82, 0.86))
    poly(img, [(46, 88), (60, 70), (76, 90), (64, 86)], (0.75, 0.77, 0.82))
    poly(img, [(0, 232), (0, 190), (320, 176), (320, 232)], (0.78, 0.80, 0.84))
    # Hotel
    poly(img, [(110, 180), (110, 120), (160, 96), (210, 120), (210, 180)], (0.05, 0.05, 0.06))
    poly(img, [(104, 122), (160, 92), (216, 122), (210, 126), (160, 100), (110, 126)], (0.82, 0.84, 0.88))
    for r in range(3):
        for c in range(5):
            x, y = 122 + c * 18, 130 + r * 16
            if (r * 5 + c) % 4 != 1:
                cv2.rectangle(img, (x, y), (x + 7, y + 8), (1.0, 0.72, 0.36), -1)
                img += glow(h, w, x + 3, y + 4, 10, 0.12)[..., None] * np.array([1.0, 0.65, 0.3])
    rng = np.random.default_rng(9)
    flakes = np.zeros((h, w), np.float32)
    for _ in range(140):
        cv2.circle(flakes, (int(rng.integers(0, w)), int(rng.integers(0, h))), int(rng.integers(1, 3)), 1.0, -1,
                   cv2.LINE_AA)
    flakes = cv2.GaussianBlur(flakes, (0, 0), 0.7)
    img = img * (1 - flakes[..., None] * .8) + flakes[..., None] * 0.9
    return finish_photo(img, 44, tone=(0.95, 0.97, 1.0))


COVER_FUNCS = {"castle": cover_castle, "wine": cover_wine, "studio": cover_studio, "hotel": cover_hotel}


def load_cover(i, kind):
    files = sorted(glob.glob(os.path.join(ASSETS, "covers", "*")))
    if len(files) > i:
        im = Image.open(files[i]).convert("RGB").resize((CW, CH), Image.LANCZOS)
        return np.asarray(im).astype(np.float32) / 255
    return np.clip(COVER_FUNCS[kind](), 0, 1)


def photo_print(cover, seed):
    B = 14
    h, w = cover.shape[:2]
    pr = rgba(paper(h + 2 * B, w + 2 * B, np.array([0.93, 0.92, 0.88], np.float32), seed, curl=0.03, edge=0.05))
    pr[B:B + h, B:B + w, :3] = cover
    # Glanz
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    sheen = np.exp(-(((xx + yy * 0.8) - w * 0.7) / 60) ** 2) * 0.06
    pr[B:B + h, B:B + w, :3] += sheen[..., None]
    return pr


def paperclip(h=150, w=46):
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    def loop(col, off, width):
        o = off * SS
        d.rounded_rectangle([4 * SS + o, 4 * SS + o, (w - 4) * SS + o, (h - 4) * SS + o], 19 * SS, outline=col,
                            width=int(width * SS))
        d.rounded_rectangle([12 * SS + o, 20 * SS + o, (w - 12) * SS + o, (h - 30) * SS + o], 11 * SS, outline=col,
                            width=int(width * SS))
    loop((40, 40, 44, 150), 2, 5)
    loop((120, 122, 128, 255), 0, 5)
    loop((225, 226, 230, 255), -0.8, 1.6)
    return pil_rgba(im.resize((w, h), Image.LANCZOS))


# =============================================================================
# Fallakte
# =============================================================================
TITLE_LINES = [
    ("Geisterstunde auf", "Ravenmoor"),
    ("Der", "Kometenjahrgang"),
    ("Tod im", "Studio 7"),
    ("Die letzte Nacht", "in Fjell"),
]
INK = (0.14, 0.11, 0.10)


def build_folder(i):
    num, title, label, kind, _ = T.CASES[i]
    W, H, TAB = L.FOLDER_W, L.FOLDER_H, L.FOLDER_TAB_H
    # --- Rueckwand mit Reiter + Innenblatt -----------------------------------
    back = np.zeros((H + TAB, W, 4), np.float32)
    board = rgba(paper(H + TAB, W, CARD * 0.94, 100 + i, curl=0.05))
    mask = np.zeros((H + TAB, W), np.float32)
    tab_x0, tab_x1 = 50, 390
    m = Image.new("L", (W * SS, (H + TAB) * SS), 0)
    dm = ImageDraw.Draw(m)
    dm.rounded_rectangle([0, TAB * SS, W * SS - 1, (H + TAB) * SS - 1], 6 * SS, fill=255)
    dm.rounded_rectangle([tab_x0 * SS, 0, tab_x1 * SS, (TAB + 20) * SS], 14 * SS, fill=255)
    mask = np.asarray(m.resize((W, H + TAB), Image.LANCZOS)).astype(np.float32) / 255
    board[..., 3] = mask
    back = board
    # Reiter-Schatten-Kante
    back[TAB - 2:TAB + 3, :, :3] *= 0.9
    tab_txt = ink(text_layer(TAB, tab_x1 - tab_x0, [(16, 13, f"FALLAKTE #{num}", "elite", 32, INK, 0.95)]), 200 + i)
    over(back, tab_txt, tab_x0, 0)
    # Innenblatt
    sw, sh = W - 36, H - 30
    sheet = rgba(paper(sh, sw, np.array([0.95, 0.93, 0.87], np.float32), 300 + i, curl=0.04, edge=0.06))
    l1, l2 = TITLE_LINES[i]
    tl = ink(text_layer(100, sw - 30, [(0, 0, l1, "elite", 34, INK, 0.95), (0, 42, l2, "elite", 34, INK, 0.95)]),
             310 + i)
    over(sheet, tl, 22, 18)
    ph = rotate_rgba(photo_print(load_cover(i, kind), 320 + i), [-2.5, 2.0, -1.5, 2.5][i])
    sh_, pad = drop_shadow(ph, 4, 0.45)
    px, py = (sw - ph.shape[1]) // 2, 112
    over(sheet, sh_, px - pad + 3, py - pad + 5)
    over(sheet, ph, px, py)
    clip = paperclip()
    over(sheet, clip, px + ph.shape[1] - 80, py - 34)
    sshadow, pad = drop_shadow(sheet, 3, 0.35)
    over(back, sshadow, 18 - pad + 2, TAB + 14 - pad + 3)
    over(back, sheet, 18, TAB + 14)

    # --- Deckel (vorne / innen) ----------------------------------------------
    flap = rgba(paper(H, W, CARD, 400 + i, curl=0.07, edge=0.12))
    flap[..., 3] = rounded_mask(H, W, 6)
    lw, lh = 372, 128
    lab = rgba(paper(lh, lw, np.array([0.97, 0.96, 0.93], np.float32), 410 + i, curl=0.02, edge=0.04))
    tt = ink(text_layer(lh - 20, lw - 24, [(0, 4, l1, "elite", 34, INK, 0.95), (0, 50, l2, "elite", 34, INK, 0.95)]),
             420 + i)
    over(lab, tt, 14, 14)
    lab[2:4, 10:-10, :3] *= 0.85
    over(flap, lab, (W - lw) // 2, 70)
    # Falzlinie
    flap[:, 14:16, :3] *= 0.86
    flap_back = rgba(paper(H, W, CARD * 0.88, 430 + i, curl=0.06, edge=0.12))
    flap_back[..., 3] = rounded_mask(H, W, 6)
    return back, flap, flap_back


# =============================================================================
# Kleinteile
# =============================================================================
def build_pin():
    S = 48
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    cx, cy, r = S / 2, S / 2, 15.0
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    a = np.clip(r - d + 0.5, 0, 1)
    nx, ny = (xx - cx) / r, (yy - cy) / r
    nz = np.sqrt(np.clip(1 - nx ** 2 - ny ** 2, 0, 1))
    lam = np.clip(-0.5 * nx - 0.6 * ny + 0.62 * nz, 0, 1)
    base = RED * 0.35 + RED * 0.95 * lam[..., None]
    spec = np.exp(-(((xx - cx + 5) ** 2 + (yy - cy + 6) ** 2) / 10.0))[..., None]
    rim = np.clip(1 - nz, 0, 1) ** 3 * 0.25
    col = base + spec * 0.95 + rim[..., None] * np.array([1, 0.6, 0.5])
    return rgba(np.clip(col, 0, 1).astype(np.float32), a)


def build_stamp():
    W, H = 560, 190
    im = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([6 * SS, 6 * SS, (W - 6) * SS, (H - 6) * SS], 16 * SS, outline=255, width=9 * SS)
    d.rounded_rectangle([20 * SS, 20 * SS, (W - 20) * SS, (H - 20) * SS], 10 * SS, outline=255, width=3 * SS)
    txt = "UNGELÖST"
    size = 104
    while True:
        fnt = font("playfair_black", size * SS)
        tw = sum(fnt.getlength(c) for c in txt) + 8 * SS * (len(txt) - 1)
        if tw <= (W - 90) * SS:
            break
        size -= 2
    x = (W * SS - tw) / 2
    for c in txt:
        d.text((x, H * SS / 2 + 4 * SS), c, font=fnt, fill=255, anchor="lm")
        x += fnt.getlength(c) + 8 * SS
    a = np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    n = fbm(H, W, 5, 30, 77)
    n2 = fbm(H, W, 2, 300, 78)
    a *= np.clip(0.88 + (n - 0.5) * 1.6 + (n2 - 0.5) * 0.7, 0, 1)
    a = np.clip(a * 1.15, 0, 0.92)
    col = np.broadcast_to(RED * 0.92, (H, W, 3)).astype(np.float32)
    return rgba(col.copy(), a)


def build_logo():
    files = glob.glob(os.path.join(ASSETS, "logo.*"))
    W, H = L.LOGO_CARD_W, L.LOGO_CARD_H
    card = rgba(paper(H, W, np.array([0.075, 0.062, 0.058], np.float32), 500, fiber=0.10, mottle=0.12,
                      curl=0.03, edge=-0.4))
    card[..., 3] = rounded_mask(H, W, 4)
    if files:
        lg = Image.open(files[0]).convert("RGBA")
        lg.thumbnail((W - 120, H - 80), Image.LANCZOS)
        arr = pil_rgba(lg)
        over(card, arr, (W - arr.shape[1]) // 2, (H - arr.shape[0]) // 2 - 20)
        return card
    size = 156
    fnt = font("playfair", size * SS)
    w1, w2 = fnt.getlength("Murder"), fnt.getlength("night")
    total = (w1 + w2) / SS
    im = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0 = (W - total) / 2 * SS
    y = 150 * SS
    d.text((x0, y), "Murder", font=fnt, fill=(255, 0, 0, 255), anchor="ls")
    d.text((x0 + w1, y), "night", font=fnt, fill=(0, 255, 0, 255), anchor="ls")
    arr = pil_rgba(im.resize((W, H), Image.LANCZOS))
    # Linie: Text-Grundlinie liegt bei ~ y=128+... skaliert
    m1, m2 = arr[..., 0] * arr[..., 3], arr[..., 1] * arr[..., 3]
    a = np.clip(m1 + m2, 0, 1)
    yy = np.linspace(0, 1, H)[:, None]
    cream = CREAM * (1.04 - 0.12 * yy)[..., None]
    red = RED * (1.10 - 0.18 * yy)[..., None]
    col = cream * (m1 / np.maximum(a, 1e-4))[..., None] + red * (m2 / np.maximum(a, 1e-4))[..., None]
    # Praegung: Highlight oben links, Schatten unten rechts
    hi = np.clip(a - np.roll(np.roll(a, 2, 0), 2, 1), 0, 1)
    lo = np.clip(a - np.roll(np.roll(a, -2, 0), -2, 1), 0, 1)
    hi = cv2.GaussianBlur(hi, (0, 0), 0.8)
    lo = cv2.GaussianBlur(lo, (0, 0), 0.8)
    col = col * (1 - 0.35 * lo[..., None]) + 0.30 * hi[..., None]
    deb = cv2.GaussianBlur(a, (0, 0), 3)
    sh = np.clip(np.roll(np.roll(deb, 4, 0), 3, 1) - a, 0, 1) * 0.7
    card[..., :3] *= (1 - sh[..., None])
    over(card, rgba(np.clip(col, 0, 1).astype(np.float32), a), 0, 0)
    return card


def build_phone():
    W, H = L.PHONE_W, L.PHONE_H
    body = np.zeros((H, W, 4), np.float32)
    m = rounded_mask(H, W, 64)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    base = np.array([0.10, 0.10, 0.11]) * (0.85 + 0.3 * (1 - xx / W))[..., None]
    body[..., :3] = base
    body[..., 3] = m
    inner = rounded_mask(H - 8, W - 8, 60)
    rim = m.copy()
    rim[4:-4, 4:-4] -= inner
    rim = np.clip(rim, 0, 1)
    rim_col = 0.35 + 0.35 * np.cos((xx / W + yy / H) * 3.0)
    body[..., :3] = body[..., :3] * (1 - rim[..., None]) + (rim * rim_col)[..., None] * np.array([0.9, 0.88, 0.85])
    # Display
    B = 18
    sw, sh = W - 2 * B, H - 2 * B
    scr = np.zeros((sh, sw, 3), np.float32) + np.array([0.055, 0.05, 0.05])
    # PDF-Seite im Display
    pw, phh = sw - 50, int((sw - 50) * 1.414)
    page = paper(phh, pw, np.array([0.93, 0.90, 0.83], np.float32), 600, curl=0.02, edge=0.05)
    cov = cv2.resize(load_cover(0, "castle"), (pw - 40, int((pw - 40) * CH / CW)), interpolation=cv2.INTER_AREA)
    page[30:30 + cov.shape[0], 20:20 + cov.shape[1]] = cov
    pt = pseudo_text(200, pw - 50, 601, size=13, lines=7, lh=22, alpha=0.55)
    page_rgba = rgba(page)
    over(page_rgba, pt, 25, 50 + cov.shape[0])
    py = 110
    scr[py:py + phh, 25:25 + pw] = page_rgba[..., :3]
    # Fortschrittsbalken (Download)
    cv2.rectangle(scr, (40, sh - 120), (sw - 40, sh - 112), (0.18, 0.17, 0.16), -1)
    cv2.rectangle(scr, (40, sh - 120), (sw - 40, sh - 112), tuple(float(c) for c in RED), -1)
    # Download-Pfeil
    cx = sw // 2
    cv2.line(scr, (cx, sh - 80), (cx, sh - 50), (0.85, 0.82, 0.76), 3, cv2.LINE_AA)
    cv2.line(scr, (cx - 12, sh - 62), (cx, sh - 50), (0.85, 0.82, 0.76), 3, cv2.LINE_AA)
    cv2.line(scr, (cx + 12, sh - 62), (cx, sh - 50), (0.85, 0.82, 0.76), 3, cv2.LINE_AA)
    cv2.line(scr, (cx - 20, sh - 40), (cx + 20, sh - 40), (0.85, 0.82, 0.76), 3, cv2.LINE_AA)
    sm = rounded_mask(sh, sw, 46)
    body[B:B + sh, B:B + sw, :3] = body[B:B + sh, B:B + sw, :3] * (1 - sm[..., None]) + scr * sm[..., None]
    # Dynamic Island
    cv2.ellipse(body, (W // 2, B + 30), (46, 13), 0, 0, 360, (0, 0, 0, 1), -1, cv2.LINE_AA)
    # Glasreflex
    refl = np.clip(1 - np.abs((xx * 0.9 - yy * 0.45) - W * 0.15) / 120, 0, 1) ** 2 * 0.10
    body[..., :3] += refl[..., None] * m[..., None]
    body[..., 3] = m
    return body


PAGE_TITLES = [("Einladung", ""), ("Rollenhefte", ""), ("Heft der", "Spielleitung"), ("Auflösung", "im Umschlag")]


def build_page(i):
    W, H = L.PAGE_W, L.PAGE_H
    l1, l2 = PAGE_TITLES[i]
    if i == 3:
        env = rgba(paper(H, W, np.array([0.70, 0.56, 0.38], np.float32), 700 + i, curl=0.05, edge=0.12))
        env[..., 3] = rounded_mask(H, W, 5)
        fl = np.zeros((H, W), np.float32)
        cv2.polylines(fl, [np.array([[0, 150], [W // 2, 330], [W, 150]], np.int32)], False, 1.0, 2, cv2.LINE_AA)
        env[..., :3] *= (1 - 0.35 * cv2.GaussianBlur(fl, (0, 0), 1.2))[..., None]
        # Siegel
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        cx, cy = W / 2, 330
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        n = fbm(H, W, 3, 30, 710)
        a = np.clip(44 + (n - 0.5) * 10 - d, 0, 1)
        sh = np.clip(1 - d / 44, 0, 1)
        seal = RED * (0.65 + 0.45 * sh)[..., None]
        env[..., :3] = env[..., :3] * (1 - a[..., None]) + seal * a[..., None]
        mt = text_layer(80, 80, [(16, 0, "M", "playfair", 52, (0.45, 0.04, 0.07), 0.9)])
        over(env, mt, int(cx - 40) + 4, int(cy - 40) - 6)
        lab = rgba(paper(130, 300, np.array([0.96, 0.95, 0.91], np.float32), 720, curl=0.02, edge=0.04))
        tt = ink(text_layer(120, 280, [(0, 0, l1, "elite", 44, INK, 0.95), (0, 54, l2, "elite", 44, INK, 0.95)]), 721)
        over(lab, tt, 12, 10)
        over(env, lab, 24, 16)
        return env
    pg = rgba(paper(H, W, np.array([0.95, 0.93, 0.87], np.float32), 700 + i, curl=0.05, edge=0.08))
    pg[..., 3] = rounded_mask(H, W, 3)
    items = [(26, 20, l1, "elite", 46, INK, 0.95)]
    if l2:
        items.append((26, 72, l2, "elite", 46, INK, 0.95))
    tt = ink(text_layer(140, W - 30, items), 730 + i)
    over(pg, tt, 0, 0)
    y = 150 if l2 else 100
    cv2.line(pg, (26, y), (W - 26, y), (0.55, 0.12, 0.13, 1), 2, cv2.LINE_AA)
    pt = pseudo_text(H - y - 50, W - 56, 740 + i, size=16, lines=(H - y - 60) // 26, lh=26, alpha=0.55)
    over(pg, pt, 28, y + 22)
    if i == 1:  # Stapel aus Rollenheften
        stack = np.zeros((H + 24, W + 24, 4), np.float32)
        for k in (2, 1):
            s = rgba(paper(H, W, np.array([0.90, 0.88, 0.82], np.float32), 750 + k))
            s[..., 3] = rounded_mask(H, W, 3)
            over(stack, s, 12 * k, 12 * k)
        over(stack, pg, 0, 0)
        return stack
    return pg


def build_candle():
    W, H = 170, 600
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    u = (xx - W / 2) / (W / 2)
    shade = np.clip(1 - 0.55 * u ** 2 - 0.2 * u, 0, 1)
    col = np.array([0.93, 0.85, 0.70]) * shade[..., None]
    # oben warm durchleuchtet
    col += np.exp(-yy / 60)[..., None] * np.array([0.5, 0.25, 0.05]) * (1 - np.abs(u))[..., None]
    a = (np.abs(u) < 1).astype(np.float32)
    a[:12] = np.clip((yy[:12] - 12 + 14 * np.sqrt(np.clip(1 - u[:12] ** 2, 0, 1))) / 2, 0, 1)
    candle = rgba(np.clip(col, 0, 1).astype(np.float32), a)
    # Docht
    cv2.line(candle, (W // 2, 0), (W // 2 + 2, 22), (0.05, 0.04, 0.03, 1), 4, cv2.LINE_AA)
    return candle


def build_flame():
    W, H = 70, 170
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx = W / 2
    v = yy / H
    width = 26 * np.sin(np.clip(v, 0, 1) * np.pi * 0.95) ** 0.7 * (0.35 + 0.65 * v)
    d = np.abs(xx - cx) / np.maximum(width, 1e-3)
    body = np.clip(1 - d, 0, 1) * smoothstep(0.0, 0.35, v) * (1 - smoothstep(0.92, 1.0, v))
    core = np.clip(1 - d * 1.8, 0, 1) * smoothstep(0.45, 0.8, v)
    col = (np.array([1.0, 0.55, 0.15]) * body[..., None] + np.array([1.0, 0.95, 0.8]) * core[..., None])
    blue = np.clip(1 - d, 0, 1) * smoothstep(0.86, 0.95, v) * 0.6
    col += np.array([0.2, 0.3, 1.0]) * blue[..., None]
    a = np.clip(body * 1.2 + blue, 0, 1)
    return rgba(np.clip(col, 0, 1).astype(np.float32), a)


def label_strip(i, nchars):
    """Getippter Etikettstreifen (Teilstring bis nchars)."""
    lines = L.LABEL_LINES[i]
    fnt = font("elite", L.LABEL_SIZE)
    W = int(max(fnt.getlength(l) for l in lines) + 30)
    H = int(L.LABEL_SIZE * 2 + 40)
    strip = rgba(paper(H, W, np.array([0.96, 0.95, 0.90], np.float32), 800 + i, curl=0.03, edge=0.05))
    strip[..., 3] = 1.0
    rem = nchars
    items = []
    for k, l in enumerate(lines):
        part = l[:max(0, rem)]
        rem -= len(l) + 1
        if part:
            items.append((15, 10 + k * (L.LABEL_SIZE + 6), part, "elite", L.LABEL_SIZE, INK, 0.96))
    if items:
        tl = ink(text_layer(H, W, items), 810 + i, 0.3)
        over(strip, tl, 0, 0)
    return strip


def label_total_chars(i):
    return sum(len(l) for l in L.LABEL_LINES[i]) + 1


# =============================================================================
# Cache
# =============================================================================
def build_all(force=False):
    os.makedirs(CACHE, exist_ok=True)
    jobs = {"wall": build_wall, "pin": build_pin, "stamp": build_stamp, "logo": build_logo,
            "phone": build_phone, "candle": build_candle, "flame": build_flame}
    for i in range(4):
        jobs[f"page{i}"] = (lambda i=i: build_page(i))
    for name, fn in jobs.items():
        p = os.path.join(CACHE, name + ".npy")
        if force or not os.path.exists(p):
            arr = fn()
            if name == "wall":
                np.save(p, (np.clip(arr[..., :3], 0, 1) * 255 + 0.5).astype(np.uint8))
            else:
                np.save(p, arr.astype(np.float32))
            prev = arr if name != "wall" else arr[::4, ::4]
            Image.fromarray((np.clip(prev, 0, 1) * 255).astype(np.uint8)).save(os.path.join(CACHE, name + ".png"))
    for i in range(4):
        p = os.path.join(CACHE, f"folder{i}_back.npy")
        if force or not os.path.exists(p):
            back, flap, flap_back = build_folder(i)
            for nm, arr in (("back", back), ("flap", flap), ("flapback", flap_back)):
                np.save(os.path.join(CACHE, f"folder{i}_{nm}.npy"), arr)
                Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(
                    os.path.join(CACHE, f"folder{i}_{nm}.png"))


if __name__ == "__main__":
    import sys
    build_all(force="--force" in sys.argv)
    print("assets ok")
