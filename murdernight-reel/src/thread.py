"""Der rote Faden: Zustand ueber die Zeit + die EINE Zeichenfunktion draw_thread()."""
import cv2
import numpy as np

import layout as L
import timeline as T
from common import ease_in_out, ease_out_cubic

RED = np.array(T.BLOOD, np.float32) / 255
REST_SAG = 0.045          # Durchhang relativ zur Spannweite
TAUT_SAG = 0.006
THICK = 7.0               # Weltpixel


# =============================================================================
# Zustand
# =============================================================================
def phone_state(t):
    """Position/Drehung des Handys (Welt) oder None, wenn nicht im Bild."""
    if t < T.PHONE_IN:
        return None
    u = ease_out_cubic((t - T.PHONE_IN) / T.PHONE_IN_DUR)
    x = L.PHONE_FROM[0] + (L.PHONE_POS[0] - L.PHONE_FROM[0]) * u
    y = L.PHONE_FROM[1] + (L.PHONE_POS[1] - L.PHONE_FROM[1]) * u
    rot = L.PHONE_ROT_FROM + (L.PHONE_ROT - L.PHONE_ROT_FROM) * u
    return x, y, np.deg2rad(rot)


def node_pos(name, t):
    if name == "anchor":
        return np.array(L.THREAD_ANCHOR)
    if name == "hook":
        return np.array(L.P_HOOK)
    if name.startswith("folder"):
        return np.array(L.folder_pin(int(name[-1])))
    if name == "phone":
        ps = phone_state(max(t, T.PHONE_IN))
        x, y, r = ps
        return np.array(L.rot_pt(0, -L.PHONE_H / 2 + 34, x, y, r))
    if name == "logo_l":
        return np.array(L.LOGO_PIN_L)
    if name == "logo_r":
        return np.array(L.LOGO_PIN_R)
    raise ValueError(name)


def _bezier(p0, c, p1, u):
    return (1 - u) ** 2 * p0 + 2 * (1 - u) * u * c + u * u * p1


def _travel_path(k, t):
    """Kopfposition fuer Reise k zur Zeit t."""
    name, t0, t1 = T.THREAD_TRAVEL[k]
    raw = (t - t0) / (t1 - t0)
    if k == 0:
        u = ease_out_cubic(raw)
        return _bezier(np.array(L.WHIP_START), np.array(L.WHIP_CTRL), np.array(L.P_HOOK), u)
    prev = T.THREAD_TRAVEL[k - 1][0]
    p0, p1 = node_pos(prev, t), node_pos(name, t)
    if name == "logo_r":
        u = min(max(raw, 0), 1)
        u = u * u * (3 - 2 * u) * 0.5 + u * 0.5
    else:
        u = ease_in_out(raw)
    d = p1 - p0
    n = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-6)
    bulge = (0.16 if k % 2 else -0.16) * np.linalg.norm(d)
    if name == "logo_l":
        bulge = 0.06 * np.linalg.norm(d)
    c = (p0 + p1) / 2 + n * bulge
    return _bezier(p0, c, p1, u)


def _base_state(t):
    """Knotenliste (Weltpunkte), Sag-Faktoren je Segment, Kopf-Info."""
    nodes = [node_pos("anchor", t)]
    sags = []
    head_moving = False
    # aktuelle Reise
    k = 0
    for i, (_, t0, _) in enumerate(T.THREAD_TRAVEL):
        if t >= t0:
            k = i
    name, t0, t1 = T.THREAD_TRAVEL[k]
    for i in range(k):
        nodes.append(node_pos(T.THREAD_TRAVEL[i][0], t))
    if t < t1:
        head = _travel_path(k, max(t, t0))
        nodes.append(head)
        head_moving = t >= t0 - 1e-9
    else:
        nodes.append(node_pos(name, t))
    # Durchhang: letzte Strecke straff waehrend der Reise, danach Nachschwingen
    for i in range(len(nodes) - 1):
        seg_target = i  # Reise i endet an Knoten i+1
        _, a0, a1 = T.THREAD_TRAVEL[min(seg_target, len(T.THREAD_TRAVEL) - 1)]
        if t < a1:
            sag = TAUT_SAG
        else:
            dt = t - a1
            sag = REST_SAG - (REST_SAG - TAUT_SAG) * np.exp(-5 * dt) * np.cos(14 * dt)
        sags.append(sag)
    if not head_moving and t < T.THREAD_TRAVEL[0][1]:
        head_moving = False
    return nodes, sags, head_moving


