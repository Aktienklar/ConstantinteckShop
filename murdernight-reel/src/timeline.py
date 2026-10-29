"""Zentrale Timeline fuer das Murdernight-Reel "Einer von euch luegt".

Alle Zeiten in Sekunden. Nichts davon wird anderswo hartkodiert:
Renderer, Audio und Brief lesen ausschliesslich aus dieser Datei.
"""

# --- Technik -----------------------------------------------------------------
W, H = 1080, 1920
FPS = 60
CONTENT = 13.00
ENDCARD = 2.00
DURATION = CONTENT + ENDCARD          # 15.00 s
N_FRAMES = int(round(DURATION * FPS))  # 900

PREVIEW_W, PREVIEW_H, PREVIEW_FPS = 540, 960, 30
MOTION_SAMPLES = 5                     # Sub-Frame-Samples fuer schnelle Bewegung

# Safe Zones (Instagram-UI): kein Text hier
SAFE_TOP = 220
SAFE_BOTTOM = 420
SAFE_RIGHT = 140
TEXT_LEFT = 80                         # linker Rand fuer Text
TEXT_MAX_X = W - SAFE_RIGHT            # 940
TEXT_MAX_Y = H - SAFE_BOTTOM           # 1500

# --- Farben ------------------------------------------------------------------
STAGE = (0x0A, 0x08, 0x07)
CARDBOARD = (0xED, 0xE6, 0xD6)
BLOOD = (0xB3, 0x12, 0x1C)
CREAM = (0xF2, 0xEA, 0xDA)
AMBER = (0xFF, 0xA8, 0x4A)

# --- Musik -------------------------------------------------------------------
BPM = 90
BEAT = 60.0 / BPM                      # 0.6667 s
BAR = 4 * BEAT                         # 2.6667 s
EIGHTH = BEAT / 2
KEY = "d-moll"

# --- Szenen ------------------------------------------------------------------
SCENES = [
    ("S1", "Einschlag",  0.00,  1.20),
    ("S2", "Die Wand",   1.20,  4.00),
    ("S3", "Die Zahlen", 4.00,  6.60),
    ("S4", "Der Twist",  6.60,  9.20),
    ("S5", "Das Spiel",  9.20, 11.60),
    ("S6", "Marke",     11.60, 13.00),
    ("S7", "Endcard",   13.00, 15.00),
]

# --- S1 Einschlag ------------------------------------------------------------
THREAD_WHIP_START = 0.00               # Frame 0: Faden bereits in Bewegung
PIN_HIT = 0.15                         # Nadel schlaegt ein (Shake, Staub, Sub)
SHAKE_DUR = 0.35
HOOK_TEXT_IN = 0.10                    # "Einer von euch luegt." knallt rein
HOOK_TEXT_OUT = 1.25

# --- S2 Die Wand -------------------------------------------------------------
CASES = [
    # (Aktennr., Titel, Label, Motiv, Aufklapp-Zeit)
    ("001", "Geisterstunde auf Ravenmoor", "Spukschloss, 1986",   "castle", 1.40),
    ("002", "Der Kometenjahrgang",         "Weingut an der Mosel", "wine",   2.10),
    ("003", "Tod im Studio 7",             "Hollywood, 1934",     "studio", 2.80),
    ("004", "Die letzte Nacht in Fjell",   "Berghotel, 1928",     "hotel",  3.50),
]
FOLDER_OPEN_DUR = 0.28                 # Aufklapp-Animation
THREAD_JUMP_LEAD = 0.10                # Faden erreicht die Akte kurz vor dem Aufklappen
LABEL_DELAY = 0.10                     # Label startet nach dem Aufklappen
LABEL_CHAR = 2 / FPS                   # 1 Buchstabe alle 2 Frames
NINE_CASES_IN = 1.30                   # "9 Faelle."
NINE_CASES_OUT = 4.00

# --- S3 Die Zahlen -----------------------------------------------------------
NUMBERS = [
    ("5–12 Gäste.", 4.20),
    ("3 Runden.",   5.00),
    ("1 Täter.",    5.80),
]
NUMBERS_OUT = 6.55
BUILD_START = 4.00                     # Musik: Filter oeffnet sich

# --- S4 Der Twist ------------------------------------------------------------
CANDLE_OUT = 6.60                      # Kerze wird ausgepustet
BLACK_START = 400 / FPS                # 4 Frames komplett schwarz: 400-403
BLACK_FRAMES = 4
RELIGHT = 404 / FPS                    # Streichholz, Licht kommt zurueck
RELIGHT_DUR = 0.55
STAMP_HIT = 7.40                       # "UNGELOEST" knallt auf Akte #001
STAMP_CASE = 0
WHO_TEXT_IN = 7.52                     # "Wer war's?"
WHO_TEXT_OUT = 9.15

