"""Raumaufteilung der Ermittlerwand (Welt-Pixel). Zeiten stehen in timeline.py."""
import numpy as np

WALL_W, WALL_H = 2800, 6000
WALL_ORIGIN_Y = -400                   # Wand-Textur beginnt oberhalb der Welt-Null

# Faden
THREAD_ANCHOR = (350.0, 820.0)        # Faden kommt von links oben (ausserhalb)
WHIP_START = (700.0, 860.0)            # Kopf-Startpunkt der Peitsche
WHIP_CTRL = (860.0, 1420.0)            # Bezier-Kontrollpunkt des Bogens
P_HOOK = (1300.0, 1250.0)              # Nadel-Einschlag S1

# Logo-Karte
LOGO_CENTER = (1400.0, 380.0)
LOGO_CARD_W, LOGO_CARD_H = 1000, 300
LOGO_PIN_L = (985.0, 462.0)
LOGO_PIN_R = (1815.0, 462.0)

# Fallakten: Mittelpunkt des Aktenkoerpers, Drehung in Grad
FOLDER_W, FOLDER_H = 400, 580          # Koerper
FOLDER_TAB_H = 64
FOLDERS = [
    (1150.0, 2450.0, -2.0),
    (1700.0, 2600.0, 1.8),
    (1150.0, 3140.0, 1.2),
    (1700.0, 3290.0, -1.6),
]
LABEL_SIZE = 50
LABEL_CENTER_Y = 196.0                 # Etikett auf dem Innenblatt, relativ zur Aktenmitte                        # Special Elite, Welt-px
LABEL_LINES = [
    ("Spukschloss,", "1986"),
    ("Weingut an", "der Mosel"),
    ("Hollywood,", "1934"),
    ("Berghotel,", "1928"),
]
STAMP_OFFSET = (0.0, 20.0)            # relativ zur Aktenmitte
STAMP_ROT = -12.0

# Handy
PHONE_W, PHONE_H = 420, 860
PHONE_POS = (1560.0, 4680.0)           # Endposition (Mitte)
PHONE_FROM = (2300.0, 5600.0)          # gleitet von rechts unten herein
PHONE_ROT_FROM, PHONE_ROT = 14.0, 4.0

# PDF-Seiten (Kaskade links neben dem Handy), Mitte + Drehung
PAGE_W, PAGE_H = 380, 480
PAGES_POS = [
    (1180.0, 4400.0, -5.0),
    (1215.0, 4535.0, 3.0),
    (1170.0, 4670.0, -3.5),
    (1220.0, 4805.0, 4.0),
]

# Kerze (Bildschirmraum, Vordergrund)
CANDLE_SCREEN = (120.0, 1830.0)


def folder_matrix(i, open_scale=1.0):
    """Welt-Matrix fuer Aktenkoerper: lokale Sprite-Koords -> Welt."""
    cx, cy, rot = FOLDERS[i]
    return cx, cy, np.deg2rad(rot)


def rot_pt(px, py, cx, cy, ang):
    c, s = np.cos(ang), np.sin(ang)
    return (cx + c * px - s * py, cy + s * px + c * py)


def folder_pin(i):
    """Nadel oben rechts am Aktenreiter (Welt)."""
    cx, cy, rot = FOLDERS[i]
    return rot_pt(FOLDER_W / 2 - 30, -FOLDER_H / 2 - FOLDER_TAB_H + 26, cx, cy, np.deg2rad(rot))
