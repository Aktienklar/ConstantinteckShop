# Murdernight · Reel „Einer von euch lügt." · Brief v1

**Format:** 1080×1920 · 60 fps · 900 Frames (13,00 s Inhalt + 2,00 s Endcard) · ein Shot, nahtloser Loop
**Quelle aller Zeiten:** `src/timeline.py` (Frame = Sekunde × 60). Diese Tabelle ist daraus abgeleitet.

---

## 1. Leitidee: Der rote Faden

Ein einziger roter Faden (Blutrot `#B3121C`) zieht sich durch das ganze Reel. Er ist immer derselbe Faden – gezeichnet von genau einer Funktion `draw_thread()`:

- 7 px dick, Kordel-Struktur (zwei leicht versetzte Litzen), schmaler heller Glanzstreif oben
- Durchhang zwischen zwei Nadeln physikalisch als Kettenlinie, Durchhang skaliert mit Spannweite und „Spannung“ (beim Peitschen fast gerade, in Ruhe weich)
- Weicher Kontaktschatten auf der Wand (versetzt, geblurrt)
- Heller Kopf (die „Nadelspitze“ des laufenden Fadens) mit Glow; bei Bewegung Motion Blur über 5 Sub-Frame-Samples
- Stecknadeln: roter Glaskopf mit Spekularpunkt, kurzer Schatten

Der Faden ist die Schnittersatz-Mechanik: Statt zu schneiden, folgt die Kamera dem Kopf des Fadens von Station zu Station.

## 2. Welt & Kamera (2.5D)

Eine große Ermittlerwand (Kork, ca. 2400 × 4400 Welt-px) als Hauptebene. Ebenen nach Tiefe:

| z | Ebene | DoF |
|---|---|---|
| 0.0 | Korkwand, Notizzettel, Fotos-Silhouetten (unscharf, Hintergrund-Dressing) | leicht unscharf außerhalb Fokusbereich |
| 0.1 | Fallakten, Nadeln, Faden, Stempel, Logo | Fokusebene |
| 0.5 | Handy (gleitet über die Wand) | scharf in S5, sonst nicht im Bild |
| 1.0 | Staubpartikel, Rauch des Dochts (S4), Kerzenflamme unten links (Vordergrund) | stark unscharf (Bokeh) |
| HUD | Headlines, Labels — im Bildraum, nicht mit der Kamera | scharf |

Kamera: Position (x, y), Zoom, Rotation (max. ±1,2°). Immer ein sanfter Drift (Summe zweier langsamer Sinus, Periode = 15 s, damit der Loop schließt). Die Kamerabahn ist ein geschlossener Spline: Pose bei Frame 899 → Pose bei Frame 0.

Fahrplan (grob):
- S1: nah (Zoom 1,35) am Einschlagpunkt oben auf der Wand
- S2: Fahrt nach unten/seitlich über die vier Akten (2×2-Raster), Zoom 1,0
- S3: Kamera zieht leicht zurück (0,9), Akten werden zur Bühne der Zahlen
- S4: Stillstand + sehr langsamer Push auf Akte #001 (Stempel)
- S5: Handy gleitet von rechts unten über die Wand in die Bildmitte
- S6: Kamera folgt dem Faden nach oben zum Logo, das auf der Wand gepinnt ist
- S7: Endcard am Logo; ab Frame 870 gleitet die Kamera zurück in die Frame-0-Pose

## 3. Look