# --- S5 Das Spiel ------------------------------------------------------------
PHONE_IN = 9.20
PHONE_IN_DUR = 0.50
THREAD_INTO_PHONE = 9.55
PAGES = [
    ("Einladung",               9.90),
    ("Rollenhefte",            10.20),
    ("Heft der Spielleitung",  10.50),
    ("Auflösung im Umschlag",  10.80),
]
PAGE_FAN_DUR = 0.30
PLAY_WORDS = [
    ("Kaufen.",           9.62),
    ("Rollen verteilen.", 10.32),
    ("Ermitteln.",        11.02),
]
PLAY_TEXT_OUT = 11.58

# --- S6 Marke ----------------------------------------------------------------
THREAD_SHOOT_UP = 11.60
LOGO_HIT = 12.00                       # Faden unterstreicht das Logo
PRICE_IN = 12.25                       # "Sofort-Download · 8,99 €"
PRICE_TEXT = "Sofort-Download · 8,99 €"

# --- S7 Endcard --------------------------------------------------------------
ENDCARD_IN = 13.00
ENDCARD_TEXT = "murdernight.de · Link in Bio"
LOOP_RETRACT = 14.50                   # Faden zieht sich in Frame-0-Pose zurueck
ENDCARD_FADE_OUT = 14.55
ENDCARD_FADE_DUR = 0.30
TAIL_TONE = 13.00                      # tiefer Ton klingt aus

# --- Voice-over --------------------------------------------------------------
VO_LINES = [
    ("Einer von euch lügt.",                          0.20),
    ("Neun Fälle. Fünf bis zwölf Gäste. Ein Täter.",  2.00),
    ("Aber wer war's?",                               7.60),
    ("Murdernight. Das Krimidinner für zuhause.",     11.70),
]
VO_MUSIC_GAP_DB = 12.0                 # Musik mind. 12 dB unter VO

# --- Audio-Mastering ---------------------------------------------------------
SR = 48000
TARGET_LUFS = -14.0
TARGET_TP = -1.0
SFX_MIN_GAP = 0.060                    # Nicht-Hits nie naeher als 60 ms aneinander


# --- Faden: Reiseplan des Fadenkopfs (Ziel, Abflug, Ankunft) -------------------
# Knoten: anchor, hook, folder0..3, phone, logo_l, logo_r
THREAD_TRAVEL = [
    ("hook",    -0.06, PIN_HIT),
    ("folder0",  1.05, 1.30),
    ("folder1",  1.75, 2.00),
    ("folder2",  2.45, 2.70),
    ("folder3",  3.15, 3.40),
    ("phone",    9.30, THREAD_INTO_PHONE),
    ("logo_l",  THREAD_SHOOT_UP, 11.90),
    ("logo_r",  11.90, LOGO_HIT),
]
THREAD_WHIP_SPAN = (-0.50, 0.60)       # Wellenbewegung der Peitsche

# --- Kamera-Keyframes (Zeit, x, y, Zoom, Drehung Grad, Halt) ------------------
CAMERA_KEYS = [
    (0.00,  1300, 1330, 1.30,  0.0, True),
    (1.20,  1330, 1650, 1.15, -0.4, False),
    (1.55,  1450, 2650, 0.90, -0.5, False),
    (2.30,  1458, 2780, 0.90, -0.3, False),
    (3.00,  1458, 3150, 0.90,  0.2, False),
    (3.70,  1458, 3190, 0.90,  0.3, False),
    (6.55,  1458, 3190, 0.88, -0.1, False),
    (7.30,  1458, 3185, 0.91, -0.4, False),
    (9.15,  1456, 3180, 0.92, -0.5, True),
    (9.75,  1400, 4500, 1.00,  0.6, False),
    (11.58, 1400, 4480, 1.04,  0.4, True),
    (11.80, 1420, 2600, 0.36,  0.0, False),
    (12.00, 1430,  640, 0.95, -0.3, True),
    (13.00, 1430,  630, 0.97, -0.2, False),
    (14.50, 1428,  620, 1.00,  0.0, True),
]
SHAKES = [  # (Zeit, Staerke px)
    (PIN_HIT, 16.0), (4.20, 6.0), (5.00, 6.0), (5.80, 8.0), (STAMP_HIT, 13.0), (LOGO_HIT, 9.0),
]
S3_DIM = (4.05, 6.55)                  # Szene abdunkeln fuer die Zahlen


def f(t):
    """Sekunden -> Frame-Nummer (60 fps)."""
    return int(round(t * FPS))
