"""Musik, SFX, Voice-over-Platzierung, Mix und Mastering (alles synthetisiert).

python3 audio.py  -> build/audio/{music,sfx,vo}.wav, mix.wav, mix_ohne_musik.wav
"""
import glob
import json
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d

import timeline as T
from common import BUILD, OUT

SR = T.SR
N = int(T.DURATION * SR)
ADIR = os.path.join(BUILD, "audio")
RNG = np.random.default_rng(2024)


# =============================================================================
# Grundbausteine
# =============================================================================
def tt(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur, seed=None):
    r = RNG if seed is None else np.random.default_rng(seed)
    return r.standard_normal(int(dur * SR))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)


def adsr(n, a, d, s, r, sus_time=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    st = n - a - d - r if sus_time is None else int(sus_time * SR)
    st = max(0, st)
    e = np.concatenate([np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)), np.full(st, s),
                        np.linspace(s, 0, max(r, 1))])
    out = np.zeros(n)
    m = min(n, len(e))
    out[:m] = e[:m]
    return out


def expdec(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def saw(freq, dur, detune=0.0, phase=0.0):
    t = tt(dur)
    f = freq * (1 + detune)
    return 2 * ((t * f + phase) % 1.0) - 1


def karplus(freq, dur, decay=0.996, bright=0.5, seed=0):
    n = int(dur * SR)
    p = int(SR / freq)
    buf = np.random.default_rng(seed).uniform(-1, 1, p)
    buf = lp(buf, 800 + 5000 * bright)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        j = (i + 1) % p
        buf[i % p] = decay * 0.5 * (buf[i % p] + buf[j])
    return out


def place(buf, sig, t, gain=1.0, pan=0.0):
    """sig mono oder stereo an Zeit t (Sek.) in buf (N x 2) addieren."""
    i = int(round(t * SR))
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    s0 = max(0, -i)
    i0 = max(0, i)
    n = min(len(sig) - s0, len(buf) - i0)
    if n > 0:
        buf[i0:i0 + n] += sig[s0:s0 + n] * gain


def reverb_ir(dur=2.4, seed=5, damp=3000):
    n = int(dur * SR)
    ir = []
    for k in range(2):
        x = np.random.default_rng(seed + k).standard_normal(n) * expdec(n, dur / 6.5)
        x = lp(x, damp)
        x[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir.append(x)
    ir = np.stack(ir, 1)
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True))


IR = reverb_ir()
IR_SHORT = reverb_ir(0.9, 9, 5000)


def reverb(x, wet=0.25, ir=IR):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    y = np.stack([signal.fftconvolve(x[:, k], ir[:, k])[: len(x)] for k in range(2)], 1)
    return x * (1 - wet) + y * wet


def fade(x, fi=0.003, fo=0.01):
    a, b = int(fi * SR), int(fo * SR)
    x = x.copy()
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None] if x.ndim == 2 else np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None] if x.ndim == 2 else np.linspace(1, 0, b)
    return x


def note(name):
    names = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8,
             "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
    p, o = name[:-1], int(name[-1])
    midi = 12 * (o + 1) + names[p]
    return 440.0 * 2 ** ((midi - 69) / 12)


# =============================================================================
# Musik
# =============================================================================
def pizz(freq, seed):
    x = karplus(freq, 0.6, decay=0.990, bright=0.35, seed=seed)
    x = bp(x, 90, 4000) * adsr(len(x), 0.002, 0.08, 0.5, 0.3)
    return x


def clock_tick(tock=False, seed=0):
    n = noise(0.03, seed) * expdec(int(0.03 * SR), 0.004)
    n = bp(n, 2500 if tock else 3600, 7000)
    ping = np.sin(2 * np.pi * (1650 if tock else 2150) * tt(0.04)) * expdec(int(0.04 * SR), 0.006)
    return n * 0.5 + ping[: len(n)] * 0.6 if len(ping) >= len(n) else n


def pad_voice(freq, dur, cutoff=1600, att=0.35):
    x = sum(saw(freq, dur, d, ph) for d, ph in [(-0.004, 0.0), (0.0, 0.33), (0.005, 0.71)]) / 3
    x = lp(x, cutoff, 2)
    return x * adsr(len(x), att, 0.4, 0.8, 0.6)


