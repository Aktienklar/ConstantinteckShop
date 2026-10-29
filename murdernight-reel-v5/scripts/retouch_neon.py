"""Entfernt Fantasie-Schrift (Neon) aus einem Styleframe per OpenCV-Inpainting.
Aufruf: python retouch_neon.py in.png out.png x0 y0 x1 y1 [x0 y0 x1 y1 ...]
Maskiert in den Boxen helle, gesättigte Rot-Pixel (Neonröhren) samt Glow."""
import sys
import cv2
import numpy as np

src, dst, *coords = sys.argv[1:]
img = cv2.imread(src)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
red = (((hsv[..., 0] < 12) | (hsv[..., 0] > 168)) & (hsv[..., 1] > 60) & (hsv[..., 2] > 150)) | \
      ((hsv[..., 1] < 70) & (hsv[..., 2] > 225))  # weiß-heiße Röhrenkerne
mask = np.zeros(img.shape[:2], np.uint8)
for i in range(0, len(coords), 4):
    x0, y0, x1, y1 = map(int, coords[i:i + 4])
    mask[y0:y1, x0:x1] = red[y0:y1, x0:x1].astype(np.uint8) * 255
mask = cv2.dilate(mask, np.ones((9, 9), np.uint8), iterations=2)
out = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
# weicher Glow-Ersatz, damit die Stelle nicht stumpf wirkt
blur = cv2.GaussianBlur(out, (0, 0), 14)
m = cv2.GaussianBlur(mask, (0, 0), 10).astype(np.float32)[..., None] / 255
out = (out * (1 - m) + blur * m).astype(np.uint8)
cv2.imwrite(dst, out)
cv2.imwrite(dst.replace('.png', '_mask.png'), mask)
