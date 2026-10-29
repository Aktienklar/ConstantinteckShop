"""Murdernight Reel v5 – Tonmischung.

Baut aus Voice-over, drei Musikteilen und SFX zwei Mixe (mit/ohne Musik) und misst
den Abstand Musik ↔ VO. Master-Lautheit: −14 LUFS / −1 dBTP (ffmpeg loudnorm, 2 Durchgänge).
Aufruf: python mix.py
"""
import json
import os
import subprocess

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

from vo_track import build as build_vo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'build', 'audio')
SR, DUR = 48000, 14.5
N = int(SR * DUR)
METER = pyln.Meter(SR, block_size=0.2)

# Musik: (Take, Quell-Start, Timeline-Start, Timeline-Ende) – harte Schnitte
MUSIC = [
    ('m1a', 0.00, 0.15, 5.00),   # Club, Bass-Drop bei 0,15
    ('m2a', 0.20, 5.00, 7.70),   # Dinner, ab 7,7 abrupte Stille
    ('m3b', 0.00, 8.60, 14.50),  # Zuhause, blendet am Ende ins Schwarz aus
]

# SFX: (Datei, Quell-Start, Timeline-Start, Gain dB nach Peak-Normierung, Länge max)
SFX = [
    ('x01', 0.00, 0.00, -12, 1.0),   # Glas-Glint auf Frame 0
    ('x04', 0.00, 0.00, -16, 5.0),   # Club-Atmo (0–1,8 gedämpft wie hinter Glas)
    ('x05', 0.00, 2.00, -16, 1.4),   # Champagner perlt
    ('x06', 0.00, 3.60, -10, 1.0),   # Gläser klirren Club
    ('x07', 0.00, 4.68, -9, 0.68),   # Whip-Pan-Whoosh über die Naht 5,0
    ('x02', 0.50, 5.10, -6, 0.5),    # Ampulle knackt
    ('x03', 0.00, 5.40, -11, 0.45),  # Tropfen 1
    ('x03', 0.00, 5.55, -12, 0.45),  # Tropfen 2
    ('x03', 0.00, 5.70, -13, 0.45),  # Tropfen 3
    ('x08', 0.00, 5.90, -14, 1.0),   # Gläser klirren Dinner
    ('x09', 0.00, 6.20, -6, 0.5),    # Hit 1
    ('x09', 0.00, 6.70, -6, 0.5),    # Hit 2
    ('x09', 0.00, 7.20, -6, 0.5),    # Hit 3
    ('x10', 0.20, 7.60, -8, 1.0),    # Kerzen flackern + aus
    ('x11', 0.00, 8.20, -5, 0.40),   # Glas zerspringt im Schwarz (hart bis 8,6)
    ('x12', 0.00, 8.60, -6, 0.48),   # Lichtschalter
    ('x13', 0.00, 8.62, -9, 2.4),    # Lachen
    ('x14', 0.00, 8.80, -16, 3.0),   # Stimmengewirr
    ('x15', 0.30, 11.00, -11, 1.45),  # Papierblättern
    ('x16', 0.00, 12.80, -8, 1.0),   # Kerze ausblasen
    ('x17', 0.00, 13.00, -7, 1.48),  # Logo-Hit
]


def load(path, offset=0.0, length=None):
    wav = path.rsplit('.', 1)[0] + '.48k.wav'
    if not os.path.exists(wav):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-ar', str(SR), '-ac', '2', wav], check=True)
    x, _ = sf.read(wav, dtype='float32')
    x = x[int(offset * SR):]
    if length is not None:
        x = x[:int(length * SR)]
    return x


def fades(x, fin=0.005, fout=0.01):
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None]
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None]
    return x


def place(track, x, at):
    i = int(at * SR)
    end = min(N, i + len(x))
    track[i:end] += x[:end - i]


