"""Murdernight Reel v5 – Finish: Farblook, Typografie, Logo, Export.

Rendert jede Szene mit Grading + Typo als eigene MP4 (build/final_scenes), verbindet sie per
concat demuxer (-c copy) und legt den Ton mit -c:v copy an.
Aufruf: python final.py   (vorher: python mix.py)
"""
import os
import subprocess

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import scenes

ROOT = scenes.ROOT
B, W, H, FPS = scenes.B, scenes.W, scenes.H, scenes.FPS
OUT = os.path.join(ROOT, 'out')
IVORY, RED, GOLD = (243, 237, 226), (179, 18, 28), (212, 175, 55)
SAFE_X0, SAFE_X1, SAFE_Y0, SAFE_Y1 = 40, W - 140, 220, H - 420

# ---------------------------------------------------------------- Farblook

WORLD = ['club'] * 3 + ['dinner'] * 3 + ['home'] * 3
_rng = np.random.default_rng(3)
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGNETTE = 1 - 0.32 * (((_xx - W / 2) / (W * 0.62)) ** 2 + ((_yy - H / 2) / (H * 0.62)) ** 2)
VIGNETTE = np.clip(VIGNETTE, 0.55, 1)[..., None]

LOOKS = {
    # Belichtung, Kontrast, Sättigung, Schatten-Tint (BGR), Lichter-Tint (BGR), Halation-Farbe (BGR)
    'club':   dict(exp=0.95, con=1.12, sat=1.10, sh=(0.035, 0.025, -0.01), hi=(-0.02, 0.0, 0.03), hal=(0.25, 0.25, 1.0)),
    'dinner': dict(exp=0.78, con=1.15, sat=1.00, sh=(0.04, 0.012, -0.015), hi=(-0.05, 0.01, 0.05), hal=(0.2, 0.55, 1.0)),
    'home':   dict(exp=1.04, con=1.04, sat=1.08, sh=(-0.005, 0.005, 0.01), hi=(-0.035, 0.0, 0.03), hal=(0.35, 0.6, 1.0)),
}