def build_music():
    mus = np.zeros((N, 2))
    beat, e8 = T.BEAT, T.EIGHTH
    # --- Pizzicato + Uhr (0 - 6.6) ---------------------------------------------
    bar1 = ["D3", "A3", "F3", "A3", "D4", "A3", "F3", "A3"]
    bar2 = ["Bb2", "F3", "D3", "F3", "A2", "E3", "C#4", "E3"]
    pat = bar1 + bar2
    k = 0
    t = 0.0
    while t < T.CANDLE_OUT - 0.05:
        nm = pat[k % len(pat)]
        g = 0.55 if k % 4 == 0 else 0.38
        if t >= T.BUILD_START:
            g *= 1.15
        place(mus, pizz(note(nm), k), t, g, pan=-0.3 if k % 2 else 0.3)
        place(mus, clock_tick(k % 2 == 1, k), t, 0.22 if t < T.BUILD_START else 0.16, pan=0.5)
        k += 1
        t += e8
    # dichterer Puls ab 4.0: Sechzehntel-Ticks dazwischen
    t = T.BUILD_START + e8 / 2
    while t < T.CANDLE_OUT - 0.05:
        place(mus, clock_tick(True, 900 + int(t * 100)), t, 0.10, pan=-0.4)
        t += e8
    # --- Drone (0 - 6.6) ---------------------------------------------------------
    d = T.CANDLE_OUT
    dr = (saw(note("D1"), d) + 0.7 * saw(note("A1"), d, 0.003) + 0.4 * saw(note("D2"), d, -0.002))
    dr = lp(dr, 220, 2) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.27 * tt(d)))
    dr *= adsr(len(dr), 0.05, 0.1, 1.0, 0.004)
    place(mus, dr, 0.0, 0.35)
    # --- Spannungsaufbau (4.0 - 6.6): Filter oeffnet ----------------------------
    d = T.CANDLE_OUT - T.BUILD_START
    n = int(d * SR)
    arp = np.zeros(n)
    seq = ["D2", "D3", "A2", "D3", "F2", "D3", "A2", "C#3"]
    st = e8 / 2
    for j in range(int(d / st) + 1):
        f0 = note(seq[j % len(seq)])
        s = saw(f0, st * 0.9) * adsr(int(st * 0.9 * SR), 0.004, 0.05, 0.6, 0.03)
        i = int(j * st * SR)
        m = min(len(s), n - i)
        if m > 0:
            arp[i:i + m] += s[:m]
    out = np.zeros(n)
    block = 512
    zi = None
    for b0 in range(0, n, block):
        u = b0 / n
        fc = 400 * (3500 / 400) ** (u ** 1.3)
        sos = signal.butter(2, fc, "lowpass", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        out[b0:b0 + block], zi = signal.sosfilt(sos, arp[b0:b0 + block], zi=zi)
    out *= np.linspace(0.35, 1.0, n) ** 1.5
    riser = bp(noise(d, 77), 800, 6000) * np.linspace(0, 1, n) ** 2.5 * 0.25
    sweep = np.sin(2 * np.pi * np.cumsum(np.linspace(110, 440, n)) / SR) * np.linspace(0, 1, n) ** 2 * 0.15
    bld = out * 0.45 + riser + sweep
    bld[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
    place(mus, bld, T.BUILD_START, 0.8)
    # --- 6.6: Stille -------------------------------------------------------------
    # --- 7.4 Stinger ---------------------------------------------------------------
    d = 2.6
    cl = sum(pad_voice(note(nm), d, 2600, 0.006) for nm in ["D2", "D3", "Eb3", "A3", "D4"]) / 5
    cl *= expdec(len(cl), 0.7)
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(58, 30, int(d * SR))) / SR) * expdec(int(d * SR), 0.45)
    hit = bp(noise(0.25, 31), 100, 3000) * expdec(int(0.25 * SR), 0.03)
    sting = cl * 0.9 + boom * 0.9
    sting[: len(hit)] += hit * 0.5
    place(mus, reverb(sting, 0.4), T.STAMP_HIT, 0.75)
    # leiser Drone unter "Wer war's?"
    d = T.PHONE_IN - T.STAMP_HIT + 0.3
    dr2 = lp(saw(note("D1"), d) + saw(note("A1"), d, 0.004), 160) * adsr(int(d * SR), 0.5, 0.2, 1.0, 0.5)
    place(mus, dr2, T.STAMP_HIT + 0.2, 0.22)
    # --- 9.2 warme Akkorde ---------------------------------------------------------
    chords = [
        (T.PHONE_IN, 1.45, ["D2", "A2", "F3", "C4", "E4"]),
        (T.PHONE_IN + T.BAR / 2, 1.20, ["Bb1", "F2", "D3", "A3", "F4"]),
        (T.THREAD_SHOOT_UP, 0.45, ["A1", "E2", "D3", "G3", "E4"]),
        (T.LOGO_HIT, 1.25, ["D2", "A2", "F3", "A3", "D4", "E4"]),
    ]
    for t0, dur, ns in chords:
        ch = sum(pad_voice(note(nm), dur + 0.6, 1900, 0.18 if t0 != T.LOGO_HIT else 0.01) for nm in ns) / len(ns)
        place(mus, reverb(ch, 0.35), t0, 0.55)
    # sanfte Pizz-Arpeggien im Produktteil
    arp2 = ["D3", "F3", "A3", "D4", "Bb2", "D3", "F3", "A3", "A2", "D3", "E3", "G3"]
    t, k = T.PHONE_IN, 0
    while t < T.THREAD_SHOOT_UP - 0.02:
        place(mus, pizz(note(arp2[k % len(arp2)]), 500 + k), t, 0.22, pan=0.4 if k % 2 else -0.4)
        t += e8
        k += 1
    # --- 13.0 tiefer Ton -----------------------------------------------------------
    d = T.DURATION - T.TAIL_TONE - 0.05
    tq = tt(d)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * tq) * np.clip(tq / 0.6, 0, 1)
    ph = np.cumsum(note("D2") * vib) / SR
    cello = 2 * (ph % 1) - 1
    cello = lp(cello, 700) + 0.3 * lp(bp(noise(d, 88), 200, 1200), 600)
    env = adsr(len(cello), 0.12, 0.3, 0.7, 0.01) * np.exp(-tq / 0.9)
    cello *= env
    cello[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))
    place(mus, reverb(cello, 0.3), T.TAIL_TONE, 0.6)
    return mus


