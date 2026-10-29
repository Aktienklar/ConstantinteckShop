"""Gemeinsame Helfer: Pfade, Schriften, Rauschen, Sprites, Compositing."""
import os
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "fonts")
BUILD = os.path.join(ROOT, "build")
OUT = os.path.join(ROOT, "out")
ASSETS = os.path.join(ROOT, "assets")

cv2.setNumThreads(1)


# --- Schriften ---------------------------------------------------------------
@lru_cache(maxsize=None)
def font(name, size):
    if name == "playfair":
        f = ImageFont.truetype(os.path.join(FONTS, "PlayfairDisplay.ttf"), size)
        f.set_variation_by_name("Bold")
    elif name == "playfair_black":
        f = ImageFont.truetype(os.path.join(FONTS, "PlayfairDisplay.ttf"), size)
        f.set_variation_by_name("Black")
    elif name == "elite":
        f = ImageFont.truetype(os.path.join(FONTS, "SpecialElite-Regular.ttf"), size)
    elif name == "inter":
        f = ImageFont.truetype(os.path.join(FONTS, "Inter.ttf"), size)
        try:
            f.set_variation_by_axes([24, 600])
        except Exception:
            pass
    else:
        raise ValueError(name)
    return f


# --- Rauschen ----------------------------------------------------------------
def fbm(h, w, octaves=5, base=8, seed=0, persistence=0.55):
    """Fraktales Value-Noise, Wertebereich ca. 0..1."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    cells = base
    for _ in range(octaves):
        gh = max(2, int(h / max(h, w) * cells) + 2)
        gw = max(2, int(w / max(h, w) * cells) + 2)
        g = rng.random((gh, gw)).astype(np.float32)
        out += amp * cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)
        total += amp
        amp *= persistence
        cells *= 2
    out /= total
    return np.clip(out, 0, 1)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def ease_out_cubic(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def ease_out_back(x, s=1.7):
    x = min(max(x, 0.0), 1.0)
    x -= 1
    return 1 + x * x * ((s + 1) * x + s)


def clamp01(x):
    return min(max(x, 0.0), 1.0)


# --- Sprites -----------------------------------------------------------------
class Sprite:
    """RGBA-Bild (float32, premultiplied) mit Mip-Stufen."""

    def __init__(self, rgba, premultiplied=False):
        rgba = rgba.astype(np.float32)
        if rgba.max() > 1.5:
            rgba /= 255.0
        if not premultiplied:
            rgba[..., :3] *= rgba[..., 3:4]
        self.levels = [rgba]
        while min(self.levels[-1].shape[:2]) > 64:
            self.levels.append(cv2.pyrDown(self.levels[-1]))

    @property
    def img(self):
        return self.levels[0]

    @property
    def h(self):
        return self.levels[0].shape[0]

    @property
    def w(self):
        return self.levels[0].shape[1]


def pil_to_sprite(im):
    return Sprite(np.asarray(im.convert("RGBA")).astype(np.float32) / 255.0)


def affine(tx, ty, scale=1.0, rot=0.0, ox=0.0, oy=0.0, sx=None, sy=None):
    """Matrix: Sprite-Pixel (um Ursprung ox,oy) -> Ziel (tx,ty)."""
    sx = scale if sx is None else sx
    sy = scale if sy is None else sy
    c, s = np.cos(rot), np.sin(rot)
    A = np.array([[c * sx, -s * sy], [s * sx, c * sy]], np.float64)
    t = np.array([tx, ty]) - A @ np.array([ox, oy])
    return np.hstack([A, t[:, None]])


def compose(M_outer, M_inner):
    A = np.vstack([M_outer, [0, 0, 1]]) @ np.vstack([M_inner, [0, 0, 1]])
    return A[:2]


def _pick_level(sprite, M):
    scale = np.sqrt(abs(np.linalg.det(M[:, :2])))
    lvl = 0
    while lvl + 1 < len(sprite.levels) and scale * (2 ** lvl) < 0.55:
        lvl += 1
    if lvl:
        f = 2 ** lvl
        M = M.copy()
        M[:, :2] *= f
    return sprite.levels[lvl], M


def blit(canvas, sprite, M, alpha=1.0, blur=0.0, mode="over", tint=None):
    """Sprite mit Affin-Matrix M auf canvas (HxWx3 float32) compositen."""
    if alpha <= 0.002:
        return
    img, M = _pick_level(sprite, M)
    h, w = img.shape[:2]
    corners = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]], np.float64).T
    pts = M @ corners
    pad = int(blur * 3) + 2
    H, W = canvas.shape[:2]
    x0 = int(max(0, np.floor(pts[0].min()) - pad))
    y0 = int(max(0, np.floor(pts[1].min()) - pad))
    x1 = int(min(W, np.ceil(pts[0].max()) + pad))
    y1 = int(min(H, np.ceil(pts[1].max()) + pad))
    if x1 <= x0 or y1 <= y0:
        return
    M2 = M.copy()
    M2[0, 2] -= x0
    M2[1, 2] -= y0
    out = cv2.warpAffine(img, M2, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    _composite(canvas, out, x0, y0, alpha, blur, mode, tint)


def blit_persp(canvas, sprite, Hm, alpha=1.0, blur=0.0, tint=None):
    img = sprite.levels[0]
    h, w = img.shape[:2]
    corners = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]], np.float64).T
    p = Hm @ corners
    p = p[:2] / p[2]
    Hc, Wc = canvas.shape[:2]
    pad = int(blur * 3) + 2
    x0 = int(max(0, np.floor(p[0].min()) - pad))
    y0 = int(max(0, np.floor(p[1].min()) - pad))
    x1 = int(min(Wc, np.ceil(p[0].max()) + pad))
    y1 = int(min(Hc, np.ceil(p[1].max()) + pad))
    if x1 <= x0 or y1 <= y0:
        return
    T = np.array([[1, 0, -x0], [0, 1, -y0], [0, 0, 1]], np.float64)
    out = cv2.warpPerspective(img, T @ Hm, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR,
                              borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    _composite(canvas, out, x0, y0, alpha, blur, "over", tint)


def _composite(canvas, out, x0, y0, alpha, blur, mode, tint):
    if blur > 0.3:
        out = cv2.GaussianBlur(out, (0, 0), blur)
    roi = canvas[y0:y0 + out.shape[0], x0:x0 + out.shape[1]]
    a = out[..., 3:4] * alpha
    rgb = out[..., :3] * alpha
    if tint is not None:
        rgb = rgb * np.array(tint, np.float32)
    if mode == "over":
        roi *= (1 - a)
        roi += rgb
    elif mode == "add":
        roi += rgb
    elif mode == "multiply":  # rgb = Faktor (premult), a = Deckung
        roi *= (1 - a) + rgb


# --- Text --------------------------------------------------------------------
def text_runs_image(runs, size, fontname, tracking=0, shadow=True, pad=40):
    """runs: Liste (text, rgb). Gibt PIL-RGBA + Baseline-Info zurueck."""
    fnt = font(fontname, size)
    widths = []
    for txt, _ in runs:
        widths.append(fnt.getlength(txt) + tracking * len(txt))
    total = sum(widths)
    asc, desc = fnt.getmetrics()
    W = int(total + 2 * pad)
    H = int(asc + desc + 2 * pad)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = pad
    for (txt, col), wdt in zip(runs, widths):
        if tracking:
            for ch in txt:
                d.text((x, pad), ch, font=fnt, fill=tuple(col) + (255,))
                x += fnt.getlength(ch) + tracking
        else:
            d.text((x, pad), txt, font=fnt, fill=tuple(col) + (255,))
            x += wdt
    if shadow:
        a = np.asarray(im)[..., 3].astype(np.float32) / 255.0
        sh = cv2.GaussianBlur(a, (0, 0), size * 0.09)
        sh2 = cv2.GaussianBlur(a, (0, 0), size * 0.25)
        sh = np.clip(sh * 0.85 + sh2 * 0.55, 0, 1)
        sh = np.roll(sh, int(size * 0.04), axis=0)
        base = np.zeros((H, W, 4), np.float32)
        base[..., 3] = sh
        fg = np.asarray(im).astype(np.float32) / 255.0
        out = fg.copy()
        out[..., :3] = fg[..., :3] * fg[..., 3:4]
        out[..., 3] = fg[..., 3] + sh * (1 - fg[..., 3])
        # un-premultiply fuer Rueckgabe
        rgb = np.where(out[..., 3:4] > 1e-4, out[..., :3] / np.maximum(out[..., 3:4], 1e-4), 0)
        out[..., :3] = rgb
        im = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), "RGBA")
    return im, pad, total, asc + desc


@lru_cache(maxsize=256)
def text_sprite(runs, size, fontname, tracking=0, shadow=True):
    im, pad, tw, th = text_runs_image(list(runs), size, fontname, tracking, shadow)
    return pil_to_sprite(im), pad, tw, th


def to_u8(img):
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)
