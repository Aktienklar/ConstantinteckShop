"""2.5D-Renderer: Kamera, Ebenen, Licht, Schaerfentiefe, Motion Blur, Post."""
import os
from functools import lru_cache

import cv2
import numpy as np

import assets_gen as AG
import layout as L
import timeline as T
from common import (BUILD, Sprite, affine, blit, blit_persp, clamp01, compose, ease_in_out, ease_out_back,
                    ease_out_cubic, smoothstep, text_sprite, to_u8)
from thread import draw_thread, phone_state, thread_state

W, H = T.W, T.H
SC = np.array([W / 2, H / 2])
STAGE = np.array(T.STAGE, np.float32) / 255
CREAM = tuple(T.CREAM)
RED = tuple(T.BLOOD)
FOCAL = 2400.0
OPEN_ANGLE = 108.0

A = {}  # Assets pro Prozess


# =============================================================================
# Assets laden
# =============================================================================
def load_assets():
    if A:
        return A
    AG.build_all()
    c = AG.CACHE
    wall = np.load(os.path.join(c, "wall.npy"))
    lv = [wall]
    while min(lv[-1].shape[:2]) > 400:
        lv.append(cv2.pyrDown(lv[-1]))
    A["wall"] = lv

    def sp(name):
        return Sprite(np.load(os.path.join(c, name + ".npy")))

    def shadow(arr, sigma, op):
        s, pad = AG.drop_shadow(arr, sigma, op)
        return Sprite(s), pad

    for n in ["pin", "stamp", "logo", "phone", "candle", "flame"] + [f"page{i}" for i in range(4)]:
        A[n] = sp(n)
    for n, sg, op in [("logo", 10, 0.7), ("phone", 18, 0.75)] + [(f"page{i}", 9, 0.55) for i in range(4)]:
        A[n + "_sh"] = shadow(np.load(os.path.join(c, n + ".npy")), sg, op)
    for i in range(4):
        back = np.load(os.path.join(c, f"folder{i}_back.npy"))
        A[f"f{i}_back"] = Sprite(back)
        A[f"f{i}_back_sh"] = shadow(back, 11, 0.7)
        A[f"f{i}_flap"] = sp(f"folder{i}_flap")
        A[f"f{i}_flapback"] = sp(f"folder{i}_flapback")
    pin = np.load(os.path.join(c, "pin.npy"))
    A["pin_sh"] = shadow(pin, 3, 0.8)
    return A


@lru_cache(maxsize=128)
def label_sprite(i, n):
    arr = AG.label_strip(i, n)
    s, pad = AG.drop_shadow(arr, 5, 0.6)
    return Sprite(arr), (Sprite(s), pad)


# =============================================================================
# Kamera
# =============================================================================
def _keys():
    ks = [list(k) for k in T.CAMERA_KEYS]
    ks.append([T.DURATION] + list(T.CAMERA_KEYS[0][1:]))
    arr = np.array([[k[0], k[1], k[2], np.log(k[3]), k[4]] for k in ks], np.float64)
    hold = [k[5] for k in ks]
    return arr, hold


KEYS, HOLD = _keys()


def _tangents():
    n = len(KEYS)
    tans = np.zeros((n, 4))
    for i in range(n):
        if HOLD[i] or i == 0 or i == n - 1:
            continue
        tp, tn = KEYS[i - 1], KEYS[i + 1]
        dl = (KEYS[i, 1:] - tp[1:]) / (KEYS[i, 0] - tp[0])
        dr = (tn[1:] - KEYS[i, 1:]) / (tn[0] - KEYS[i, 0])
        m = (tn[1:] - tp[1:]) / (tn[0] - tp[0])
        for j in range(4):
            if dl[j] * dr[j] <= 0:
                m[j] = 0
            else:
                lim = 3 * min(abs(dl[j]), abs(dr[j]))
                m[j] = np.sign(m[j]) * min(abs(m[j]), lim)
        tans[i] = m
    return tans


TANS = _tangents()


def _shake(t):
    dx = dy = dr = 0.0
    for th, s in T.SHAKES:
        if t >= th:
            d = t - th
            a = s * np.exp(-d * 10)
            dx += np.sin(d * 73) * a
            dy += np.cos(d * 61) * a * 0.8
            dr += np.sin(d * 50) * a * 0.03
    return dx, dy, dr


