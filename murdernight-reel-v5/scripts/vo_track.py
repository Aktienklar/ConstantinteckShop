"""Setzt die Voice-over-Takes auf die Timeline (48 kHz, Stereo, 14,5 s).

Takes werden nur an Sprechpausen geteilt und verschoben, nie beschleunigt.
Aufruf: python vo_track.py out.wav
"""
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, 'build', 'audio', 'vo')
SR, DUR = 48000, 14.5

# (Take, Quell-Start, Quell-Ende, Timeline-Start) in Sekunden
PLACEMENTS = [
    ('vo1b', 0.00, 1.47, 0.25),   # „Einer von euch …“
    ('vo1b', 3.22, 4.68, 1.85),   # „… ist ein Mörder.“ – direkt nach dem Schnitt bei 1,8
    ('vo2b', 0.00, 1.26, 7.70),   # „Aber wer war's?“
    ('vo3b', 0.00, 1.09, 10.75),  # „Murdernight.“
    ('vo3b', 1.76, 4.13, 12.05),  # „Das Krimidinner für zuhause.“
]


def load(name):
    wav = os.path.join(VO, name + '.wav')
    if not os.path.exists(wav):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(VO, name + '.mp3'),
                        '-ar', str(SR), '-ac', '1', wav], check=True)
    x, _ = sf.read(wav, dtype='float32')
    return x


def build():
    track = np.zeros(int(SR * DUR), np.float32)
    fade = int(0.01 * SR)
    for name, a, b, at in PLACEMENTS:
        seg = load(name)[int(a * SR):int(b * SR)].copy()
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        i = int(at * SR)
        end = min(len(track), i + len(seg))
        track[i:end] += seg[:end - i]
    return np.stack([track, track], 1)


if __name__ == '__main__':
    sf.write(sys.argv[1], build(), SR, subtype='PCM_24')