def _whip_wave(t):
    a, b = T.THREAD_WHIP_SPAN
    if t < a or t > b:
        return 0.0
    return 80.0 * np.exp(-((t - 0.0) / 0.22) ** 2)


def _densify(nodes, sags, t, wave_amp):
    pts = []
    for i in range(len(nodes) - 1):
        p0, p1 = nodes[i], nodes[i + 1]
        d = p1 - p0
        ln = np.linalg.norm(d) + 1e-6
        n_seg = max(8, int(ln / 14))
        s = np.linspace(0, 1, n_seg, endpoint=(i == len(nodes) - 2))
        base = p0[None] + s[:, None] * d[None]
        base[:, 1] += 4 * sags[i] * ln * s * (1 - s)
        if i == 0 and wave_amp > 0:
            nrm = np.array([-d[1], d[0]]) / ln
            w = wave_amp * np.sin(2 * np.pi * (s * 1.6 - t * 5.0)) * np.sin(np.pi * s) ** 1.2
            base += w[:, None] * nrm[None]
        pts.append(base)
    return np.vstack(pts)


def _resample(pts, n):
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    target = np.linspace(0, cum[-1], n)
    x = np.interp(target, cum, pts[:, 0])
    y = np.interp(target, cum, pts[:, 1])
    return np.stack([x, y], 1)


def thread_state(t):
    """Gibt (polyline_welt, kopf_welt, kopf_bewegt, hook_pin_pos, hook_pin_scale) zurueck."""
    if t >= T.LOOP_RETRACT:
        e = ease_in_out((t - T.LOOP_RETRACT) / (T.DURATION - T.LOOP_RETRACT))
        a = _single_state(t)
        b = _single_state(t - T.DURATION)
        n = 360
        pa, pb = _resample(a[0], n), _resample(b[0], n)
        poly = pa * (1 - e) + pb * e
        head = poly[-1]
        pin = np.array(a[3]) * (1 - e) + np.array(b[3]) * e
        scale = a[4] * (1 - e) + b[4] * e
        return poly, head, True, pin, scale
    return _single_state(t)


def _single_state(t):
    nodes, sags, moving = _base_state(t)
    poly = _densify(nodes, sags, t, _whip_wave(t))
    head = nodes[-1]
    # Nadel am Haken: fliegt mit dem Kopf, bis sie einschlaegt
    _, t0, t1 = T.THREAD_TRAVEL[0]
    if t < t1:
        raw = (t - t0) / (t1 - t0)
        pin = _travel_path(0, max(t, t0))
        scale = 1.0 + 0.9 * (1 - min(max(raw, 0), 1)) ** 1.5
    else:
        pin = np.array(L.P_HOOK)
        scale = 1.0
    return poly, head, moving or t < t1, pin, scale