- Bühne `#0A0807`, Korkwand dunkel (Rauschen + Zellstruktur, warm-braun, tief abgedunkelt)
- Kerzenlicht: Amber-Glow unten links, „atmet“ (0,25 Hz) + Flackern (gefiltertes Rauschen, deterministisch per Seed) — moduliert die Helligkeit der gesamten Szene ±6 %
- Fallakten: Karton `#EDE6D6`, Papierfaser-Rauschen, Kantenabdunklung (Wölbung), weicher Schlagschatten, Büroklammer (Metallverlauf), Aktenreiter „FALLAKTE #00x“, Titel in Special Elite, Cover als eingeklebtes Foto mit weißem Rand
- Covermotive (nur Formen + Licht, keine Figuren): Schlosssilhouette im Nebel unter Vollmond · Weinflasche unter Komet mit Schweif · Scheinwerferkegel vor Studiotor „7“ · beleuchtetes Berghotel im Schnee mit fallenden Flocken
- Stempel „UNGELÖST“: Blutrot, doppelter Rahmen, Druckfarbe ungleichmäßig (Rausch-Maske), −8° gedreht
- Logo: „Murder“ cremeweiß + „night“ Rot, Playfair Display Bold, Prägedruck (Highlight oben links, Schatten unten rechts)
- Post: Filmkorn (pro Frame neu, deterministisch), Vignette, leichte Bloom auf hellen Stellen
- Typo: Headlines Playfair Display Bold 120–150 px · Labels Special Elite 48–52 px · Mini-Labels (Aktenreiter) Inter/Special Elite
- Akzent-Regel: Pro Zeile höchstens ein rotes Wort (z. B. „lügt.“, „Täter.“, „war's?“, „Ermitteln.“)
- Keine Gewalt, kein Blut, keine Gesichter

**Safe Zones:** Text nur in x 80–940, y 220–1500. Wird beim Rendern per Assert geprüft (jede Textbox).

## 4. Beat Sheet framegenau

| Szene | Frames | Zeit | Bild | Text | Sound |
|---|---|---|---|---|---|
| **S1** Einschlag | 0–71 | 0,00–1,20 | Frame 0: Faden peitscht bereits diagonal ins Bild (Motion Blur). F 9: Nadel schlägt ein → Kamera-Shake (abklingend, 21 Frames), Staubwolke (Partikel). | F 6: „Einer von euch **lügt.**“ (Scale-Slam 1,25 → 1,0 in 8 Frames) bis F 75 | F 0 Peitsche · F 9 Nadel-Einschlag + Sub-Hit (Big Hit) · VO F 12 |
| **S2** Die Wand | 72–239 | 1,20–4,00 | Kamera gleitet über die Wand. Faden springt Akte → Akte und pinnt jeweils oben an. Akten klappen auf: F 84 / F 126 / F 168 / F 210 (je 17 Frames). | F 78: „**9** Fälle.“ (groß, bis F 240) · Labels getippt, 1 Buchstabe / 2 Frames: F 90 „Spukschloss, 1986“ · F 132 „Weingut an der Mosel“ · F 174 „Hollywood, 1934“ · F 216 „Berghotel, 1928“ | Papier-Flip je Akte · Schreibmaschinen-Tick je Buchstabe · Faden-Zupfen je Sprung · VO F 120 |
| **S3** Die Zahlen | 240–395 | 4,00–6,60 | Kamera zieht etwas zurück; jede Zahl kommt mit kleinem Kamera-Kick und Licht-Puls. | F 252 „5–12 Gäste.“ · F 300 „3 Runden.“ · F 348 „1 **Täter.**“ (je Slam, alte Zeile rutscht hoch und verblasst) | Hit je Zahl (Big Hits) · Musik: Filter öffnet ab F 240 |
| **S4** Der Twist | 396–551 | 6,60–9,20 | F 396 Kerze wird ausgepustet (Flamme reißt, Rauchfaden), Licht fällt in 4 Frames ab. **F 400–403 komplett schwarz (4 Frames).** F 404 Streichholz – Licht kehrt zurück (bis F 437). F 444 Stempel „UNGELÖST“ knallt auf Akte #001 (Squash, Shake, Farb-Spritzer-frei). | F 451: „Wer **war's?**“ bis F 549 — wird nie aufgelöst | F 396 Auspusten · F 396–443 Musik-Stille, nur Atemzug · F 404 Streichholz · F 444 Stinger + Stempel-Knall (Big Hit) · VO F 456 |
| **S5** Das Spiel | 552–695 | 9,20–11,60 | F 552–581 Handy gleitet von unten rechts ins Bild (leichte Neigung, Glas-Reflex). F 573 Faden läuft ins Handy. PDF-Seiten fächern aus dem Display: F 594 Einladung · F 612 Rollenhefte · F 630 Heft der Spielleitung · F 648 Auflösung im Umschlag (versiegelt). | F 577 „Kaufen.“ · F 619 „Rollen verteilen.“ · F 661 „**Ermitteln.**“ (gestapelt, bis F 695) | Handy-Whoosh · Papierrascheln je Seite · Musik: warme Akkorde ab F 552 |
| **S6** Marke | 696–779 | 11,60–13,00 | F 696 Faden schießt nach oben, Kamera folgt (Motion Blur). F 720 Faden spannt sich unter das Logo – Unterstreichung, Logo-Hit mit Licht-Flash. | Logo „Murder**night**“ ab F 712 · F 735 „Sofort-Download · 8,99 €“ | F 696 Whoosh · F 720 Logo-Hit (Big Hit) · VO F 702 |
| **S7** Endcard | 780–899 | 13,00–15,00 | Logo bleibt, Kerze atmet, Drift. F 870 Faden löst sich vom Logo und zieht sich in exakt die Pose von Frame 0 zurück; Kamera gleitet in Frame-0-Pose. | F 780 „murdernight.de · Link in Bio“ · Endcard-Text fadet F 873–891 aus | F 780 tiefer Ton, klingt aus · F 870 Faden-Rückzug (leiser Reverse-Whip, der in die Peitsche von F 0 übergeht) |

**Loop:** Frame 899 → Frame 0: Kamera-Pose, Faden-Pose, Lichtphase (Atmen/Drift mit 15-s-Periode), Korn-Seed-unabhängig. Text ist bei F 0 und F 899 nicht sichtbar. Die Peitsche bei F 0 beginnt im Audio schon als Reverse-Whip am Ende, damit auch der Ton loopt. Prüfung: Differenzbild F 0 vs. F 899.

**Retention-Check:** Neue visuelle Information spätestens alle 0,7 s (Einschlag 0,15 → Text 0,10 → „9 Fälle“ 1,30 → Akten 1,40/2,10/2,80/3,50 → Zahlen 4,20/5,00/5,80 → Schwarz 6,67 → Stempel 7,40 → „Wer war's?“ 7,52 → Handy 9,20 → Seiten 9,90–10,80 → Logo 12,00 → Preis 12,25 → Endcard 13,00 → Rückzug 14,50).

## 5. Musik (synthetisiert, 90 BPM, d-Moll)

- Takt = 2,667 s, Achtel = 0,333 s
- **0,00:** Pizzicato (Karplus-Strong, d-Moll-Arpeggio D–F–A–C#), Drone auf D1/A1 (Sägezahn + Tiefpass), Uhr-Ticken auf jeder Achtel
- **4,00:** Spannungsaufbau – Tiefpass öffnet von 400 → 3500 Hz, Puls von Achteln auf Sechzehntel, Riser
- **6,60:** totale Stille (Musik hart weg), nur ein Atemzug (gefiltertes Rauschen)
- **7,40:** Stinger (Cluster D-Es-A + Sub-Boom + Hall)
- **9,20:** warme, edle Akkorde (Dm9 → Bbmaj7 → Gm9 → A7sus), weiche Pads + Pizz.
- **13,00:** ein tiefer D-Ton (Cello-artig), klingt unter der Endcard aus und läuft in den Loop-Anfang
- Sidechain-Ducking: Musik während VO so abgesenkt, dass sie mind. 12 dB unter der Stimme liegt (gemessen per RMS über die VO-Zeilen)

## 6. SFX (alle synthetisiert)

Peitsche (F 0), Nadel-Einschlag + Sub (F 9), Faden-Zupfen je Sprung, Papier-Flip je Akte (4×), Schreibmaschinen-Tick je Label-Buchstabe, Hit je Zahl (3×), Kerze auspusten (F 396), Atemzug, Streichholz (F 404), Stempel-Knall (F 444), Handy-Whoosh, Papierrascheln je Seite (4×), Whoosh nach oben, Logo-Hit (F 720), tiefer Endton, Reverse-Whip (F 870).

**Kollisionsregel:** Ein Scheduler sortiert alle SFX-Events. Big Hits (Nadel, Zahlen, Stempel, Logo) haben Vorrang; jedes andere Event, das näher als 60 ms an einem anderen liegt, wird minimal verschoben (Tick fällt ggf. weg). Das Log dazu landet im Build.

## 7. Voice-over (ElevenLabs – erreichbar ✅)

`GET /v1/voices` antwortet mit 200. Plan für Phase 3:
- Stimme: **Brian** („Deep, Resonant“) als Favorit, **George** („Warm Storyteller“) als Gegenprobe; Modell `eleven_multilingual_v2`, Deutsch, normales Tempo (keine Beschleunigung)
- Ein Call mit dem ganzen Skript (Zeilen getrennt durch kurze Pausen), 2 Takes; Auswahl nach Wortgenauigkeit (Timestamps-Endpoint), Zeilen per Stille-Erkennung geschnitten und an Startzeit gelegt
- Zeilen: „Einer von euch lügt.“ (0,20 / F 12) · „Neun Fälle. Fünf bis zwölf Gäste. Ein Täter.“ (2,00 / F 120) · „Aber wer war's?“ (7,60 / F 456) · „Murdernight. Das Krimidinner für zuhause.“ (11,70 / F 702)
- Falls eine Zeile länger ist als ihr Fenster, wird sie **nicht** beschleunigt, sondern die Folgezeile startet frühestens 0,15 s nach Ende – gemeldet in der Korrekturrunde

## 8. Mastering & Export

- Stems: Musik, SFX, VO (WAV 48 kHz, nur in `build/`)
- Master: −14 LUFS integriert, −1 dBTP (pyloudnorm + True-Peak-Limiter mit 4× Oversampling), Kontrolle mit ffmpeg `loudnorm`
- Video: `libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -movflags +faststart`, Audio AAC 48 kHz 256 kbit/s
- Zweite Version ohne Musik (SFX + VO), separat auf −14 LUFS gemastert

## 9. Pipeline

```
src/timeline.py   alle Zeiten
src/assets_gen.py Wand, Akten, Cover, Stempel, Logo, Handy, Seiten (einmalig, gecacht in build/)
src/thread.py     draw_thread() + Nadeln
src/render.py     2.5D-Renderer, Kamera, DoF, Motion Blur, Post; multiprocessing → build/frames/*.png
src/audio.py      Musik, SFX, VO-Schnitt, Mix, Mastering
src/make.py       styleframes | preview | final | check
```

## 10. Offene Annahmen

- Kein `assets/`-Ordner vorhanden → alles wird im Code gestaltet.
- „9 Fälle.“ erscheint bei 1,30 (kurz vor der ersten Akte), damit die Aussage steht, bevor die Akten aufklappen.
- Der Stempel landet auf Akte #001 (Ravenmoor, aktuelles Halloween-Spezial).

---

## 11. Änderungen aus Phase 2 (Styleframes)

- **Etiketten sitzen jetzt auf dem Innenblatt der Akte** (getippter Papierstreifen unter dem Foto) statt unter der Akte – sonst kollidierten sie mit der zweiten Reihe und ragten in die UI-Zonen. Special Elite 50 Welt-px → 45 px auf dem Handy.
- **Kamera S2–S4** bleibt bei Zoom 0,88–0,92 auf dem 2×2-Raster, so dass alle getippten Etiketten in x 80–940 / y 220–1500 liegen (Renderer prüft das pro Frame und meldet Verstöße).
- Deckel öffnet auf 108° (statt 118°), damit er die Nachbarakte nicht verdeckt.
- Wand reicht oberhalb des Logos weiter (kein schwarzer Rand im Logo-Shot); Handy + PDF-Seiten liegen tiefer, damit „Kaufen. / Rollen verteilen. / Ermitteln.“ freie Fläche hat.
- Lesbarkeit: weicher dunkler Schatten hinter jeder Headline; in S3 wird die Szene um 65 % abgedunkelt.
- Beim Logo-Hit wechselt das Führungslicht von Amber zu Cremeweiß.

---

## 12. Korrekturrunde (Phase 4)

| # | Prüfung | Befund | Maßnahme |
|---|---|---|---|
| 1 | Loop F899 ↔ F0 | Mittlere Abweichung 6,4/255 (praktisch nur Filmkorn); Faden, Nadel und Kamera in identischer Pose; Ton: Naht < 0,001, letzte 20 ms stumm | – |
| 2 | Ruckler Kamera | S1→S2 war ein Reißschwenk (1,20→1,55 s) | Fahrt beginnt jetzt bei 1,00 s, endet 1,70 s; max. Bilddifferenz 15,9 → 13,2 |
| 3 | Ruckler Kamera | Hochschießen zum Logo startete aus dem Stand (Beschl. 165 px/Frame²) | Zwischen-Key bei 11,68 s → 105 px/Frame²; Rest ist gewollter Reißschwenk mit 5-fach-Motion-Blur |
| 4 | Licht-Pop | F404 sprang nach dem Schwarz von 4,8 auf 41,6 (Helligkeit/255) | Streichholz flammt über 4 Frames auf: 4,8 → 17 → 18 → 22 → 30 |
| 5 | Audio-Pops | 2 Klicks (7,087 s / 7,394 s) im Streichholz-Knistern (Einzel-Sample-Impulse) | Knistern aus weichen 3-ms-Körnern; Scan danach: 0 Klicks |
| 6 | Lesbarkeit S3 | „1 Täter.“ lag auf dem Etikett „Hollywood, 1934“ | Gemeinsame dunkle Fläche hinter dem Zahlen-Stapel + flacherer Schatten hinter allen Headlines |
| 7 | Safe Zones | HUD-Text: 0 Verstöße. Etiketten: 68 Meldungen, alle während Kamerafahrten (9,3–9,9 s Etikett 4 als ≤ 15-px-Streifen am oberen Rand; 11,6–11,9 s Reißschwenk bei Zoom 0,36 → Text 18 px, unlesbar) | S5-Kamera 40 px nach rechts versetzt (rechter Rand max. 965 → während Fahrt); kein stehender Text in UI-Zonen |
| 8 | Abgeschnittener Text | Kein stehender Text angeschnitten; nur Wandobjekte, die bei Fahrten aus dem Bild laufen | – |
| 9 | 60-ms-Regel | Nicht-Hits ≥ 60 ms auseinander; 22 von 67 Tipp-Ticks entfallen dort, wo Faden-Sounds liegen | – |
| 10 | Lautheit | Nach AAC-Kodierung lag der True Peak zunächst bei +1,1 dBTP (WAV war −1,2): Überschwinger an den steilen Tipp-Ticks | Ticks mit 0,6 ms Anstieg, Master oberhalb 16 kHz gefiltert, Mastering-Schleife misst die kodierte AAC-Datei mit ffmpeg loudnorm und regelt nach. Final: −13,95 LUFS / −1,06 dBTP (mit Musik), −14,01 LUFS / −1,21 dBTP (ohne Musik) |

---

## 13. Nachbesserung: Sprachverständlichkeit

Feedback: Soundeffekte teilweise so laut, dass die Stimme nicht zu verstehen war.

**Messung vorher** (Sprachband 300–4000 Hz, nur Momente mit Stimme): SFX lagen in 41 % der Zeit weniger als 6 dB unter der Stimme, an einzelnen Stellen bis zu 30 dB darüber (1,05–1,65 s Faden-Zip/Ticks/Flip, 2,05–4,05 s Flips/Ticks, 5,0 und 5,8 s Zahlen-Hits, 11,75–12,65 s Logo-Hit). Auch die Musik hatte Spitzen unter „Ein Täter.“ (Spannungsaufbau) und „für zuhause“ (tiefer Ton).

**Lösung:** Dynamisches Sidechain-Ducking im Sprachband für SFX und Musik (`band_duck()` in `src/audio.py`):
- Referenz ist die Sprach-Hüllkurve über 150 ms, damit es zwischen Silben nicht pumpt; 30 ms Vorausschau, 150 ms Rückkehr.
- SFX und Musik liegen im Sprachband mindestens 12 dB unter der Stimme (`VO_SFX_GAP_DB`, `VO_MUSIC_GAP_DB`).
- Tiefen unter 150 Hz (Wumms der Hits) werden nur halb so stark und höchstens um 12 dB abgesenkt.

**Messung nachher:** SFX in 99,3 % der Sprechzeit ≥ 12 dB unter der Stimme, nie näher als 7,8 dB; Musik überall ≥ 12,8 dB darunter. Keine Klicks.

**Finale Lautheit (ffmpeg loudnorm, fertige MP4):** mit Musik −14,06 LUFS / −1,27 dBTP; ohne Musik −14,00 LUFS / −1,05 dBTP.