def camera(t):
    tt = t % T.DURATION
    i = int(np.searchsorted(KEYS[:, 0], tt, side="right") - 1)
    i = min(max(i, 0), len(KEYS) - 2)
    k0, k1 = KEYS[i], KEYS[i + 1]
    dt = k1[0] - k0[0]
    s = (tt - k0[0]) / dt
    h00 = 2 * s ** 3 - 3 * s ** 2 + 1
    h10 = s ** 3 - 2 * s ** 2 + s
    h01 = -2 * s ** 3 + 3 * s ** 2
    h11 = s ** 3 - s ** 2
    v = h00 * k0[1:] + h10 * dt * TANS[i] + h01 * k1[1:] + h11 * dt * TANS[i + 1]
    cx, cy, lz, rot = v
    z = np.exp(lz)
    w = 2 * np.pi / T.DURATION
    z *= 1 + 0.010 * np.sin(w * 3 * tt + 0.5)
    rot += 0.25 * np.sin(w * 2 * tt + 0.7)
    sx, sy, sr = _shake(tt)
    dx = 7 * np.sin(w * 2 * tt + 0.4) + 4 * np.sin(w * 5 * tt + 1.3) + sx
    dy = 6 * np.sin(w * 3 * tt + 2.1) + 3 * np.sin(w * 7 * tt) + sy
    return cx, cy, z, np.deg2rad(rot + sr), dx, dy


def cam_matrix(t):
    cx, cy, z, r, dx, dy = camera(t)
    c, s = np.cos(r), np.sin(r)
    Am = np.array([[c * z, -s * z], [s * z, c * z]])
    tr = SC + np.array([dx, dy]) - Am @ np.array([cx, cy])
    return np.hstack([Am, tr[:, None]]), z


def to_screen(M, pts):
    pts = np.asarray(pts, np.float64)
    return pts @ M[:, :2].T + M[:, 2]


# =============================================================================
# Licht
# =============================================================================
def _periodic_noise(t, seeds):
    w = 2 * np.pi / T.DURATION
    return sum(np.sin(w * k * t + p) / len(seeds) for k, p in seeds)


def flame_level(t):
    """0..1: Kerzenflamme an/aus (Auspusten / Streichholz)."""
    if t < T.CANDLE_OUT:
        return 1.0
    if t < T.BLACK_START:
        return 1 - ease_in_out((t - T.CANDLE_OUT) / (T.BLACK_START - T.CANDLE_OUT))
    if t < T.RELIGHT + 0.12:
        return 0.0
    return ease_out_cubic((t - T.RELIGHT - 0.12) / 0.35)


def light_global(t):
    if t < T.CANDLE_OUT:
        g = 1.0
    elif t < T.BLACK_START:
        g = 1 - ease_in_out((t - T.CANDLE_OUT) / (T.BLACK_START - T.CANDLE_OUT))
    elif t < T.RELIGHT:
        g = 0.0
    else:
        u = (t - T.RELIGHT) / T.RELIGHT_DUR
        match = 0.45 * np.exp(-max(0, t - T.RELIGHT) * 5) * (1 + 0.3 * np.sin(t * 90))
        g = min(1.0, 0.25 + 0.75 * ease_in_out(u) + match)
    return g


def flicker(t):
    breathe = 0.05 * np.sin(2 * np.pi / T.DURATION * 4 * t)   # Atmen (~0.27 Hz)
    fl = 0.05 * _periodic_noise(t, [(37, 0.3), (53, 1.7), (71, 2.9), (97, 0.8), (131, 4.1)])
    return 1.0 + breathe + fl


def _pulse(t, th, amp, k=7.0):
    return amp * np.exp(-(t - th) * k) if t >= th else 0.0


_LY, _LX = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32) * 4