# =============================================================================
# SFX
# =============================================================================
def s_whoosh(dur, lo=300, hi=3000, up=True, seed=0):
    n = int(dur * SR)
    x = noise(dur, seed)
    out = np.zeros(n)
    blk = 256
    zi = None
    for b0 in range(0, n, blk):
        u = b0 / n if up else 1 - b0 / n
        fc = lo * (hi / lo) ** u
        sos = signal.butter(2, [fc * 0.6, min(fc * 1.6, SR / 2 - 100)], "bandpass", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[b0:b0 + blk], zi = signal.sosfilt(sos, x[b0:b0 + blk], zi=zi)
    env = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return out * env


def s_whip(seed=1):
    w = s_whoosh(0.13, 400, 4500, True, seed) * 0.8
    crack = hp(noise(0.02, seed + 1), 1500) * expdec(int(0.02 * SR), 0.0025)
    out = np.zeros(int(0.25 * SR))
    out[: len(w)] += w
    i = int(0.06 * SR)
    out[i:i + len(crack)] += crack * 1.6
    return out


def s_pin():
    d = 0.6
    n = int(d * SR)
    thud = np.sin(2 * np.pi * np.cumsum(np.linspace(140, 55, n)) / SR) * expdec(n, 0.07)
    sub = np.sin(2 * np.pi * np.cumsum(np.linspace(62, 38, n)) / SR) * expdec(n, 0.25)
    click = hp(noise(0.01, 3), 2000) * expdec(int(0.01 * SR), 0.0015)
    crumble = bp(noise(0.4, 4), 1500, 6000) * expdec(int(0.4 * SR), 0.08) * \
        (RNG.random(int(0.4 * SR)) > 0.97)
    out = thud * 0.9 + sub * 0.8
    out[: len(click)] += click * 1.2
    out[int(0.02 * SR):int(0.02 * SR) + len(crumble)] += lp(crumble, 5000) * 0.8
    return reverb(out, 0.15, IR_SHORT)


def s_zip(seed):
    return s_whoosh(0.22, 900, 5000, True, seed) * 0.35


def s_pluck(seed):
    x = karplus(note("D2") * (1 + 0.02 * (seed % 3)), 0.35, 0.985, 0.6, seed)
    return x * 0.5


def s_flip(seed):
    d = 0.22
    x = bp(noise(d, seed), 600, 7000)
    flutter = 0.6 + 0.4 * np.sin(2 * np.pi * 38 * tt(d))
    env = adsr(len(x), 0.01, 0.05, 0.5, 0.12)
    thump = np.sin(2 * np.pi * 95 * tt(d)) * expdec(len(x), 0.03)
    return x * flutter * env * 0.55 + thump * 0.35


def s_type(seed):
    r = np.random.default_rng(seed)
    d = 0.05
    k = hp(noise(d, seed), 1800) * expdec(int(d * SR), 0.004)
    body = np.sin(2 * np.pi * (180 + 40 * r.random()) * tt(d)) * expdec(int(d * SR), 0.008)
    return (k * 0.7 + body * 0.35) * (0.8 + 0.4 * r.random())


def s_hit(seed, pitch="D2"):
    d = 1.4
    n = int(d * SR)
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(note(pitch) * 1.6, note(pitch) * 0.7, n)) / SR) * expdec(n, 0.3)
    snap = bp(noise(0.08, seed), 300, 6000) * expdec(int(0.08 * SR), 0.012)
    body = sum(saw(note(p), d, 0.002 * j) for j, p in enumerate([pitch, "A2", "D3"])) / 3
    body = lp(body, 1200) * expdec(n, 0.18)
    out = boom * 0.9 + body * 0.35
    out[: len(snap)] += snap * 0.9
    return reverb(out, 0.3)


