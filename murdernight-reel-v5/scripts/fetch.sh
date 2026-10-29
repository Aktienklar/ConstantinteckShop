#!/usr/bin/env bash
# fetch.sh <url> <ziel> – lädt eine signierte ElevenLabs-URL herunter
set -euo pipefail
curl -sSfL --retry 3 -o "$2" "$1"
file "$2"
