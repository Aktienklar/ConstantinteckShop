#!/bin/bash
# Prüft den Build und pusht erst dann. Aufruf:  ./deploy.sh "Neues Rezept ergänzt"
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
echo "→ Build wird geprüft ..."
if ! npm run build > /tmp/constantinteck-build.log 2>&1; then
  echo
  echo "BUILD FEHLGESCHLAGEN – es wird nichts gepusht."
  echo "Die letzten Zeilen des Fehlers:"
  echo
  tail -25 /tmp/constantinteck-build.log
  exit 1
fi
echo "  Build ok."
echo
echo "→ Wird gepusht ..."
git add -A
git commit -q -m "$MSG"
git push -q
echo
echo "Fertig. Auf GitHub: $(git rev-parse --short HEAD) – $MSG"