def light_map(t):
    g = light_global(t)
    fl = flicker(t)
    cxp, cyp = L.CANDLE_SCREEN[0], L.CANDLE_SCREEN[1] - 190
    d2 = ((_LX - cxp) ** 2 + (_LY - cyp) ** 2) / (1050.0 ** 2)
    candle = np.exp(-d2)[..., None] * np.array([1.0, 0.60, 0.30], np.float32) * 0.85
    neutral = smoothstep(11.75, 12.0, t)  # Logo: Licht wird cremeweiss
    kcol = np.array([1.0, 0.85, 0.68], np.float32) * (1 - neutral) + np.array([1.0, 0.95, 0.88], np.float32) * neutral
    key = np.exp(-(((_LX - 560) / 760) ** 2 + ((_LY - 900) / 980) ** 2))[..., None] * kcol * 0.62
    k_amp = 1.0
    for _, th in T.NUMBERS:
        k_amp += _pulse(t, th, 0.22)
    k_amp += _pulse(t, T.STAMP_HIT, 0.35) + _pulse(t, T.LOGO_HIT, 0.5, 5) + _pulse(t, T.PIN_HIT, 0.25)
    dim = 1 - 0.65 * (smoothstep(T.S3_DIM[0], T.S3_DIM[0] + 0.25, t) *
                      (1 - smoothstep(T.S3_DIM[1] - 0.2, T.S3_DIM[1], t)))
    amb = np.array([0.10, 0.085, 0.075], np.float32)
    lm = (amb + candle * fl * flame_level(t) + key * fl * k_amp * dim) * g
    if T.RELIGHT <= t < T.RELIGHT + 0.6:  # Streichholz-Licht
        mt = np.exp(-max(0, t - T.RELIGHT) * 4)
        lm += np.exp(-d2 * 1.6)[..., None] * np.array([1.0, 0.55, 0.2], np.float32) * mt * 0.8
    return cv2.resize(lm.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)


# =============================================================================
# Objekte
# =============================================================================
def folder_angle(i, t):
    t0 = T.CASES[i][4]
    p = (t - t0) / T.FOLDER_OPEN_DUR
    if p <= 0:
        return 0.0
    return OPEN_ANGLE * ease_out_back(p, 1.3)


def folder_world(i):
    cx, cy, rot = L.FOLDERS[i]
    return affine(cx, cy, 1.0, np.deg2rad(rot), ox=L.FOLDER_W / 2, oy=L.FOLDER_TAB_H + L.FOLDER_H / 2)


def draw_folder(canvas, M, z, i, t):
    a = load_assets()
    Wf = compose(M, folder_world(i))
    sh, pad = a[f"f{i}_back_sh"]
    blit(canvas, sh, compose(Wf, affine(9 - pad, 14 - pad)))
    blit(canvas, a[f"f{i}_back"], Wf)
    # Etikett (auf dem Innenblatt, getippt)
    cx, cy, rot = L.FOLDERS[i]
    n = label_chars(i, t)
    if n > 0 or folder_angle(i, t) > 0:
        spr, (ssh, spad) = label_sprite(i, n)
        lx, ly = L.rot_pt(0, L.LABEL_CENTER_Y, cx, cy, np.deg2rad(rot))
        lrot = np.deg2rad(rot + (1.5 if i % 2 == 0 else -1.2))
        Ml = compose(M, affine(lx, ly, 1.0, lrot, ox=spr.w / 2, oy=spr.h / 2))
        blit(canvas, ssh, compose(Ml, affine(2 - spad, 4 - spad)), alpha=0.6)
        blit(canvas, spr, Ml)
    # Stempel (vor dem Deckel, liegt auf dem Innenblatt)
    if i == T.STAMP_CASE and t >= T.STAMP_HIT - 0.07:
        p = clamp01((t - (T.STAMP_HIT - 0.07)) / 0.07)
        sc = 0.90 * (1 + 0.55 * (1 - p) ** 2)
        if t > T.STAMP_HIT:
            d = t - T.STAMP_HIT
            sc *= 1 - 0.04 * np.exp(-d * 18) * np.cos(d * 60)
        sx, sy = L.rot_pt(L.STAMP_OFFSET[0], L.STAMP_OFFSET[1], cx, cy, np.deg2rad(rot))
        st = a["stamp"]
        Ms = compose(M, affine(sx, sy, sc, np.deg2rad(L.STAMP_ROT + rot), ox=st.w / 2, oy=st.h / 2))
        blit(canvas, st, Ms, alpha=0.25 + 0.75 * p, blur=(1 - p) * 4)
    # Deckel
    th = folder_angle(i, t)
    if th < 0.5:
        blit(canvas, a[f"f{i}_flap"], compose(Wf, affine(0, L.FOLDER_TAB_H, ox=0, oy=0)))
        return
    rad = np.deg2rad(th)
    Wd, Hd = L.FOLDER_W, L.FOLDER_H
    xs = np.array([0, Wd, 0, Wd], np.float64)
    ys = np.array([0, 0, Hd, Hd], np.float64)
    X = -Wd / 2 + xs * np.cos(rad)
    Y = -Hd / 2 + ys
    Z = xs * np.sin(rad)
    world = np.array([L.rot_pt(x, y, cx, cy, np.deg2rad(rot)) for x, y in zip(X, Y)])
    q = to_screen(M, world)
    s = FOCAL / (FOCAL - Z * 0.8)
    qp = SC + (q - SC) * s[:, None]
    # Schatten des Deckels auf das Innenblatt
    shw = world + np.stack([Z * 0.30, Z * 0.42], 1)
    qs = to_screen(M, shw)
    src = np.array([[0, 0], [Wd, 0], [0, Hd], [Wd, Hd]], np.float32)
    Hs = cv2.getPerspectiveTransform(src, qs.astype(np.float32))
    blit_persp(canvas, a[f"f{i}_flap"], Hs, alpha=0.5 * min(1, np.sin(rad) * 1.5), blur=10 * z, tint=(0, 0, 0))
    if th <= 90:
        Hm = cv2.getPerspectiveTransform(src, qp.astype(np.float32))
        shade = 1 - 0.30 * np.sin(rad)
        blit_persp(canvas, a[f"f{i}_flap"], Hm, blur=abs(np.sin(rad)) * 1.5, tint=(shade,) * 3)
    else:
        srcb = np.array([[Wd, 0], [0, 0], [Wd, Hd], [0, Hd]], np.float32)
        Hm = cv2.getPerspectiveTransform(srcb, qp.astype(np.float32))
        shade = 0.62 + 0.25 * (-np.cos(rad))
        blit_persp(canvas, a[f"f{i}_flapback"], Hm, blur=1.2, tint=(shade,) * 3)