# =============================================================================
# Zeichnen
# =============================================================================
def draw_thread(canvas, pts_screen, zoom, head_glow=0.0, opacity=1.0):
    """Zeichnet den roten Faden ueberall identisch.

    canvas: HxWx3 float32. pts_screen: Nx2 Bildschirmpunkte.
    """
    H, W = canvas.shape[:2]
    if len(pts_screen) < 2 or opacity <= 0:
        return
    th = max(2.0, THICK * zoom)
    sh = 4
    P = np.round(pts_screen * (1 << sh)).astype(np.int32)
    # Begrenzungsrahmen fuer ROI
    pad = int(th * 6 + 20)
    x0 = int(max(0, pts_screen[:, 0].min() - pad))
    y0 = int(max(0, pts_screen[:, 1].min() - pad))
    x1 = int(min(W, pts_screen[:, 0].max() + pad))
    y1 = int(min(H, pts_screen[:, 1].max() + pad))
    if x1 <= x0 or y1 <= y0:
        return
    off = np.array([x0, y0]) * (1 << sh)
    Pl = (P - off).reshape(-1, 1, 2)
    h, w = y1 - y0, x1 - x0
    roi = canvas[y0:y1, x0:x1]

    # Schatten auf der Wand
    shadow = np.zeros((h, w), np.float32)
    so = (np.array([5.0, 8.0]) * zoom * (1 << sh)).astype(np.int32)
    cv2.polylines(shadow, [Pl + so], False, 1.0, int(round(th)), cv2.LINE_AA, shift=sh)
    shadow = cv2.GaussianBlur(shadow, (0, 0), max(1.0, 3.5 * zoom))
    roi *= (1 - 0.55 * opacity * shadow)[..., None]

    # Faden-Koerper
    body = np.zeros((h, w), np.float32)
    cv2.polylines(body, [Pl], False, 1.0, int(round(th)), cv2.LINE_AA, shift=sh)
    # Kordel-Verdrillung: kurze schraege Striche entlang des Fadens
    twist = np.zeros((h, w), np.float32)
    rs = _resample(pts_screen, max(2, int(_length(pts_screen) / max(2.2, th * 0.55))))
    d = np.gradient(rs, axis=0)
    d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-6
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    diag = (d * 0.55 + nrm) * th * 0.5
    a = ((rs - diag - [x0, y0]) * (1 << sh)).astype(np.int32)
    b = ((rs + diag - [x0, y0]) * (1 << sh)).astype(np.int32)
    lines = np.stack([a, b], 1).reshape(-1, 2, 1, 2)
    cv2.polylines(twist, list(lines), False, 1.0, max(1, int(th * 0.18)), cv2.LINE_AA, shift=sh)
    twist *= body
    # Glanz: schmaler Streifen zur Lichtseite (oben)
    gl = np.zeros((h, w), np.float32)
    gofs = (nrm * np.sign(-nrm[:, 1:2] + 1e-6) * th * 0.22)
    gp = (((rs + gofs) - [x0, y0]) * (1 << sh)).astype(np.int32).reshape(-1, 1, 2)
    cv2.polylines(gl, [gp], False, 1.0, max(1, int(round(th * 0.28))), cv2.LINE_AA, shift=sh)
    gl = cv2.GaussianBlur(gl, (0, 0), max(0.6, th * 0.08)) * body

    col = RED * 0.80
    a = body[..., None] * opacity
    roi *= (1 - a)
    roi += a * col
    roi *= (1 - 0.45 * twist * opacity)[..., None]
    roi += (gl * 0.45 * opacity)[..., None] * np.array([1.0, 0.62, 0.58], np.float32)

    # Heller Kopf
    if head_glow > 0.01:
        hx, hy = pts_screen[-1]
        r = th * 4.5
        gx0, gy0 = int(max(0, hx - r * 3)), int(max(0, hy - r * 3))
        gx1, gy1 = int(min(W, hx + r * 3)), int(min(H, hy + r * 3))
        if gx1 > gx0 and gy1 > gy0:
            yy, xx = np.mgrid[gy0:gy1, gx0:gx1].astype(np.float32)
            dd = ((xx - hx) ** 2 + (yy - hy) ** 2) / (r * r)
            g = np.exp(-dd) * head_glow
            core = np.exp(-dd * 9) * head_glow
            canvas[gy0:gy1, gx0:gx1] += g[..., None] * np.array([0.9, 0.18, 0.12]) * 0.8
            canvas[gy0:gy1, gx0:gx1] += core[..., None] * np.array([1.0, 0.85, 0.75])


def _length(p):
    return float(np.linalg.norm(np.diff(p, axis=0), axis=1).sum())