def lowpass(x, cutoff):
    """Einfacher 2-Pol-Tiefpass (zweimal 1-Pol) für den ‚hinter Glas‘-Effekt."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    for _ in range(2):
        acc = np.zeros(x.shape[1], np.float32)
        for i in range(len(x)):
            acc = (1 - a) * x[i] + a * acc
            y[i] = acc
        x = y.copy()
    return y


def db(v):
    return 10 ** (v / 20)


def build_music():
    tr = np.zeros((N, 2), np.float32)
    for name, src, t0, t1 in MUSIC:
        x = load(os.path.join(A, 'music', name + '.mp3'), src, t1 - t0)
        x = x / (np.abs(x).max() + 1e-9)
        x = fades(x.copy(), 0.004, 0.012)
        if name == 'm3b':  # Ende dunkel: ab 13,4 ausblenden
            k0 = int((13.4 - t0) * SR)
            x[k0:] *= np.linspace(1, 0, len(x) - k0)[:, None] ** 1.5
        # Einzelteile vor dem Zusammensetzen auf gleiche Lautheit
        loud = METER.integrated_loudness(x)
        x *= db(-20 - loud)
        place(tr, x, t0)
    return tr


def build_sfx():
    tr = np.zeros((N, 2), np.float32)
    for name, src, at, gain, length in SFX:
        x = load(os.path.join(A, 'sfx', name + '.mp3'), src, length)
        x = x / (np.abs(x).max() + 1e-9) * db(gain)
        x = fades(x.copy(), 0.002, 0.02)
        if name == 'x04':  # Club-Atmo: 0–1,8 gedämpft, dann voll; harter Schnitt bei 5,0
            k = int(1.8 * SR)
            x[:k] = lowpass(x[:k], 500) * db(-4)
            x[k:] *= db(3)
        place(tr, x, at)
    return tr


def vo_envelope(vo, attack=0.03, release=0.25):
    """0..1-Hüllkurve: wo spricht die Stimme (für Ducking)."""
    lvl = np.abs(vo).max(1)
    win = int(0.02 * SR)
    lvl = np.convolve(lvl, np.ones(win) / win, 'same')
    on = (lvl > 0.01).astype(np.float32)
    env = np.zeros_like(on)
    ka, kr = 1 / (attack * SR), 1 / (release * SR)
    v = 0.0
    for i, o in enumerate(on):
        v = min(1.0, v + ka) if o > v else max(o, v - kr)
        env[i] = v
    return env


def two_pass_loudnorm(src, dst, target=-14.0, tp=-1.0):
    flt = f'loudnorm=I={target}:TP={tp}:LRA=11:print_format=json'
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', src, '-af', flt, '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    flt2 = (f"loudnorm=I={target}:TP={tp}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
            f":offset={m['target_offset']}:linear=true:print_format=json")
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', src, '-af', flt2, '-ar', str(SR), '-c:a', 'pcm_s24le', dst],
                       capture_output=True, text=True)
    return json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])


def main():
    vo = build_vo()
    vo *= db(-16 - METER.integrated_loudness(vo))   # Sprache auf −16 LUFS (vor Master)
    music = build_music()
    sfx = build_sfx()

    env = vo_envelope(vo)[:, None]
    # Musik: Grundpegel −23 LUFS (trägt zwischen den Sätzen), unter Sprache −8 dB Ducking
    music_g = music * db(-3) * (1 - env * (1 - db(-8)))
    sfx_g = sfx * (1 - env * (1 - db(-3)))

    # Prüfung: Musik muss im Sprachbereich ≥ 12 dB unter VO liegen
    mask = env[:, 0] > 0.9
    vo_l = METER.integrated_loudness(vo[mask])
    mu_l = METER.integrated_loudness(music_g[mask])
    print(f'Sprachbereich: VO {vo_l:.1f} LUFS · Musik {mu_l:.1f} LUFS · Abstand {vo_l - mu_l:.1f} dB')
    assert vo_l - mu_l >= 12, 'Musik zu laut unter dem Voice-over'

    os.makedirs(os.path.join(A, 'mix'), exist_ok=True)
    full = vo + music_g + sfx_g
    nomusic = vo + sfx_g
    for name, x in (('mix_full', full), ('mix_ohne_musik', nomusic)):
        raw = os.path.join(A, 'mix', name + '_raw.wav')
        sf.write(raw, x / max(1.0, np.abs(x).max()), SR, subtype='FLOAT')
        res = two_pass_loudnorm(raw, os.path.join(A, 'mix', name + '.wav'), target=-14.3, tp=-1.6)  # Reserve für AAC
        print(name, 'out: I', res['output_i'], 'LUFS · TP', res['output_tp'], 'dBTP · LRA', res['output_lra'])


if __name__ == '__main__':
    main()