def label_chars(i, t):
    t0 = T.CASES[i][4] + T.LABEL_DELAY
    if t < t0:
        return 0
    return int(min(AG.label_total_chars(i), np.floor((t - t0) / T.LABEL_CHAR) + 1))


def draw_pin(canvas, M, z, pos, scale=1.0, height=0.0):
    a = load_assets()
    p = to_screen(M, [pos])[0]
    s = z * scale
    sh, pad = a["pin_sh"]
    off = (4 + 30 * height) * z
    blit(canvas, sh, affine(p[0] + off, p[1] + off * 1.5, s, 0, ox=24 + pad, oy=24 + pad), alpha=1 - 0.5 * height,
         blur=height * 8)
    blit(canvas, a["pin"], affine(p[0], p[1], s, 0, ox=24, oy=24), blur=height * 2.5)


def draw_logo(canvas, M, z, t):
    a = load_assets()
    lg = a["logo"]
    Mw = compose(M, affine(L.LOGO_CENTER[0], L.LOGO_CENTER[1], 1.0, np.deg2rad(-0.8), ox=lg.w / 2, oy=lg.h / 2))
    sh, pad = a["logo_sh"]
    blit(canvas, sh, compose(Mw, affine(8 - pad, 14 - pad)))
    blit(canvas, lg, Mw)


def draw_phone(canvas, M, z, t):
    ps = phone_state(t)
    if ps is None:
        return
    a = load_assets()
    x, y, r = ps
    ph = a["phone"]
    Mp = compose(M, affine(x, y, 1.0, r, ox=ph.w / 2, oy=ph.h / 2))
    sh, pad = a["phone_sh"]
    blit(canvas, sh, compose(Mp, affine(26 - pad, 40 - pad)))
    blit(canvas, ph, Mp)


def draw_pages(canvas, M, z, t):
    ps = phone_state(t)
    if ps is None:
        return
    a = load_assets()
    px, py, pr = ps
    for i, (_, tp) in enumerate(T.PAGES):
        p = (t - tp) / T.PAGE_FAN_DUR
        if p <= 0:
            continue
        u = ease_out_cubic(p)
        tx, ty, trot = L.PAGES_POS[i]
        x = px + (tx - px) * u
        y = py - 60 + (ty - py + 60) * u
        rot = pr + (np.deg2rad(trot) - pr) * u
        sc = 0.35 + 0.65 * ease_out_back(p, 1.4)
        lift = 1 - u
        spr = a[f"page{i}"]
        Mp = compose(M, affine(x, y, sc * (1 + 0.15 * lift), rot, ox=spr.w / 2, oy=spr.h / 2))
        sh, pad = a[f"page{i}_sh"]
        o = 8 + 40 * lift
        blit(canvas, sh, compose(Mp, affine(o - pad, o * 1.4 - pad)), alpha=1 - 0.4 * lift, blur=lift * 8)
        blit(canvas, spr, Mp, alpha=clamp01(p * 5), blur=lift * 2.0)