def s_text(seed):
    d = 0.18
    n = int(d * SR)
    thud = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 70, n)) / SR) * expdec(n, 0.04)
    air = s_whoosh(d, 1500, 5000, False, seed) * 0.25
    return thud * 0.35 + air


def s_blow():
    d = 0.5
    x = bp(noise(d, 61), 400, 3500) * adsr(int(d * SR), 0.03, 0.1, 0.6, 0.3)
    flick = hp(noise(0.06, 62), 2500) * expdec(int(0.06 * SR), 0.01)
    x[int(0.12 * SR):int(0.12 * SR) + len(flick)] += flick * 0.4
    return x * 0.6


def s_match():
    d = 0.7
    n = int(d * SR)
    scratch = bp(noise(0.12, 71), 1500, 8000) * adsr(int(0.12 * SR), 0.005, 0.03, 0.7, 0.06)
    flare = bp(noise(d, 72), 200, 3000) * adsr(n, 0.02, 0.15, 0.25, 0.4)
    crackle = (np.random.default_rng(73).random(n) > 0.996) * expdec(n, 0.3)
    crackle = hp(crackle.astype(float), 3000)
    out = flare * 0.45 + crackle * 0.8
    out[: len(scratch)] += scratch * 0.9
    return out


def s_breath():
    d = 0.42
    n = int(d * SR)
    x = bp(noise(d, 81), 500, 2500) * np.sin(np.linspace(0, np.pi, n)) ** 2
    return lp(x, 2200) * 0.35


def s_stamp():
    d = 0.5
    n = int(d * SR)
    slap = bp(noise(0.05, 91), 200, 5000) * expdec(int(0.05 * SR), 0.01)
    thud = np.sin(2 * np.pi * np.cumsum(np.linspace(160, 60, n)) / SR) * expdec(n, 0.06)
    out = thud * 1.0
    out[: len(slap)] += slap * 1.1
    return reverb(out, 0.18, IR_SHORT)


