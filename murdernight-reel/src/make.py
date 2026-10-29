"""Einstieg: python3 make.py styleframes | frames | preview | final | check"""
import os
import sys
import time
from multiprocessing import Pool

import cv2

import timeline as T
from common import BUILD, OUT

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


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "styleframes"
    if cmd == "styleframes":
        styleframes()
    elif cmd == "frames":
        w = frames()
        print("Safe-Zone-Warnungen:", len(w))
        for x in w[:40]:
            print(" ", x)