def draw_dust_hit(canvas, M, z, t):
    if t < T.PIN_HIT or t > T.PIN_HIT + 1.2:
        return
    rng = np.random.default_rng(3)
    n = 70
    ang = rng.uniform(-np.pi, np.pi, n)
    sp = rng.uniform(120, 620, n)
    vx, vy = np.cos(ang) * sp, np.sin(ang) * sp - 180
    size = rng.uniform(1.5, 4.5, n)
    life = rng.uniform(0.5, 1.1, n)
    d = t - T.PIN_HIT
    drag = (1 - np.exp(-3 * d)) / 3
    x = L.P_HOOK[0] + vx * drag
    y = L.P_HOOK[1] + vy * drag + 300 * d * d
    q = to_screen(M, np.stack([x, y], 1))
    alpha = np.clip(1 - d / life, 0, 1)
    layer = np.zeros((H, W), np.float32)
    for (sx, sy), s, al in zip(q, size, alpha):
        if al > 0 and 0 <= sx < W and 0 <= sy < H:
            cv2.circle(layer, (int(sx * 16), int(sy * 16)), max(1, int(s * z * 16)), float(al), -1, cv2.LINE_AA,
                       shift=4)
    layer = cv2.GaussianBlur(layer, (0, 0), 1.2)
    canvas += layer[..., None] * np.array([0.75, 0.62, 0.45], np.float32) * 0.9


