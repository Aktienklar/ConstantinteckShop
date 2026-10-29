"""Murdernight Reel v5 – Bildschnitt (ohne Typo/Grading).

Rendert jede Szene einzeln als MP4 (build/scenes/sNN.mp4) aus Clips und Standbildern:
Zeit-Remapping (Speed Ramps), digitale Push-ins, Whip-Pan-Naht mit Motion Blur,
Strobe-Flashes, Kerzenflackern. 1080x1920, 30 fps.
"""
import os
import subprocess
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'build')
W, H, FPS = 1080, 1920, 30
BPM_BEAT = 60 / 122


class Clip:
    """Sequenzieller Zugriff auf Videoframes per Quellzeit (Sekunden)."""

    def __init__(self, path):
        self.cap = cv2.VideoCapture(path)
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.n = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.idx, self.frame = -1, None

    def at(self, t):
        i = int(np.clip(round(t * self.fps), 0, self.n - 1))
        if i < self.idx:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            self.idx = i - 1
        while self.idx < i:
            ok, f = self.cap.read()
            if not ok:
                break
            self.frame, self.idx = f, self.idx + 1
        return cv2.resize(self.frame, (W, H), interpolation=cv2.INTER_AREA)


def still(name):
    img = cv2.imread(os.path.join(B, 'styleframes', name))
    return cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA if img.shape[1] > W else cv2.INTER_CUBIC)


def zoom(img, s, cx=0.5, cy=0.5):
    """Digitaler Push-in um (cx, cy), s >= 1."""
    if s <= 1.0001:
        return img
    m = np.float32([[s, 0, (1 - s) * cx * W], [0, s, (1 - s) * cy * H]])
    return cv2.warpAffine(img, m, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def hblur(img, px):
    """Horizontaler Motion Blur (Whip-Pan) mit Kernel-Länge px."""
    px = int(px)
    if px < 3:
        return img
    k = np.zeros((1, px), np.float32)
    k[0, :] = 1.0 / px
    return cv2.filter2D(img, -1, k)


def shift(img, dx):
    m = np.float32([[1, 0, dx], [0, 1, 0]])
    return cv2.warpAffine(img, m, (W, H), borderMode=cv2.BORDER_REFLECT)


def ease(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


# ---------- Szenen: Funktion(t_local) -> BGR-Frame ----------

def s01_hook():
    c = Clip(os.path.join(B, 'clips', 'V1.mp4'))

    def src(t):  # Slow-Mo, kurz vor dem Schnitt auf Echtzeit+
        return 0.75 * t if t < 1.3 else 0.975 + 1.6 * (t - 1.3)

    return 1.8, lambda t: zoom(c.at(src(t)), 1.0 + 0.05 * t / 1.8, 0.45, 0.45)


def s02_nichts_bemerkt():
    c = Clip(os.path.join(B, 'clips', 'V2.mp4'))

    def f(t):
        img = c.at(0.3 + 1.5 * t)
        # Strobe-Flash auf jedem Beat (2 Frames)
        beat_phase = ((t + 1.8) % BPM_BEAT)
        if beat_phase < 2 / FPS:
            img = cv2.addWeighted(img, 0.55, np.full_like(img, 255), 0.45, 0)
        return img
    return 1.6, f


def s03_toast():
    p = os.path.join(B, 'clips', 'V3.mp4')
    if os.path.exists(p):
        c = Clip(p)
        base = lambda t: c.at(0.2 + 1.6 * t / 1.6)
    else:  # Fallback aus Standbild
        img = still('P3_clean.png')
        base = lambda t: zoom(img, 1.0 + 0.10 * ease(t / 1.6), 0.55, 0.5)

    def f(t):
        fr = base(t)
        wp = (t - 1.35) / 0.25  # Whip-Pan nach rechts in den letzten 0,25 s
        if wp > 0:
            e = ease(wp)
            fr = hblur(shift(fr, -e * 500), 20 + 260 * e)
        return fr
    return 1.6, f


def s04_dinner():
    c = Clip(os.path.join(B, 'clips', 'V4.mp4'))

    def f(t):
        fr = zoom(c.at(0.05 + 1.1 * t), 1.0 + 0.04 * t / 1.2, 0.4, 0.45)
        wp = 1 - t / (5 / FPS)  # 5 Frames: Whip-Pan läuft aus
        if wp > 0:
            fr = hblur(shift(fr, wp * 260), 20 + 240 * wp)
        return fr
    return 1.2, f


def s05_verdaechtige():
    imgs = [still(n) for n in ('P5a.png', 'P5b.png', 'P5c.png')]
    centers = [(0.5, 0.35), (0.45, 0.55), (0.55, 0.6)]

    def f(t):
        i = min(int(t / 0.5), 2)
        lt = t - i * 0.5
        fr = zoom(imgs[i], 1.0 + 0.14 * ease(lt / 0.5) + 0.02, *centers[i])
        if lt < 2 / FPS:  # Hit-Flash
            fr = cv2.addWeighted(fr, 0.4, np.full_like(fr, 255), 0.6, 0)
        return fr
    return 1.5, f


def s06_blackout():
    img = still('P6.png')
    rng = np.random.default_rng(7)
    flick = rng.uniform(0.55, 1.0, 64)

    def f(t):
        if t >= 0.38:
            return np.zeros((H, W, 3), np.uint8)
        k = flick[int(t * FPS)] * (1 - ease(t / 0.38))
        return (zoom(img, 1.03 + 0.05 * t, 0.5, 0.4) * k).astype(np.uint8)
    return 0.9, f


def s07_licht_an():
    c = Clip(os.path.join(B, 'clips', 'V7.mp4'))
    return 2.4, lambda t: zoom(c.at(0.4 + 1.25 * t), 1.0 + 0.04 * t / 2.4, 0.5, 0.45)


def s08_spiel():
    c = Clip(os.path.join(B, 'clips', 'V8.mp4'))
    return 1.8, lambda t: zoom(c.at(0.3 + 1.5 * t), 1.0 + 0.22 * ease(t / 1.8), 0.5, 0.47)


def s09_marke():
    img = still('P9_clean.png')

    def f(t):
        fr = zoom(img, 1.0 + 0.08 * t / 1.7, 0.75, 0.6)
        fade = 1 - ease((t - 0.7) / 0.55)
        return (fr * fade).astype(np.uint8)
    return 1.7, f


SCENES = [s01_hook, s02_nichts_bemerkt, s03_toast, s04_dinner, s05_verdaechtige,
          s06_blackout, s07_licht_an, s08_spiel, s09_marke]


def render(idx, fn, outdir, post=None):
    dur, frame = fn()
    n = int(round(dur * FPS))
    out = os.path.join(outdir, f's{idx + 1:02d}.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                          '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
                          '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for k in range(n):
        img = frame(k / FPS)
        if post:
            img = post(idx, k / FPS, img)
        p.stdin.write(np.ascontiguousarray(img).tobytes())
    p.stdin.close()
    p.wait()
    return out, n


if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(B, 'scenes')
    os.makedirs(outdir, exist_ok=True)
    total = 0
    with open(os.path.join(outdir, 'list.txt'), 'w') as lst:
        for i, s in enumerate(SCENES):
            path, n = render(i, s, outdir)
            total += n
            lst.write(f"file '{os.path.basename(path)}'\n")
            print(f'{os.path.basename(path)}: {n} frames')
    print('total', total, 'frames =', total / FPS, 's')