def s_phone_land():
    d = 0.12
    n = int(d * SR)
    return (np.sin(2 * np.pi * 210 * tt(d)) * expdec(n, 0.02) * 0.5 +
            bp(noise(d, 95), 800, 5000) * expdec(n, 0.008) * 0.4)


def s_rustle(seed):
    d = 0.32
    x = bp(noise(d, seed), 1200, 9000)
    gr = np.random.default_rng(seed).random(int(d * SR))
    gr = lp((gr > 0.7).astype(float), 400)
    return x * gr * adsr(len(x), 0.02, 0.08, 0.6, 0.18) * 0.9


def s_logo_hit():
    out = s_hit(101, "D2")
    shimmer = sum(np.sin(2 * np.pi * note(p) * tt(1.4)) for p in ["D5", "A5", "D6"]) / 3
    shimmer *= expdec(len(shimmer), 0.5) * 0.12
    out[: len(shimmer)] += np.stack([shimmer, shimmer], 1)
    return out


def s_reverse_whip():
    w = s_whoosh(0.48, 300, 3800, True, 111)
    return w * np.linspace(0.2, 1, len(w)) ** 2 * 0.6


def s_pop():
    d = 0.06
    return hp(noise(d, 121), 800) * expdec(int(d * SR), 0.006) * 0.5


# ---- Event-Liste + Kollisionsregel ------------------------------------------
def sfx_events():
    ev = []  # (zeit, name, gruppe, fn, gain, pan, hit)
    ev.append((0.0, "Peitsche", "whip", s_whip, 0.8, -0.3, False))
    ev.append((T.PIN_HIT, "Nadel-Einschlag", "hit", s_pin, 1.0, 0.0, True))
    for k, (name, t0, t1) in enumerate(T.THREAD_TRAVEL):
        if k == 0:
            continue
        if name == "logo_l":
            ev.append((t0, "Faden schiesst hoch", "thread", lambda: s_whoosh(0.32, 250, 4000, True, 140) * 0.7,
                       0.9, 0.0, False))
        elif name != "logo_r":
            ev.append((t0, f"Faden-Zip {name}", "thread", (lambda k=k: s_zip(130 + k)), 0.8, 0.2, False))
        if name != "logo_r":
            ev.append((t1, f"Faden-Zupfer {name}", "thread", (lambda k=k: s_pluck(150 + k)), 0.7, -0.2, False))
    ev.append((T.NINE_CASES_IN, "Text 9 Faelle", "text", lambda: s_text(1), 0.8, 0.0, False))
    for i, c in enumerate(T.CASES):
        ev.append((c[4], f"Papier-Flip Akte {i + 1}", "paper", (lambda i=i: s_flip(200 + i)), 0.9,
                   -0.3 if i % 2 == 0 else 0.3, False))
        nch = sum(len(l) for l in __import__("layout").LABEL_LINES[i]) + 1
        for j in range(nch):
            t = c[4] + T.LABEL_DELAY + j * T.LABEL_CHAR
            ev.append((t, f"Tipp {i + 1}.{j}", f"type{i}", (lambda s=300 + i * 40 + j: s_type(s)), 0.45,
                       -0.25 if i % 2 == 0 else 0.25, False))
    for k, (_, t) in enumerate(T.NUMBERS):
        ev.append((t, f"Zahl {k + 1}", "hit", (lambda k=k: s_hit(400 + k, ["D2", "F2", "A1"][k])), 0.9, 0.0, True))
    ev.append((T.CANDLE_OUT, "Kerze auspusten", "candle", s_blow, 0.9, -0.5, False))
    ev.append((T.RELIGHT, "Streichholz", "candle", s_match, 0.7, -0.5, False))
    ev.append((T.STAMP_HIT - 0.38, "Atemzug", "breath", s_breath, 0.7, 0.0, False))
    ev.append((T.STAMP_HIT, "Stempel", "hit", s_stamp, 1.0, -0.2, True))
    ev.append((T.WHO_TEXT_IN, "Text Wer war's", "text", lambda: s_text(2), 0.6, 0.0, False))
    ev.append((T.PHONE_IN, "Handy gleitet", "phone", lambda: s_whoosh(0.45, 200, 2000, False, 160) * 0.8, 0.8,
               0.4, False))
    ev.append((T.PHONE_IN + T.PHONE_IN_DUR - 0.02, "Handy landet", "phone", s_phone_land, 0.7, 0.3, False))
    for k, (_, t) in enumerate(T.PAGES):
        ev.append((t, f"Seite {k + 1}", "paper", (lambda k=k: s_rustle(500 + k)), 0.8, -0.3 + 0.2 * k, False))
    for k, (_, t) in enumerate(T.PLAY_WORDS):
        ev.append((t, f"Text Spiel {k + 1}", "text", (lambda k=k: s_text(10 + k)), 0.55, 0.0, False))
    ev.append((T.LOGO_HIT, "Logo-Hit", "hit", s_logo_hit, 1.0, 0.0, True))
    ev.append((T.PRICE_IN, "Text Preis", "text", lambda: s_text(20), 0.5, 0.0, False))
    ev.append((T.ENDCARD_IN + 0.08, "Text Endcard", "text", lambda: s_text(21), 0.45, 0.0, False))
    ev.append((T.LOOP_RETRACT, "Faden-Rueckzug", "retract", s_reverse_whip, 0.8, -0.3, False))
    ev.append((T.LOOP_RETRACT + 0.12, "Nadel zieht", "retract2", s_pop, 0.7, 0.0, False))
    return ev