def grade(img, world):
    lk = LOOKS[world]
    x = img.astype(np.float32) / 255
    x = x * lk['exp']
    x = np.clip((x - 0.5) * lk['con'] + 0.5 - 0.02, 0, 1)  # Schwarzpunkt leicht runter
    lum = x.mean(2, keepdims=True)
    x = lum + (x - lum) * lk['sat']
    w_sh = (1 - lum) ** 2
    w_hi = lum ** 2
    x = x + w_sh * np.array(lk['sh'], np.float32) + w_hi * np.array(lk['hi'], np.float32)
    # Halation: rot-orange Glow um helle Lichter
    hi = np.clip((lum - 0.78) / 0.22, 0, 1)
    hal = cv2.GaussianBlur(hi, (0, 0), 18)[..., None] * np.array(lk['hal'], np.float32) * 0.18
    x = x + hal
    x = x * VIGNETTE
    # feines Filmkorn (luma)
    x = x + _rng.normal(0, 0.018, (H // 2, W // 2)).astype(np.float32).repeat(2, 0).repeat(2, 1)[..., None]
    return np.clip(x * 255, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- Typografie

def font(path, size, var):
    f = ImageFont.truetype(os.path.join(ROOT, 'fonts', path), size)
    f.set_variation_by_name(var)
    return f


def text_layer(lines, size, y_top, align='left', x_left=72, line_gap=1.02, red_words=(), face='Playfair', stroke=3):
    """RGBA-Ebene 1080x1920. lines: Liste von Zeilen; Wörter in red_words werden rot."""
    f = font('PlayfairDisplay.ttf', size, 'Bold') if face == 'Playfair' else font('Inter.ttf', size, 'SemiBold')
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    y = y_top
    boxes = []
    for line in lines:
        width = f.getlength(line)
        x = x_left if align == 'left' else (SAFE_X0 + SAFE_X1) / 2 - width / 2
        cx = x
        for i, word in enumerate(line.split(' ')):
            token = word + (' ' if i < len(line.split(' ')) - 1 else '')
            col = RED if word.strip('.,?!…') in red_words else IVORY
            d.text((cx, y), token, font=f, fill=col + (255,), stroke_width=stroke, stroke_fill=(14, 8, 8, 235))
            cx += f.getlength(token)
        boxes.append((x, y, x + width, y + size * 1.25))
        y += int(size * line_gap * 1.08)
    for x0, y0, x1, y1 in boxes:  # Safe-Zone-Prüfung
        assert x0 >= SAFE_X0 and x1 <= SAFE_X1 and y0 >= SAFE_Y0 and y1 <= SAFE_Y1, (lines, x0, y0, x1, y1)
    # weicher Schatten für Lesbarkeit
    a = np.array(layer)[..., 3]
    sh = Image.fromarray(a).filter(ImageFilter.GaussianBlur(20))
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shadow.putalpha(sh.point(lambda v: min(255, int(v * 1.1))))
    shadow = shadow.transform((W, H), Image.AFFINE, (1, 0, 0, 0, 1, -6))
    return Image.alpha_composite(shadow, layer)


def to_np(layer):
    a = np.array(layer).astype(np.float32) / 255
    return a[..., [2, 1, 0]], a[..., 3:4]  # BGR, alpha


class Title:
    """Einblendung: 7 Frames Fade + Blur->scharf + Scale 1,04->1; optional 2-Frame-Flash."""

    def __init__(self, layer, t0, t1, flash=False, fade_out=4, anchor=(W / 2, H / 2)):
        self.rgb, self.a = to_np(layer)
        self.t0, self.t1, self.flash, self.fo, self.anchor = t0, t1, flash, fade_out, anchor

    def apply(self, img, t):
        if t < self.t0 or t >= self.t1:
            return img
        k = (t - self.t0) * FPS
        p = min(1.0, k / 7)
        e = p * p * (3 - 2 * p)
        alpha = e * min(1.0, (self.t1 - t) * FPS / self.fo) if self.fo else e
        rgb, a = self.rgb, self.a
        s = 1.04 - 0.04 * e
        blur = (1 - e) * 9
        if s != 1 or blur > 0.3:
            m = np.float32([[s, 0, (1 - s) * self.anchor[0]], [0, s, (1 - s) * self.anchor[1]]])
            rgb = cv2.warpAffine(rgb, m, (W, H))
            a = cv2.warpAffine(a, m, (W, H))[..., None]
            if blur > 0.3:
                rgb = cv2.GaussianBlur(rgb, (0, 0), blur)
                a = cv2.GaussianBlur(a, (0, 0), blur)[..., None]
        x = img.astype(np.float32) / 255
        x = x * (1 - a * alpha) + rgb * a * alpha
        if self.flash and k < 2:
            x = x * 0.45 + 0.55
        return np.clip(x * 255, 0, 255).astype(np.uint8)


class Logo:
    """Wortmarke Murdernight: Elfenbein, ein goldener Schimmer läuft einmal darüber."""

    def __init__(self, t0, t1):
        self.t0, self.t1 = t0, t1
        f = font('PlayfairDisplay.ttf', 150, 'Bold')
        fs = font('Inter.ttf', 50, 'Medium')
        word, sub = 'Murdernight', '8,99 € · murdernight.de'
        lay = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(lay)
        wx = (SAFE_X0 + SAFE_X1) / 2 - f.getlength(word) / 2
        d.text((wx, 790), word, font=f, fill=255)
        self.word_a = np.array(lay).astype(np.float32)[..., None] / 255
        lay2 = Image.new('L', (W, H), 0)
        d2 = ImageDraw.Draw(lay2)
        d2.text(((SAFE_X0 + SAFE_X1) / 2 - fs.getlength(sub) / 2, 1010), sub, font=fs, fill=255)
        self.sub_a = np.array(lay2).astype(np.float32)[..., None] / 255
        assert wx >= SAFE_X0 and wx + f.getlength(word) <= SAFE_X1
        # dünne Goldlinie zwischen Wortmarke und Preiszeile
        self.rule = np.zeros((H, W, 1), np.float32)
        self.rule[985:988, W // 2 - 70 - 70:W // 2 + 70 - 70] = 1

    def apply(self, img, t):
        if t < self.t0 or t >= self.t1:
            return img
        k = (t - self.t0) * FPS
        e = min(1.0, k / 8)
        out_fade = min(1.0, (self.t1 - t) / 0.35)
        x = img.astype(np.float32) / 255
        ivory = np.array(IVORY[::-1], np.float32) / 255
        gold = np.array(GOLD[::-1], np.float32) / 255
        # Schimmer-Band (diagonal), läuft 0,25–1,05 s nach Einblendung von links nach rechts
        sp = np.clip((t - self.t0 - 0.25) / 0.8, 0, 1)
        band_x = -300 + sp * (W + 600)
        band = np.exp(-(((scenes_xx - band_x) + 0.35 * (scenes_yy - 860)) / 90) ** 2)[..., None] if 0 < sp < 1 else 0
        col = ivory * (1 - 0.35) + gold * 0.35 + band * (np.array([0.75, 0.93, 1.0], np.float32) - ivory) * 0.9
        a = self.word_a * e * out_fade
        x = x * (1 - a) + col * a
        a2 = (self.sub_a * np.clip((k - 10) / 7, 0, 1) + self.rule * np.clip((k - 6) / 7, 0, 1)) * out_fade
        x = x * (1 - a2) + np.where(self.rule > 0, gold, ivory) * a2
        return np.clip(x * 255, 0, 255).astype(np.uint8)


scenes_yy, scenes_xx = np.mgrid[0:H, 0:W].astype(np.float32)


def scrim(img, y0, y1, strength=0.45):
    """Dezente Abdunklung hinter Textblöcken auf hellem Grund."""
    g = np.zeros((H, 1, 1), np.float32)
    g[y0:y1] = 1
    g = cv2.GaussianBlur(g, (1, 0), sigmaX=0, sigmaY=90).reshape(H, 1, 1) * strength
    return (img.astype(np.float32) * (1 - g)).astype(np.uint8)


def build_titles():
    T = []
    lower = 1150
    T.append(Title(text_layer(['Einer von', 'euch …'], 130, lower, red_words=('euch',)), 0.15, 1.8, fade_out=0))
    T.append(Title(text_layer(['… ist ein', 'Mörder.'], 130, lower, red_words=('Mörder',)), 1.8, 3.4, flash=True))
    T.append(Title(text_layer(['Einer an', 'diesem', 'Tisch.'], 130, 250, red_words=('Tisch',)), 5.05, 6.2))
    lab = dict(face='Inter', align='left', x_left=72)
    T.append(Title(text_layer(['DIE GASTGEBERIN'], 72, 1380, red_words=('GASTGEBERIN',), **lab), 6.2, 6.7, fade_out=0))
    T.append(Title(text_layer(['DER NOTAR'], 72, 1380, red_words=('NOTAR',), **lab), 6.7, 7.2, fade_out=0))
    T.append(Title(text_layer(['DER PARTNER'], 72, 1380, red_words=('PARTNER',), **lab), 7.2, 7.7, fade_out=0))
    T.append(Title(text_layer(["Wer war's?"], 150, 820, align='center', red_words=("war's",)), 7.95, 8.6, fade_out=3))
    T.append(Title(text_layer(['Euer', 'Krimidinner.', 'Zuhause.'], 130, 250, red_words=('Zuhause',)), 8.75, 11.0))
    T.append(Title(text_layer(['9 Fälle'], 110, 250, red_words=('Fälle',), x_left=48), 11.0, 12.8, flash=True))
    T.append(Title(text_layer(['5–12 Personen'], 110, 385, red_words=('Personen',), x_left=48), 11.25, 12.8))
    T.append(None)  # wird durch build_sofort_red() ersetzt
    return T


def build_sofort_red():
    """‚Sofort‘ rot, ‚-Download‘ elfenbein (ein rotes Wort pro Zeile)."""
    f = font('PlayfairDisplay.ttf', 110, 'Bold')
    lay = text_layer(['Sofort-Download'], 110, 520, x_left=48)
    arr = np.array(lay)
    x0 = 48
    x1 = int(x0 + f.getlength('Sofort'))
    ink = arr[:, x0 - 4:x1, 3] > 0
    reg = arr[:, x0 - 4:x1]
    bright = reg[..., :3].mean(2) > 120  # Schrift, nicht Schatten
    reg[ink & bright, :3] = RED
    arr[:, x0 - 4:x1] = reg
    return Title(Image.fromarray(arr), 11.5, 12.8)


def main():
    titles = build_titles()
    titles[-1] = build_sofort_red()
    logo = Logo(13.0, 14.5)
    starts = np.cumsum([0] + [fn()[0] for fn in scenes.SCENES])

    def post(idx, t_local, img):
        t = starts[idx] + t_local
        img = grade(img, WORLD[idx])
        if 11.0 <= t < 12.8:
            img = scrim(img, 230, 700, 0.5)
        if 8.75 <= t < 11.0:
            img = scrim(img, 230, 720, 0.35)
        for ti in titles:
            img = ti.apply(img, t)
        return logo.apply(img, t)

    outdir = os.path.join(B, 'final_scenes')
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, 'list.txt'), 'w') as lst:
        for i, s in enumerate(scenes.SCENES):
            path, n = scenes.render(i, s, outdir, post=post)
            lst.write(f"file '{os.path.basename(path)}'\n")
            print(os.path.basename(path), n)

    video = os.path.join(B, 'final_video.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i',
                    os.path.join(outdir, 'list.txt'), '-c', 'copy', video], check=True)
    os.makedirs(OUT, exist_ok=True)
    for mix, name in (('mix_full', 'murdernight_reel_v5.mp4'), ('mix_ohne_musik', 'murdernight_reel_v5_ohne_musik.mp4')):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', os.path.join(B, 'audio', 'mix', mix + '.wav'),
                        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
                        '-shortest', '-movflags', '+faststart', os.path.join(OUT, name)], check=True)
        print('->', name)


if __name__ == '__main__':
    main()