def draw_motes(canvas, t, lm):
    rng = np.random.default_rng(5)
    n = 55
    x0 = rng.uniform(0, W, n)
    y0 = rng.uniform(0, H, n)
    k = rng.integers(1, 3, n)
    depth = rng.uniform(0, 1, n)
    w = 2 * np.pi / T.DURATION
    y = (y0 - k * H * t / T.DURATION) % H
    x = x0 + 40 * np.sin(w * k * 2 * t + x0)
    layer = np.zeros((H // 2, W // 2), np.float32)
    for xi, yi, dp in zip(x, y, depth):
        r = 1.0 + dp * 3.5
        cv2.circle(layer, (int(xi / 2 * 16), int(yi / 2 * 16)), int(r * 16), 0.25 + 0.5 * (1 - dp), -1,
                   cv2.LINE_AA, shift=4)
    layer = cv2.GaussianBlur(layer, (0, 0), 2.0)
    layer = cv2.resize(layer, (W, H))
    canvas += layer[..., None] * lm * 0.55


def draw_candle(canvas, t):
    a = load_assets()
    cx, cy = L.CANDLE_SCREEN
    cd = a["candle"]
    top = cy - 115
    lit = 0.12 + 0.88 * max(flame_level(t), 0.35 * light_global(t))
    blit(canvas, cd, affine(cx, top, 1.0, 0.0, ox=cd.w / 2, oy=0), blur=7,
         tint=(0.80 * lit, 0.55 * lit, 0.33 * lit))
    lvl = flame_level(t)
    if lvl > 0.01:
        fl = a["flame"]
        f = flicker(t)
        sway = 0.06 * np.sin(t * 11.0) + 0.04 * np.sin(t * 17.0)
        sy = (0.85 + 0.25 * (f - 1) * 4) * lvl
        sx = (0.95 + 0.1 * np.sin(t * 23)) * (0.4 + 0.6 * lvl)
        Mf = affine(cx + 2, top + 6, 1.0, sway, ox=fl.w / 2, oy=fl.h, sx=sx * 1.1, sy=sy * 1.1)
        blit(canvas, fl, Mf, blur=2.5, mode="add")
        blit(canvas, fl, Mf, blur=22, mode="add", alpha=0.9)
    if T.RELIGHT <= t < T.RELIGHT + 0.5:  # Streichholz-Flamme
        fl = a["flame"]
        m = np.exp(-(t - T.RELIGHT) * 5)
        Mf = affine(cx + 60, top - 40, 1.0, 0.3, ox=fl.w / 2, oy=fl.h, sx=0.8 * m + 0.2, sy=0.9 * m + 0.2)
        blit(canvas, fl, Mf, blur=4, mode="add", alpha=m)
        blit(canvas, fl, Mf, blur=30, mode="add", alpha=m)
    # Rauchfaden nach dem Auspusten
    if T.CANDLE_OUT <= t < T.CANDLE_OUT + 1.6:
        d = t - T.CANDLE_OUT
        layer = np.zeros((H // 2, W // 2), np.float32)
        for k in range(40):
            s = k / 39
            age = d - s * 0.9
            if age < 0:
                continue
            yy = top - 10 - s * 520 - age * 60
            xx = cx + 18 * np.sin(s * 9 + d * 3) * s + 30 * s * s
            al = 0.10 * (1 - s) * np.exp(-age * 1.4)
            cv2.circle(layer, (int(xx / 2), int(yy / 2)), int(3 + 12 * s), float(al), -1, cv2.LINE_AA)
        layer = cv2.GaussianBlur(layer, (0, 0), 4)
        layer = cv2.resize(layer, (W, H))
        canvas += layer[..., None] * np.array([0.7, 0.68, 0.66], np.float32) * max(light_global(t), 0.0)


# =============================================================================
# HUD-Text
# =============================================================================
def _hud():
    C, R = CREAM, RED
    items = [
        dict(runs=(("Einer von euch", C),), size=120, y=330, t_in=T.HOOK_TEXT_IN, t_out=T.HOOK_TEXT_OUT),
        dict(runs=(("lügt.", R),), size=150, y=480, t_in=T.HOOK_TEXT_IN + 0.08, t_out=T.HOOK_TEXT_OUT),
        dict(runs=(("9 ", R), ("Fälle.", C)), size=150, y=330, t_in=T.NINE_CASES_IN, t_out=T.NINE_CASES_OUT),
        dict(runs=((T.NUMBERS[0][0], C),), size=130, y=720, t_in=T.NUMBERS[0][1], t_out=T.NUMBERS_OUT),
        dict(runs=((T.NUMBERS[1][0], C),), size=130, y=880, t_in=T.NUMBERS[1][1], t_out=T.NUMBERS_OUT),
        dict(runs=(("1 ", C), ("Täter.", R)), size=130, y=1040, t_in=T.NUMBERS[2][1], t_out=T.NUMBERS_OUT),
        dict(runs=(("Wer ", C), ("war's?", R)), size=150, y=1290, t_in=T.WHO_TEXT_IN, t_out=T.WHO_TEXT_OUT),
        dict(runs=((T.PLAY_WORDS[0][0], C),), size=110, y=300, t_in=T.PLAY_WORDS[0][1], t_out=T.PLAY_TEXT_OUT),
        dict(runs=((T.PLAY_WORDS[1][0], C),), size=110, y=420, t_in=T.PLAY_WORDS[1][1], t_out=T.PLAY_TEXT_OUT),
        dict(runs=((T.PLAY_WORDS[2][0], R),), size=110, y=540, t_in=T.PLAY_WORDS[2][1], t_out=T.PLAY_TEXT_OUT),
        dict(runs=((T.PRICE_TEXT, C),), size=56, font="elite", y=1010, t_in=T.PRICE_IN, t_out=T.ENDCARD_FADE_OUT,
             style="fade"),
        dict(runs=((T.ENDCARD_TEXT, C),), size=54, font="elite", y=1120, t_in=T.ENDCARD_IN,
             t_out=T.ENDCARD_FADE_OUT, style="fade"),
    ]
    for it in items:
        it.setdefault("font", "playfair")
        it.setdefault("style", "slam")
    return items


HUD = _hud()
TEXT_CX = (T.TEXT_LEFT + T.TEXT_MAX_X) / 2


def hud_box(it, scale=1.0):
    spr, pad, tw, th = text_sprite(it["runs"], it["size"], it["font"])
    return (TEXT_CX - tw * scale / 2, it["y"] - th * scale / 2, TEXT_CX + tw * scale / 2, it["y"] + th * scale / 2)


def check_hud_safe():
    bad = []
    for it in HUD:
        x0, y0, x1, y1 = hud_box(it)
        if x0 < T.TEXT_LEFT - 1 or x1 > T.TEXT_MAX_X or y0 < T.SAFE_TOP or y1 > T.TEXT_MAX_Y:
            bad.append((it["runs"], (int(x0), int(y0), int(x1), int(y1))))
    return bad


def hud_state(it, t):
    if t < it["t_in"] - 0.001 or t > it["t_out"] + 0.25:
        return None
    p = (t - it["t_in"]) / (0.14 if it["style"] == "slam" else 0.35)
    alpha = clamp01(p * 3) if it["style"] == "slam" else ease_in_out(p)
    spr, pad, tw, th = text_sprite(it["runs"], it["size"], it["font"])
    if it["style"] == "slam":
        s0 = min(1.3, (T.TEXT_MAX_X - T.TEXT_LEFT) / tw)
        scale = 1 + (s0 - 1) * (1 - ease_out_cubic(p))
        dy = -40 * (1 - ease_out_cubic(p))
    else:
        scale, dy = 1.0, 14 * (1 - ease_out_cubic(p))
    q = (t - it["t_out"]) / 0.22
    if q > 0:
        alpha *= 1 - ease_in_out(q)
        dy -= 24 * ease_in_out(q)
    return spr, pad, tw, th, scale, dy, alpha


@lru_cache(maxsize=1)
def scrim_sprite():
    s = np.zeros((200, 400, 4), np.float32)
    yy, xx = np.mgrid[0:200, 0:400].astype(np.float32)
    d = np.sqrt(((xx - 200) / 200) ** 2 + ((yy - 100) / 100) ** 2)
    s[..., 3] = np.clip(1 - d, 0, 1) ** 1.2
    return Sprite(s)


def draw_hud(canvas, t):
    for it in HUD:
        st = hud_state(it, t)
        if st is None:
            continue
        spr, pad, tw, th, scale, dy, alpha = st
        sc = scrim_sprite()
        Ms = affine(TEXT_CX, it["y"] + dy, 1.0, 0, ox=sc.w / 2, oy=sc.h / 2, sx=(tw + it["size"] * 1.2) / sc.w,
                    sy=(th + it["size"] * 0.5) / sc.h)
        blit(canvas, sc, Ms, alpha=alpha * 0.65)
        M = affine(TEXT_CX, it["y"] + dy, scale, 0, ox=pad + tw / 2, oy=pad + th / 2)
        blit(canvas, spr, M, alpha=alpha)


# =============================================================================
# Szene
# =============================================================================
def render_scene(t, warnings=None):
    a = load_assets()
    M, z = cam_matrix(t)
    # Wand (uint8-Mipmap)
    lvl = 0
    while lvl + 1 < len(a["wall"]) and z * (2 ** lvl) < 0.55:
        lvl += 1
    Mw = M.copy()
    Mw[:, 2] += M[:, :2] @ np.array([0.0, L.WALL_ORIGIN_Y])
    Mw[:, :2] *= 2 ** lvl
    bg = tuple(float(c) * 255 for c in STAGE)
    wall = cv2.warpAffine(a["wall"][lvl], Mw, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT,
                          borderValue=bg)
    canvas = wall.astype(np.float32) / 255.0
    if z > 0.6:
        canvas = cv2.GaussianBlur(canvas, (0, 0), 1.2)  # Schaerfentiefe: Kork leicht hinter der Fokusebene
    draw_logo(canvas, M, z, t)
    for i in range(4):
        draw_folder(canvas, M, z, i, t)
    draw_phone(canvas, M, z, t)
    # Faden
    poly, head, moving, pin, pin_scale = thread_state(t)
    ps = to_screen(M, poly)
    glow = 0.0
    if moving:
        h2 = to_screen(M, [thread_state(t - 1 / T.FPS)[1]])[0]
        speed = np.linalg.norm(ps[-1] - h2)
        glow = clamp01(speed / 25.0)
    draw_thread(canvas, ps, z, head_glow=glow)
    for i in range(4):
        draw_pin(canvas, M, z, L.folder_pin(i))
    draw_pin(canvas, M, z, L.LOGO_PIN_L)
    draw_pin(canvas, M, z, L.LOGO_PIN_R)
    draw_pin(canvas, M, z, pin, pin_scale, height=pin_scale - 1)
    draw_pages(canvas, M, z, t)
    draw_dust_hit(canvas, M, z, t)
    # Licht
    lm = light_map(t)
    canvas *= lm
    draw_motes(canvas, t, lm)
    draw_candle(canvas, t)
    # Bloom
    small = cv2.resize(canvas, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    b = np.clip(small - 0.62, 0, None)
    b = cv2.GaussianBlur(b, (0, 0), 7)
    canvas += cv2.resize(b, (W, H)) * 0.45
    if light_global(t) > 0.02:
        draw_hud(canvas, t)
    if warnings is not None:
        warnings.extend(check_world_text(M, t))
    return canvas


def check_world_text(M, t):
    """Etiketten auf der Wand: Text darf nicht in die UI-Zonen ragen, solange er sichtbar ist."""
    out = []
    for i in range(4):
        n = label_chars(i, t)
        if n == 0:
            continue
        spr, _ = label_sprite(i, n)
        cx, cy, rot = L.FOLDERS[i]
        lx, ly = L.rot_pt(0, L.LABEL_CENTER_Y, cx, cy, np.deg2rad(rot))
        q = to_screen(M, [(lx - spr.w / 2 + 12, ly - spr.h / 2 + 8), (lx + spr.w / 2 - 12, ly + spr.h / 2 - 8)])
        x0, y0 = q.min(0)
        x1, y1 = q.max(0)
        on = x1 > 0 and x0 < W and y1 > 0 and y0 < H
        if on and (x0 < 0 or x1 > T.TEXT_MAX_X or y0 < T.SAFE_TOP or y1 > T.TEXT_MAX_Y):
            out.append((round(t, 3), f"Etikett {i + 1}", (int(x0), int(y0), int(x1), int(y1))))
    return out


# =============================================================================
# Frame
# =============================================================================
def motion_score(t):
    d = 1 / T.FPS
    M0, z0 = cam_matrix(t)
    M1, z1 = cam_matrix(t + d)
    probe = np.array([[200, 300], [880, 300], [540, 960], [200, 1600], [880, 1600]], np.float64)
    inv0 = cv2.invertAffineTransform(M0)
    wp = to_screen(inv0, probe)
    cam = np.abs(to_screen(M1, wp) - probe).max()
    h0 = to_screen(M0, [thread_state(t)[1]])[0]
    h1 = to_screen(M1, [thread_state(t + d)[1]])[0]
    head = np.linalg.norm(h1 - h0)
    score = max(cam, head)
    for it in HUD:
        if it["style"] == "slam" and it["t_in"] - d <= t <= it["t_in"] + 0.16:
            score = max(score, 12)
    for _, tp in T.PAGES:
        if tp <= t <= tp + T.PAGE_FAN_DUR:
            score = max(score, 12)
    for c in T.CASES:
        if c[4] <= t <= c[4] + T.FOLDER_OPEN_DUR:
            score = max(score, 12)
    if T.STAMP_HIT - 0.1 <= t <= T.STAMP_HIT + 0.05 or T.PHONE_IN <= t <= T.PHONE_IN + T.PHONE_IN_DUR:
        score = max(score, 12)
    return score


_VY, _VX = np.mgrid[0:H, 0:W].astype(np.float32)
VIGNETTE = np.clip(1 - 0.62 * ((((_VX - W / 2) / (W / 2)) ** 2 * 0.8 + ((_VY - H * 0.47) / (H / 2)) ** 2)
                               / 1.6) ** 1.25, 0, 1)[..., None].astype(np.float32)
del _VY, _VX


def render_frame(i, warnings=None):
    t = i / T.FPS
    if T.f(T.BLACK_START) <= i < T.f(T.BLACK_START) + T.BLACK_FRAMES:
        img = np.zeros((H, W, 3), np.float32) + STAGE * 0.6
    else:
        n = T.MOTION_SAMPLES if motion_score(t) > 5 else 1
        if n == 1:
            img = render_scene(t, warnings)
        else:
            img = np.zeros((H, W, 3), np.float32)
            for k in range(n):
                ts = t + ((k + 0.5) / n - 0.5) * 0.5 / T.FPS
                img += render_scene(ts, warnings if k == n // 2 else None)
            img /= n
    img *= VIGNETTE
    img = np.maximum(img, STAGE * 0.55)
    rng = np.random.default_rng(1000 + i)
    g = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
    img += g[..., None] * 0.022 * (0.6 + 0.4 * (1 - img))
    return to_u8(img)