def schedule(ev):
    """Nicht-Hits halten >= 60 ms Abstand zu Events anderer Gruppen (Ticks fallen sonst weg)."""
    gap = T.SFX_MIN_GAP
    placed = [e for e in ev if e[6]]
    log = []
    rest = [e for e in ev if not e[6]]
    order = sorted([e for e in rest if not e[2].startswith("type")], key=lambda e: e[0]) + \
        sorted([e for e in rest if e[2].startswith("type")], key=lambda e: e[0])
    for e in order:
        t = e[0]
        is_tick = e[2].startswith("type")

        def clash(tc):
            return [p for p in placed if p[2] != e[2] and abs(p[0] - tc) < gap - 1e-9]
        if not clash(t):
            placed.append(e)
            continue
        if is_tick:
            log.append(f"{e[1]} @ {t:.3f}s entfaellt (Abstand < 60 ms zu {clash(t)[0][1]})")
            continue
        for dt in np.arange(0.005, 0.12, 0.005):
            for cand in (t + dt, t - dt):
                if cand >= 0 and not clash(cand):
                    placed.append((cand,) + e[1:])
                    log.append(f"{e[1]}: {t:.3f}s -> {cand:.3f}s")
                    break
            else:
                continue
            break
        else:
            placed.append(e)
            log.append(f"{e[1]} @ {t:.3f}s: keine freie Position gefunden")
    return sorted(placed, key=lambda e: e[0]), log


def build_sfx():
    ev, log = schedule(sfx_events())
    sfx = np.zeros((N, 2))
    for t, name, grp, fn, g, pan, hit in ev:
        s = fn()
        place(sfx, fade(s, 0.001, 0.01), t, g, pan)
    return sfx, ev, log


# =============================================================================
# Voice-over
# =============================================================================
def build_vo():
    """Nutzt build/vo/line{1..4}.wav, falls vorhanden (aus ElevenLabs geschnitten)."""
    vo = np.zeros((N, 2))
    found = []
    for k, (txt, t0) in enumerate(T.VO_LINES):
        p = os.path.join(BUILD, "vo", f"line{k + 1}.wav")
        if os.path.exists(p):
            x, sr = sf.read(p)
            if sr != SR:
                x = signal.resample_poly(x, SR, sr, axis=0)
            if x.ndim > 1:
                x = x.mean(1)
            place(vo, x, t0, 1.0)
            found.append((t0, t0 + len(x) / SR))
    return vo, found


