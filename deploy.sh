#!/bin/bash
# Prüft die Links und pusht erst dann. Aufruf:  ./deploy.sh "Neues Rezept ergänzt"
set -e
cd "$(dirname "$0")"

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "Fehlt: Beschreibung der Änderung."
  echo "Beispiel:  ./deploy.sh \"Neues Rezept ergänzt\""
  exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "Keine Änderungen zum Pushen."
  exit 0
fi

echo "→ Geänderte Dateien:"
git status -s
echo

# Kopfbereich (Titel, Beschreibung, Vorschau), sitemap.xml und die
# AVIF-Fassungen der Fotos werden aus den Seiten erzeugt, nicht von Hand
# gepflegt – siehe tools/seo.py und tools/images.py.
echo "→ SEO-Kopf, Sitemap und Bilder werden aktualisiert ..."
python3 tools/images.py
python3 tools/seo.py
echo

# Sonst gibt es nichts zu bauen. Der eine Fehler, der bei handgeschriebenem HTML
# regelmäßig passiert, ist ein Link auf eine Datei, die es nicht (mehr) gibt –
# genau darauf prüft dieser Schritt.
echo "→ Links werden geprüft ..."
python3 - <<'PY'
import os, re, sys, urllib.parse

pages = []
for dirpath, dirnames, filenames in os.walk("."):
    # node_modules gehört nicht ins Repository und wird nie veröffentlicht –
    # die HTML-Dateien darin sind fremder Code und dürfen die Prüfung nicht
    # zum Scheitern bringen.
    dirnames[:] = [d for d in dirnames if d not in (".git", ".github", ".claude", "node_modules")]
    pages += [os.path.join(dirpath, f) for f in filenames if f.endswith(".html")]

broken = []
for page in pages:
    html = open(page, encoding="utf-8").read()
    for _, value in re.findall(r'(href|src)="([^"]+)"', html):
        if value.startswith(("http://", "https://", "mailto:", "#", "data:")):
            continue
        target = urllib.parse.unquote(value.split("?")[0].split("#")[0])
        # Absolute Pfade (/assets/...) gelten ab dem Wurzelverzeichnis der Seite.
        base = "." if target.startswith("/") else os.path.dirname(page)
        if not os.path.exists(os.path.normpath(os.path.join(base, target.lstrip("/")))):
            broken.append("%s  ->  %s" % (page, value))

if broken:
    print("  %d kaputte Verweise:" % len(broken))
    for entry in broken[:20]:
        print("    " + entry)
    sys.exit(1)

print("  %d Seiten, alle Verweise in Ordnung." % len(pages))
PY

echo
echo "→ Wird gepusht ..."
git add -A
git commit -q -m "$MSG"
git push -q
echo
echo "Fertig. Auf GitHub: $(git rev-parse --short HEAD) – $MSG"
