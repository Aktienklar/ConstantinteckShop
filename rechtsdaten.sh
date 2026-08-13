#!/bin/bash
#
# RECHTSDATEN EINSETZEN
#
# Liest rechtsdaten.conf und schreibt die Werte in alle HTML-Dateien:
# Impressum, AGB, Datenschutz, Widerrufsbelehrung und die Fußzeile jeder
# einzelnen Seite. Danach verschwinden die orangen Warnkästen.
#
# Einmal auszuführen, wenn die Daten feststehen:
#
#     ./rechtsdaten.sh
#
# Das Skript schreibt die Dateien direkt um – es gibt keinen Build-Schritt,
# der aus einer Vorlage etwas erzeugt. Deshalb prüft es vorher, ob das
# Arbeitsverzeichnis sauber ist: Nur dann lässt sich alles mit einem
# "git checkout ." wieder zurücknehmen.

set -euo pipefail

cd "$(dirname "$0")"

CONF="rechtsdaten.conf"

if [ ! -f "$CONF" ]; then
  echo "Fehler: $CONF nicht gefunden." >&2
  exit 1
fi

# shellcheck source=rechtsdaten.conf
source "$CONF"

# --- Prüfen, bevor irgendetwas angefasst wird -----------------------------

# Als Zeichenkette statt als Array: macOS liefert bash 3.2 aus, und dort
# stolpert "set -u" über ein leeres Array.
fehlend=""
for feld in NAME STRASSE PLZ_ORT EMAIL TELEFON VERSANDDIENSTLEISTER AUFSICHTSBEHOERDE; do
  # Indirekte Expansion: ${!feld} ist der Wert der Variablen, deren Name in
  # $feld steht.
  if [ -z "${!feld:-}" ]; then
    fehlend="$fehlend  - $feld"$'\n'
  fi
done

if [ -n "$fehlend" ]; then
  echo "Diese Felder in $CONF sind noch leer:" >&2
  printf '%s' "$fehlend" >&2
  echo >&2
  echo "Ohne sie bleiben die Rechtsseiten unvollständig. Nichts geändert." >&2
  exit 1
fi

# .example ist eine reservierte Endung – solche Adressen existieren nie.
case "$EMAIL" in
  *.example|*@example.*|*.invalid)
    echo "Fehler: EMAIL='$EMAIL' ist keine echte Adresse." >&2
    echo "Mails an .example/.invalid werden nirgends zugestellt." >&2
    exit 1
    ;;
esac

case "$EMAIL" in
  *@*.*) ;;
  *)
    echo "Fehler: EMAIL='$EMAIL' sieht nicht wie eine E-Mail-Adresse aus." >&2
    exit 1
    ;;
esac

# Leere Rücksendeadresse = identisch mit der Anbieteranschrift.
if [ -z "${RUECKSENDEADRESSE:-}" ]; then
  RUECKSENDEADRESSE="$NAME, $STRASSE, $PLZ_ORT"
fi

if [ -n "$(git status --porcelain 2>/dev/null || true)" ]; then
  echo "Warnung: Es liegen uncommittete Änderungen im Arbeitsverzeichnis." >&2
  echo "Dieses Skript schreibt Dateien direkt um. Commite zuerst, damit du" >&2
  echo "die Ersetzung notfalls mit 'git checkout .' zurücknehmen kannst." >&2
  echo >&2
  read -r -p "Trotzdem fortfahren? [j/N] " antwort
  case "$antwort" in
    j|J|y|Y) ;;
    *) echo "Abgebrochen."; exit 1 ;;
  esac
fi

# --- Ersetzen -------------------------------------------------------------

# Über die Umgebung an perl übergeben: Die Werte enthalten Umlaute, Kommas
# und womöglich Zeichen, die ein sed-Ausdruck als Trennzeichen missverstehen
# würde. In $ENV{} ist ein Wert immer nur ein Wert.
export FILL_NAME="$NAME"
export FILL_STRASSE="$STRASSE"
export FILL_PLZ_ORT="$PLZ_ORT"
export FILL_EMAIL="$EMAIL"
export FILL_TELEFON="$TELEFON"
export FILL_RUECKSENDE="$RUECKSENDEADRESSE"
export FILL_VERSAND="$VERSANDDIENSTLEISTER"
export FILL_BEHOERDE="$AUFSICHTSBEHOERDE"

dateien=()
while IFS= read -r datei; do
  dateien+=("$datei")
done < <(
  find . -name "*.html" \
    -not -path "./node_modules/*" \
    -not -path "./worker/*" \
    -not -path "./.git/*" | sort
)

echo "Bearbeite ${#dateien[@]} HTML-Dateien ..."

# Bewusst ohne -CSD: So arbeitet perl auf rohen Bytes. Die Umlaute im
# Suchmuster und die in den Dateien sind dann beide UTF-8-Bytes und passen
# zusammen. Mit Zeichen-Semantik müsste zusätzlich das Skript selbst
# dekodiert werden – ein Fehler, der erst bei "Straße" auffiele.
#
# Die Platzhalter tragen ihren <span class="fill">-Rahmen mit: Nach dem
# Ersetzen soll dort normaler Fließtext stehen und nicht weiter orange
# leuchten. Der Block zwischen den AUSFUELLEN-Markierungen ist der
# Warnkasten – er fällt komplett weg.
perl -0777 -pi -e '
  s{<span class="fill">\[Vor- und Nachname\]</span>}{$ENV{FILL_NAME}}g;
  s{<span class="fill">\[Straße und Hausnummer\]</span>}{$ENV{FILL_STRASSE}}g;
  s{<span class="fill">\[PLZ und Ort\]</span>}{$ENV{FILL_PLZ_ORT}}g;
  s{<span class="fill">\[Telefonnummer\]</span>}{$ENV{FILL_TELEFON}}g;
  s{<span class="fill">\[Rücksendeadresse\]</span>}{$ENV{FILL_RUECKSENDE}}g;
  s{<span class="fill">\[Versanddienstleister\]</span>}{$ENV{FILL_VERSAND}}g;
  s{<span class="fill">\[Aufsichtsbehörde\]</span>}{$ENV{FILL_BEHOERDE}}g;
  s{hello\@constantinteck\.example}{$ENV{FILL_EMAIL}}g;
  s{[ \t]*<!-- AUSFUELLEN:START -->.*?<!-- AUSFUELLEN:ENDE -->\n}{}gs;
' "${dateien[@]}"

# --- Nachkontrolle --------------------------------------------------------

rest=$(grep -rl 'class="fill"\|constantinteck\.example\|AUSFUELLEN:' \
  --include="*.html" . 2>/dev/null || true)

echo
if [ -n "$rest" ]; then
  echo "Achtung: In diesen Dateien stehen noch Platzhalter:" >&2
  echo "$rest" | sed 's/^/  /' >&2
  echo >&2
  echo "Das sollte nicht passieren – bitte nachsehen, bevor du deployst." >&2
  exit 1
fi

echo "Fertig. Alle Platzhalter ersetzt, Warnkästen entfernt."
echo
echo "Noch zu tun:"
echo "  1. Kontrollieren:   git diff"
echo "  2. Veröffentlichen: ./deploy.sh"
echo "  3. In Stripe unter 'Public details' die AGB-Adresse hinterlegen:"
echo "     https://constantinteck.com/terms.html"
echo "     Danach in worker/wrangler.toml TOS_CONSENT auf \"true\" setzen"
echo "     und aus worker/ heraus 'npx wrangler deploy' ausführen."
