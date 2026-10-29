"""Einstieg: python3 make.py styleframes | frames | preview | final | check"""
import os
import sys
import time
from multiprocessing import Pool

import cv2

import timeline as T
from common import BUILD, OUT

PREVIEW_NAME = os.environ.get("PREVIEW_NAME", "preview_v1.mp4")
STYLEFRAMES = [("S1", 0.42), ("S2", 2.62), ("S3", 6.05), ("S4", 7.95), ("S5", 11.30), ("S6", 12.70)]


def _save(path, rgb):
    cv2.imwrite(path, cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_PNG_COMPRESSION, 1])


def _job(i):
    import render
    p = os.path.join(BUILD, "frames", f"f_{i:04d}.png")
    w = []
    _save(p, render.render_frame(i, w))
    return i, w


def styleframes():
    import render
    os.makedirs(os.path.join(OUT, "styleframes"), exist_ok=True)
    print("HUD safe-zone:", render.check_hud_safe() or "ok")
    for name, t in STYLEFRAMES:
        t0 = time.time()
        w = []
        img = render.render_frame(T.f(t), w)
        _save(os.path.join(OUT, "styleframes", f"{name}_{t:05.2f}s.png"), img)
        print(name, t, f"{time.time() - t0:.2f}s", w or "")


def frames(start=0, end=T.N_FRAMES):
    os.makedirs(os.path.join(BUILD, "frames"), exist_ok=True)
    t0 = time.time()
    warns = []
    with Pool(os.cpu_count()) as pool:
        for k, (i, w) in enumerate(pool.imap_unordered(_job, range(start, end), chunksize=4)):
            warns += w
            if k % 60 == 0:
                print(f"{k}/{end - start}  {time.time() - t0:.0f}s", flush=True)
    print(f"frames done in {time.time() - t0:.0f}s")
    return warns


def _ffmpeg(args):
    import subprocess
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + args
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)


def preview():
    fr = os.path.join(BUILD, "frames", "f_%04d.png")
    _ffmpeg(["-framerate", str(T.FPS), "-i", fr, "-i", os.path.join(BUILD, "audio", "mix.wav"),
             "-vf", f"fps={T.PREVIEW_FPS},scale={T.PREVIEW_W}:{T.PREVIEW_H}:flags=lanczos",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-ar", "48000", "-b:a", "256k", "-movflags", "+faststart", "-shortest",
             os.path.join(OUT, PREVIEW_NAME)])


def final(name="murdernight_reel_v1"):
    fr = os.path.join(BUILD, "frames", "f_%04d.png")
    for suffix, wav in (("", "mix.wav"), ("_ohne_musik", "mix_ohne_musik.wav")):
        _ffmpeg(["-framerate", str(T.FPS), "-i", fr, "-i", os.path.join(BUILD, "audio", wav),
                 "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
                 "-c:a", "aac", "-ar", "48000", "-b:a", "256k", "-movflags", "+faststart", "-shortest",
                 os.path.join(OUT, f"{name}{suffix}.mp4")])


def contact_sheet():
    from PIL import Image, ImageDraw
    from common import font
    times = [k * 0.5 for k in range(int(T.DURATION / 0.5))]
    tw, th = 216, 384
    cols = 6
    rows = (len(times) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (tw + 12) + 12, rows * (th + 56) + 12), (18, 16, 15))
    d = ImageDraw.Draw(sheet)
    for k, t in enumerate(times):
        i = T.f(t)
        im = Image.open(os.path.join(BUILD, "frames", f"f_{i:04d}.png")).resize((tw, th), Image.LANCZOS)
        x, y = 12 + (k % cols) * (tw + 12), 12 + (k // cols) * (th + 56)
        sheet.paste(im, (x, y))
        scene = [s for s in T.SCENES if s[2] <= t < s[3]][0][0]
        d.text((x, y + th + 8), f"{t:05.2f}s  F{i:03d}  {scene}", font=font("inter", 22), fill=(235, 225, 210))
    sheet.save(os.path.join(OUT, "contact_sheet.png"))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "styleframes"
    if cmd == "styleframes":
        styleframes()
    elif cmd == "frames":
        w = frames()
        print("Safe-Zone-Warnungen:", len(w))
        for x in w[:40]:
            print(" ", x)
    elif cmd == "preview":
        preview()
        contact_sheet()
    elif cmd == "contact":
        contact_sheet()
    elif cmd == "final":
        final()