def duck_music(mus, vo, spans):
    """Musik in VO-Fenstern so absenken, dass sie mind. 12 dB unter der Stimme liegt."""
    gain = np.ones(N)
    report = []
    for a, b in spans:
        i0, i1 = int(a * SR), int(b * SR)
        v = 10 * np.log10(np.mean(vo[i0:i1] ** 2) + 1e-12)
        m = 10 * np.log10(np.mean(mus[i0:i1] ** 2) + 1e-12)
        need = v - T.VO_MUSIC_GAP_DB - 1.0 - m
        g = 10 ** (min(0, need) / 20)
        r = int(0.08 * SR)
        j0, j1 = max(0, i0 - r), min(N, i1 + r)
        seg = np.full(j1 - j0, g)
        seg[: i0 - j0] = np.linspace(1, g, i0 - j0)
        seg[i1 - j0:] = np.linspace(g, 1, j1 - i1)
        gain[j0:j1] = np.minimum(gain[j0:j1], seg)
    mus = mus * gain[:, None]
    for a, b in spans:
        i0, i1 = int(a * SR), int(b * SR)
        v = 10 * np.log10(np.mean(vo[i0:i1] ** 2) + 1e-12)
        m = 10 * np.log10(np.mean(mus[i0:i1] ** 2) + 1e-12)
        report.append((round(a, 2), round(v - m, 1)))
    return mus, report


# =============================================================================
# Mastering
# =============================================================================
def true_peak_db(x):
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.abs(up).max() + 1e-12)


def limiter(x, ceiling_db):
    c = 10 ** (ceiling_db / 20)
    up = signal.resample_poly(x, 4, 1, axis=0)
    peak = np.abs(up).max(1)
    g = np.minimum(1.0, c / np.maximum(peak, 1e-9))
    g = g[: len(g) // 4 * 4].reshape(-1, 4).min(1)
    g = np.concatenate([g, np.ones(len(x) - len(g))])
    look = int(0.002 * SR)
    # Lookahead-Minimum ueber Fenster (schnell via Erosion)
    g = minimum_filter1d(g, size=2 * look + 1)
    # Release-Glaettung (einpolig)
    rel = np.exp(-1 / (0.08 * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else g[i] + (cur - g[i]) * rel
        out[i] = cur
    return x * out[:, None]


def master(x, name):
    meter = pyln.Meter(SR)
    gain_db = T.TARGET_LUFS - meter.integrated_loudness(x)
    y = x
    for _ in range(6):
        y = limiter(x * 10 ** (gain_db / 20), T.TARGET_TP - 0.3)
        lufs = meter.integrated_loudness(y)
        if abs(lufs - T.TARGET_LUFS) < 0.1:
            break
        gain_db += T.TARGET_LUFS - lufs
    tp = true_peak_db(y)
    sf.write(os.path.join(ADIR, name), y.astype(np.float32), SR, subtype="FLOAT")
    return meter.integrated_loudness(y), tp


def main():
    os.makedirs(ADIR, exist_ok=True)
    mus = build_music()
    sfx, ev, log = build_sfx()
    vo, spans = build_vo()
    duck = []
    if spans:
        mus, duck = duck_music(mus, vo, spans)
    for nm, x in (("music.wav", mus), ("sfx.wav", sfx), ("vo.wav", vo)):
        sf.write(os.path.join(ADIR, nm), x.astype(np.float32), SR, subtype="FLOAT")
    mix = mus * 0.55 + sfx * 0.9 + vo * 1.0
    r1 = master(mix, "mix.wav")
    r2 = master(sfx * 0.9 + vo, "mix_ohne_musik.wav")
    info = dict(mix_lufs=r1[0], mix_tp=r1[1], dry_lufs=r2[0], dry_tp=r2[1], vo_lines=len(spans),
                vo_music_gap_db=duck, schedule_log=log,
                events=[(round(e[0], 3), e[1]) for e in ev if not e[2].startswith("type")],
                ticks=sum(1 for e in ev if e[2].startswith("type")))
    json.dump(info, open(os.path.join(ADIR, "audio_report.json"), "w"), indent=1, ensure_ascii=False)
    print(json.dumps({k: v for k, v in info.items() if k not in ("events",)}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
