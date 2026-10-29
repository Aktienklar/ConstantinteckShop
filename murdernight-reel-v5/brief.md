# Murdernight · Reel v5 · „Club → Dinner → Zuhause"

Status: **Phase 4 – Final geliefert**

## Änderungen seit Phase 1 (freigegeben)

1. **Budget (Starter, 30.000 Credits)** – Die ElevenLabs-Schätzung ergab für den ursprünglichen Plan ca. 95.000 Credits. Freigegeben wurde die Variante „Bewegung zuerst“:
   - Bilder mit **Nano Banana 2** (`gemini-3.1-flash-image`), je 1 Take.
   - Startbilder für Videos in 1K (Veo rendert ohnehin in 1080p), Standbild-Shots 5a–c und 6 in 2K.
   - Video mit **Veo 3.1 Fast** (`veo-3.1-fast-generate-001`), 1080p, 4 s, ohne Ton, Negativ-Prompt möglich.
   - Gemessene Preise: Bild 1K mit Referenz 609–812 · Bild 2K mit Referenz 918–1.224 · Veo 3.1 Fast 4 s = 2.424 · Veo 3.1 voll 4 s = 4.848 · Veo 3.1 Lite 4 s = 1.212 · Kling 3 Pro 3 s = 2.036.
2. **Die Tat wandert ins Dinner** – ElevenLabs hat Shot 1 in der ursprünglichen Fassung als ToS-Verstoß blockiert („Ampulle ins Glas einer Frau im Club“ = K.O.-Tropfen). Freigegebene Lösung:
   - Im Club steckt eine Hand im Lederhandschuh nur eine **versiegelte Ampulle in die Manteltasche**.
   - Die Tat passiert beim Dinner: Die Ampulle wird über der **gemeinsamen Dekantier-Karaffe** aufgebrochen, ein klassisches Agatha-Christie-Motiv. Shot 4 zeigt die Karaffe im Vordergrund und dahinter die Erbin beim Toast.
   - SFX: Ampulle knackt und Tropfen fallen jetzt bei ca. 5,2–5,7 s statt 0,2–0,7 s. Bei 0,2 s kommt stattdessen ein Glas-Glint mit Bass-Drop.
3. **Retuschen (lokal, OpenCV, 0 Credits)**:
   - 01: Neonschild mit Fantasie-Buchstaben entfernt.
   - 02: Oben zugeschnitten (Neonschrift raus), dabei bleibt es 9:16.
   - 03: Neonschrift im Hintergrund in Dunst aufgelöst.
   - 09: Abgelöste, schwebende zweite Flamme entfernt.

Credits Phase 2: ca. 10.700 (Cast 612 · Shots 1–4 609 + 3×812 · 5a–c 3×1.224 · 6 918 · 7–9 3×609 · der blockierte Versuch 609, falls berechnet).
Rest ca. 19.300 → 7 Clips mit Veo Fast würden 16.968 kosten, damit bleiben nur ca. 2.300 für den Ton. Empfehlung: **Shot 9 nicht als Video**, sondern aus dem Standbild in der Post animieren. Damit bleiben ca. 4.700 für Ton.

Freigegebene Styleframes: `out/styleframes/` (Übersicht: `_uebersicht.jpg`)

---

Status Phase 1: Brief
ElevenLabs-Flow: „Murdernight Reel v5" · `flow_id = Olkv1MRYelvPQoh10PoH`
https://elevenlabs.io/app/flows/Olkv1MRYelvPQoh10PoH

Format: 9:16 · 1080×1920 · 30 fps · 14,5 s · H.264 / AAC 48 kHz

---

## 1. Fakten (einzige Quelle für Text und VO)

- Marke: **Murdernight** (ein Wort), Website **murdernight.de**
- 9 Krimidinner-Fälle, verschiedene Genres, für 5 bis 12 Personen
- Je 8,99 €, Sofort-Download als PDF, Druck- oder Digitalversion (fürs Handy)
- 3 Runden Ermittlung, 1 Täter unter den Gästen
- Ablauf: Krimi aussuchen → herunterladen → Rollen verteilen → gemeinsam ermitteln

---

## 2. Modelle

| Aufgabe | Modell | Begründung |
|---|---|---|
| Cast-Sheet + Styleframes | **gemini-3-pro-image** (Nano Banana Pro), 9:16, 2K | Laut Guide stark bei Figuren-Konsistenz über mehrere Shots und beim Zusammensetzen mit Referenzbildern. Genau das brauchen wir, weil das Cast-Sheet an jedem Shot hängt. Die Stärke von GPT Image 2.5 (Text im Bild) nützt uns nichts, wir wollen ja gar keinen Text. |
| Image-to-Video | **veo-3.1-generate-001** (Veo 3.1), 9:16, 1080p, 4 s, `generate_audio: false` | Volle Qualitätsstufe mit hoher Prompt-Treue und Kamerasprache sowie Start-Frame-Steuerung. Für Glas, Flüssigkeit in Slow Motion und Menschenmengen ist es das realistischere Modell. Kling 3 Pro bleibt Plan B, weil es Negativ-Prompts gegen verformte Hände kann. ⚠️ siehe Blocker unten |
| Voice-over | **eleven_v3**, Sprache `de` | Audio-Tags für Pausen und Ton, kein Speed-Parameter, also auch kein Beschleunigen |
| Musik | **eleven_music_v2_5**, instrumental | wie vorgegeben |
| SFX | **eleven_text_to_sound_v2** | wie vorgegeben |

### ⚠️ Blocker für Phase 3
`creative_get_model_schema` für Veo 3.1 und Kling 3 Pro meldet: *„video generation needs a paid plan"*.
Bild, Sprache, Musik und SFX funktionieren mit dem aktuellen Plan. Für die Clips (Shots 1, 2, 3, 4, 7, 8, 9) brauchen wir vor Phase 3 einen bezahlten ElevenLabs-Plan.
Ausweichplan, falls kein Upgrade kommt: Alle Shots entstehen aus Styleframes mit 2.5D-Kamerabewegung, Parallaxe, Licht- und Partikel-Animation in Python. Das funktioniert, sieht aber deutlich weniger nach echtem Film aus, vor allem bei der Ampulle in Shot 1.

### Stimme
**Vincent Crowe – Dark & Haunting Tales** · `voice_id 18X2yBovneA0q06wd8E9`
Deutsche Muttersprache, Hochdeutsch, mittleres Alter, tief, warm und ruhig, langsames Tempo. Die Stimme ist ausdrücklich für Krimi und Thriller gemacht.
Alternative mit mehr „Seriosität" und weniger Grusel: **Günther Ferstl** (`Yuw6Yffvf55x8VEXbIGt`), sonor und souverän.

VO-Texte (eleven_v3):
1. `[deep voice] [slowly] Einer von euch … [pause] ist ein Mörder.` → Start 0,25 s, die Pause sitzt auf dem Schnitt bei 1,8 s (wird in der Post auf den Frame gesetzt)
2. `[whispers] Aber wer war's?` → Start 7,8 s
3. `[warmly] Murdernight. Das Krimidinner für zuhause.` → Start 12,9 s

---

## 3. Shotlist (final)

| # | Zeit | Welt | Bild | Text-Overlay (Post) | Quelle |
|---|---|---|---|---|---|
| 1 HOOK | 0,0–1,8 | Club | Erbin lacht, dreht sich weg, Haar im Gegenlicht. Vorne scharf das Champagnerglas, Hand im Lederhandschuh bricht eine Ampulle, 3 Tropfen, Hand weg | „Einer von **euch** …" (ab 0,15) | Video |
| 2 NICHTS BEMERKT | 1,8–3,4 | Club | Gegenschuss: Sie greift das Glas, die Bläschen steigen, eine Silhouette verschwindet in der Menge, Strobes | „… ist ein **Mörder**." | Video |
| 3 DER TOAST | 3,4–5,0 | Club | VIP-Nische: Anstoßen mit Gastgeberin, Notar, Partner, Whip-Pan nach rechts | – | Video |
| 4 MATCH-CUT | 5,0–6,2 | Dinner | Aus dem Whip-Pan: dieselbe Frau hebt das Weinglas an der Kerzentafel, Glas auf derselben Bildposition | „Einer an diesem **Tisch**." | Video (Ref: letztes Frame Shot 3) |
| 5 VERDÄCHTIGE | 6,2–7,7 | Dinner | 3 × 0,5 s Push-in: Gastgeberin · Notar (Finger) · Partner (Siegelring, Handschuh blitzt) | „Die **Gastgeberin**" · „Der **Notar**" · „Der **Partner**" (Inter-Labels) | 3 Standbilder + Post |
| 6 BLACKOUT | 7,7–8,6 | Dinner | Kerzen flackern und erlöschen → Schwarz, Glas zerspringt (nur Ton) | „Wer **war's**?" (im Schwarz) | Standbild + Post-Flackern |
| 7 LICHT AN | 8,6–11,0 | Zuhause | Modernes Esszimmer, 6 Freunde verkleidet, eine zeigt anklagend, einer hebt empört die Hände, Rollenhefte | „Euer Krimidinner. **Zuhause**." | Video |
| 8 DAS SPIEL | 11,0–12,8 | Zuhause | Top-Shot Push-in: Hände blättern in Heften, Smartphone leuchtet, Wein, Kerze | „9 Fälle · 5–12 Personen · **Sofort**-Download" | Video (+ optional Cover-Insert) |
| 9 MARKE | 12,8–14,5 | Zuhause → Schwarz | Kerze wird ausgeblasen, Rauch ins Schwarz | Logo „Murdernight" + „8,99 € · murdernight.de" (Inter) | Video |

Rot `#B3121C` = das fett markierte Wort pro Zeile. Alles andere Elfenbein `#F3EDE2`, Playfair Display Bold ≥ 110 px.
Safe Zone für Text: y 220–1500, x 0–940.

Cover-Insert (Shot 8): murdernight.de ist aus der Session erreichbar (HTTP 200), die Option ist also machbar.

---

## 4. Bild-Prompts (Englisch, gemini-3-pro-image, 9:16, 2K)

Gemeinsamer Abschluss jedes Prompts (**SUFFIX**):
> Photorealistic still from a high-end crime drama, shot on 35mm film with an anamorphic lens feel, shallow depth of field, fine natural film grain, real skin texture with pores, natural hands with five fingers. Fictional people only, no celebrities. No text, no letters, no logos, no signage, no writing anywhere in the image. Vertical 9:16 frame.

Figuren-Anker (wörtlich in jedem Prompt wiederverwendet):
- **THE HEIRESS**: a strikingly beautiful, confident woman in her late twenties with dark, glossy, wavy shoulder-length hair, an emerald-green silk slip dress, pearl drop earrings
- **THE HOSTESS**: an elegant woman around fifty with auburn hair in a sophisticated updo, a deep red velvet gown
- **THE NOTARY**: a distinguished older gentleman in his sixties with a neatly trimmed silver beard, classic black tuxedo with bow tie
- **THE PARTNER**: a handsome man in his mid-forties, dark hair, a dark bottle-green velvet dinner jacket, a heavy gold signet ring on his right little finger

### P0 · Cast-Sheet (Format 16:9, 2K – einziges Querformat)
> Create a professional casting reference sheet for a luxury crime drama, four fictional characters standing side by side against a seamless dark charcoal studio backdrop. For each character show a full-body pose and, above it, a tight head-and-shoulders portrait. From left to right: (1) THE HEIRESS … (2) THE HOSTESS … (3) THE NOTARY … (4) THE PARTNER … [Anker vollständig]. Soft key light from camera left, subtle rim light separating them from the dark background, neutral color, even exposure so faces, fabrics and jewelry read clearly. Editorial fashion-casting look. + SUFFIX

### P1 · Hook (Ref: Cast-Sheet → Identität Heiress)
> Using the attached reference: it provides the exact face, hair, emerald silk dress and pearl earrings of THE HEIRESS. Create a medium shot at a luxurious black-and-gold-veined marble bar in an upscale cocktail lounge at night. In the sharp foreground, a crystal champagne coupe filled with sparkling champagne sits on the marble. Above it, entering from the right edge of the frame, a hand in a tight black leather glove holds a tiny clear glass ampoule, its neck snapped open by the thumb, a single clear drop falling toward the glass. Behind, softly out of focus, THE HEIRESS laughs and turns away over her shoulder, her wavy dark hair swinging and backlit by deep red neon. Brass details, mirrored back bar, haze, round red and teal bokeh lights. Color: deep blacks, neon red and cool teal. + SUFFIX

### P2 · Nichts bemerkt (Ref: Cast-Sheet + Styleframe 1)
> Using the attached references: reference 1 provides THE HEIRESS's identity and wardrobe; reference 2 provides the bar, champagne coupe, lighting and color world. Reverse shot from behind the bar: THE HEIRESS, facing camera, turns back with a relaxed, confident smile and picks up the champagne coupe by its stem, fine bubbles rising. Behind her, deep in the background, a dark anonymous silhouette seen only from behind, wearing a dark fedora, slips away into a dancing crowd. Strobe light flares, thick haze, red and teal beams, motion in the crowd. + SUFFIX

### P3 · Der Toast (Ref: Cast-Sheet + Styleframe 1)
> Using the attached references: reference 1 provides the faces and wardrobe of all four characters; reference 2 provides the club's lighting and color world. Close medium shot in a plush VIP booth with dark velvet seating and brass: THE HEIRESS laughs and raises her champagne coupe to clink glasses with THE HOSTESS, THE NOTARY and THE PARTNER. Four glasses meet in the center of the frame, slightly right of center, a few droplets of champagne suspended in the air. Red neon rim light, teal fill, bokeh, haze. Joyful, elegant, nobody touches the heiress. + SUFFIX

### P4 · Match-Cut Dinner (Ref: Cast-Sheet + Styleframe 3 → Glasposition)
> Using the attached references: reference 1 provides THE HEIRESS's identity and emerald dress; reference 2 provides the composition: the raised glass must sit at the same position in the frame, slightly right of center, at the same height. Medium shot at a long, festive dinner table in the dining hall of an old country manor at night: THE HEIRESS raises a crystal red-wine glass in a toast, other elegant guests raise theirs along the table. Dozens of tall candles in silver candelabras, warm 2700K candlelight against cool blue moonlight falling through tall leaded windows, dark wood paneling, crystal and silver on white linen. + SUFFIX

### P5a · Die Gastgeberin (Ref: Cast-Sheet + Styleframe 4)
> Using the attached references: reference 1 provides THE HOSTESS's face, updo and red velvet gown; reference 2 provides the manor dining room and candlelight. Tight close-up: THE HOSTESS looks over the rim of her wine glass straight past camera, eyes sharp and suspicious, the glass edge blurred in the foreground, candle flames as warm bokeh, cool moonlight on one side of her face. + SUFFIX

### P5b · Der Notar (Ref: Cast-Sheet + Styleframe 4)
> Using the attached references: reference 1 provides THE NOTARY's silver beard and tuxedo; reference 2 provides the manor dining room and candlelight. Tight close-up across the white tablecloth: THE NOTARY's hand with tuxedo cuff and cufflink, fingers drumming impatiently beside a silver fork and crystal glass; his silver-bearded face in soft focus behind, watchful. Warm candlelight, cool moonlit shadows. + SUFFIX

### P5c · Der Partner (Ref: Cast-Sheet + Styleframe 4)
> Using the attached references: reference 1 provides THE PARTNER's face, green velvet jacket and gold signet ring; reference 2 provides the manor dining room and candlelight. Tight close-up of THE PARTNER's hands resting on the table: he slowly turns the heavy gold signet ring on his little finger; at the edge of his jacket pocket, the fingertip of a black leather glove peeks out. His face half in shadow above, eyes lowered. Warm candlelight, cool moonlight. + SUFFIX

### P6 · Blackout (Ref: Styleframe 4)
> Using the attached reference: it provides the manor dining table, candelabras and lighting. Low, close angle along the table: a row of tall candle flames bending and flickering hard in a sudden draft, one already extinguished with a thin ribbon of smoke, the room falling into darkness, only a glint of crystal and silver remains. + SUFFIX

### P7 · Licht an (Ref: Styleframe 4 → Tafelform)
> Using the attached reference: it provides the shape of the long dinner table and camera angle only. Same long-table composition, now in a stylish modern dining room at home in bright, warm evening light: pendant lamps, light oak, linen, plants, candles and wine glasses. Six friends in their late twenties in playful murder-mystery costumes – a woman in a green silk dress, one with a pink feather boa, a man with a bow tie, one in a velvet jacket, one wearing an obviously fake stick-on silver beard – laughing loudly. One woman points accusingly across the table at her neighbor, who throws up his hands in mock outrage. Printed role booklets with plain covers lie in front of them. Genuine joy, candid, warm. + SUFFIX

### P8 · Das Spiel (Ref: Styleframe 7)
> Using the attached reference: it provides the modern dining table, materials and warm light. Top-down overhead shot onto the table: several hands leafing through printed role booklets with blurred, unreadable pages and plain covers, a smartphone lying face up with a softly glowing blank bright screen, a glass of red wine, a lit candle, linen napkin, scattered crumbs. Warm, cozy, slightly moody. + SUFFIX

### P9 · Marke (Ref: Styleframe 8)
> Using the attached reference: it provides the table and candle. Close side shot at table level: a single lit candle on the table in front of a dark background; a woman's lips gently blowing it out, the flame bending, a delicate curl of white smoke rising into near-total black. Low-key, elegant, warm last light. + SUFFIX

---

## 5. Video-Prompts (Phase 3 – nur nach Freigabe und Plan-Upgrade)

Jeweils Styleframe als `start_frame`, Veo 3.1, 9:16, 1080p, 4 s, `generate_audio: false`. Pro Shot genau eine Kamerabewegung und eine Aktion.

- **V1** Slow-motion, 120fps feel. Slow push-in toward the champagne coupe. The gloved hand from the right edge snaps the ampoule open with its thumb, three clear drops fall into the champagne one after another, then the hand withdraws out of frame. Behind, the heiress keeps laughing and turning away, hair swinging through red backlight. Bubbles and drops stay crisp and physically real.
- **V2** Fast handheld tracking shot arcing slightly left. The heiress turns back, lifts the coupe and smiles; behind her the dark figure in the fedora walks away and disappears into the dancing crowd. Strobe flashes and haze.
- **V3** Slow-motion clink of four glasses in the center, champagne droplets fly; then the camera whip-pans fast to the right along the glass rims into a motion blur.
- **V4** Starts in fast rightward motion blur that settles quickly, as if finishing a whip-pan to the right, landing on the heiress raising her wine glass at the same position in frame; guests raise glasses along the candlelit table. (Zusätzliche Referenz: letztes Frame V3)
- **V7** Quick dolly-in toward the table. The woman points accusingly, her neighbor throws up his hands in outrage, everyone bursts out laughing.
- **V8** Fast top-down push-in. Hands flip pages of the booklets, the phone screen glows, the candle flickers.
- **V9** Slow push-in. The woman blows out the candle; the flame dies and white smoke curls up into black, frame ends nearly black.

---

## 6. Ton

**Musik** (eleven_music_v2_5, instrumental):
- M1 Club, 5,5 s: *Dark, elegant deep house / minimal techno at 122 BPM, heavy sub-bass drop hitting immediately at the very start, crisp hi-hats, luxury nightclub, instrumental, no vocals.*
- M2 Dinner, 3 s: *Tense low cello and double-bass ostinato, heartbeat-like pulse, sparse single dark piano notes, mystery thriller score, instrumental, no vocals.* Hart abgeschnitten bei 7,7 s.
- M3 Zuhause, 6 s: *Warm playful jazz groove, walking upright bass, brushed drums, bright piano comping, cozy dinner party, instrumental, no vocals.*

**SFX** (eleven_text_to_sound_v2): Ampulle knackt 0,2 · 3 Tropfen 0,4/0,55/0,7 · Club-Atmo gedämpft 0–1,8 (Tiefpass in der Post), voll 1,8–5,0 · Champagner perlt 2,0 · Gläser klirren Club 3,6 · Whoosh 4,8 · Gläser klirren Dinner 5,4 · 3 Hits 6,2/6,7/7,2 · Kerzen flackern und Ausblasen 7,7 · Glas fällt und zerspringt 8,2 · Lichtschalter-Klick + Lachen 8,6 · Stimmengewirr 8,6–11,0 · Papierblättern 11,0–12,8 · Kerze ausblasen 12,8 · Logo-Hit 13,0.

**Mix**: Musik ≥ 12 dB unter dem VO (Sidechain-Ducking), Master −14 LUFS integriert / −1 dBTP.

---

## 7. Post-Pipeline (Python + ffmpeg)

`scripts/` (folgt in Phase 3/4): `grade.py` (3 LUTs per numpy, Korn, Vignette, Halation) · `typo.py` (PIL-Overlays, Fade, Blur-zu-Scharf, Scale, 2-Frame-Flash) · `scenes.py` (je Szene eine MP4, Speed Ramps, Whip-Pan-Naht mit 5 Frames Motion Blur) · `mix.py` (Platzierung, Ducking, loudnorm) · `contact_sheet.py`.
Export: concat demuxer `-c copy`, danach Ton mit `-c:v copy`.


---

## Phase 3 – Clips & Voice-over (freigegeben, Shot 3 = Variante A)

**Video:** `veo-3.1-fast-generate-001`, 9:16, 1080p, 4 s, `generate_audio: false`. Negativ-Prompt: *text, letters, words, signage, logos, subtitles, watermark, distorted hands, extra fingers, morphing face, warped glass, static camera*. Startbilder 1–3 sind die retuschierten Fassungen (hochgeladen), 4/7/8 die Styleframe-Nodes.

| Clip | Prompt (gekürzt) | Ergebnis / Verwendung |
|---|---|---|
| V1 Hook | Slow-motion push-in; she laughs and turns, hair through red backlight; gloved hand slides the ampoule into the coat pocket and withdraws | ✔ 0–1,8 s, Slow-Mo-Ramp. Veo malte wieder Pseudo-Neonbuchstaben → pro Frame per Maske weichgezeichnet |
| V2 Nichts bemerkt | Handheld arc left; she lifts the coupe; fedora figure disappears into the crowd; strobes | ✔ 1,5× Tempo + Strobe-Flash auf jedem Beat (122 BPM) |
| V3 Toast | Slow-motion clink, droplets, whip-pan right | ✖ von Googles Filter blockiert (nicht berechnet) → Standbild 03 mit Push-in + Whip-Pan in der Post |
| V4 Dinner | Gloved thumb snaps ampoule, three drops into decanter; heiress toasts behind | ✔ nur die ersten 1,3 s (danach morpht Veo den Handschuh in eine Gästehand) |
| V7 Licht an | Quick dolly-in; pointing, mock outrage, group laughter | ✔ 1,25× Tempo |
| V8 Das Spiel | Top-down push-in; pages flip; phone glows | ✔ Kamera fast statisch → digitaler Push-in; Cover-Insert aufs Display |

Shots 5, 6, 9 sind wie geplant Standbilder (Push-in, Hit-Flash, Kerzenflackern, Abblende).

**Voice-over** (`eleven_v3`, Vincent Crowe `18X2yBovneA0q06wd8E9`, `de`, je 2 Takes, nie beschleunigt – nur an Pausen geschnitten):

| Text (Prompt) | Take | Timeline |
|---|---|---|
| `[deep voice] Einer von euch … [pause] ist ein Mörder.` | B | „Einer von euch …“ 0,25–1,72 · „… ist ein Mörder.“ 1,85–3,31 |
| `[whispers] Aber wer war's?` | B | 7,70–8,96 |
| `[warmly] Murdernight. Das Krimidinner für zuhause.` | B | „Murdernight.“ 10,75 · „Das Krimidinner für zuhause.“ 12,05–14,42 |

⚠️ Abweichung: Satz 3 ist 3,6 s lang, ab 12,9 s waren nur 1,6 s frei → Einsatz auf 10,75 s vorgezogen (freigegeben).

## Phase 4 – Final

**Musik** (`eleven_music_v2_5`, instrumental, je 2 Takes; Wahl nach Einsatz/Energie):
- M1 Club (Take A): *Dark, elegant deep house at 122 BPM, heavy sub-bass drop hitting on the very first beat, four-on-the-floor kick, crisp hi-hats, moody minor synth stab, luxury late-night club energy, instrumental, no vocals.* → 0,15–5,0 (Bass-Drop auf 0,15)
- M2 Dinner (Take A, ab 0,2 s): *Tense mystery thriller score: low cello and double-bass ostinato like a heartbeat pulse, sparse single dark piano notes, suspenseful and restrained, starting immediately at full tension, instrumental, no vocals.* → 5,0–7,7, dann harte Stille
- M3 Zuhause (Take B): *Warm, playful jazz groove starting instantly on the downbeat: walking upright bass, brushed drums, bright swinging piano comping, cozy dinner-party mood, medium-up tempo, instrumental, no vocals.* → 8,6–14,5, Ausblende ab 13,4

**SFX** (`eleven_text_to_sound_v2`, prompt_influence 0,5, je 2 Takes, Take A verwendet):

| Zeit | Sound | Prompt |
|---|---|---|
| 0,0 | Glas-Glint | Crystal glass ting, bright high ping, close-mic |
| 0,0–5,0 | Club-Atmo (0–1,8 Tiefpass „hinter Glas“, dann voll) | Busy upscale nightclub crowd ambience, chatter and laughter, distant bass |
| 2,0 | Champagner | Champagne fizzing in a glass, close-mic bubbles |
| 3,6 | Gläser Club | Several crystal champagne glasses clinking together in a toast |
| 4,68 | Whoosh | Fast whip whoosh swish, short and airy |
| 5,1 | Ampulle knackt | Tiny glass ampoule neck snapping, crisp close-mic crack |
| 5,4 / 5,55 / 5,7 | Tropfen | Single drop of liquid falling into a glass of wine, small clear plop, close-mic |
| 5,9 | Gläser Dinner | Wine glasses clinking softly in a large wooden hall, slight reverb |
| 6,2 / 6,7 / 7,2 | Hits | Deep cinematic impact hit, low boom with short tail |
| 7,6 | Kerzen aus | Candle flames fluttering in a sudden gust of wind, then snuffed out |
| 8,2 | Glas zerspringt | Wine glass falling and shattering on a stone floor in a silent room |
| 8,6 | Lichtschalter + Lachen | Light switch click, crisp, indoor · Group of friends bursting into loud genuine laughter |
| 8,8–11,8 | Stimmengewirr | Friends chatting and laughing around a dinner table, lively indoor |
| 11,0 | Papier | Pages of a paper booklet being flipped quickly, close-mic |
| 12,8 | Kerze ausblasen | Single candle blown out with a soft breath puff |
| 13,0 | Logo-Hit | Elegant deep cinematic logo hit with shimmering metallic tail |

**Mix** (`scripts/mix.py`): VO auf −16 LUFS; Musik je Teil auf gleiche Lautheit, unter Sprache −8 dB Sidechain-Ducking; SFX unter Sprache −3 dB.
Gemessen im Sprachbereich: VO −15,6 LUFS · Musik −31,1 LUFS → **Abstand 15,5 dB** (Vorgabe ≥ 12 dB).

**Bild** (`scripts/scenes.py`, `scripts/final.py`):
- Drei Looks:
  - Club: Neonrot/Teal, tiefe Schwarztöne.
  - Dinner: −0,35 Blenden, Gold-Lichter gegen kühle Schatten.
  - Zuhause: warm und hell.
- Auf alle Looks: Filmkorn, Vignette, Halation.
- Typografie:
  - Playfair Display Bold 130/150/110 px in Elfenbein `#F3EDE2`, ein Wort pro Zeile in Rot `#B3121C`.
  - 3 px dunkle Kontur und weicher Schatten für Lesbarkeit.
  - Einblendung über 7 Frames: Fade, Blur→scharf, Scale 1,04→1. 2-Frame-Flash bei den Hits.
  - Inter SemiBold 72 px für die Labels, Inter Medium 50 px für Preis/URL.
  - Logo: goldener Schimmer läuft einmal darüber.
- Safe Zones werden im Code geprüft (x 40–940, y 220–1500).
- Cover-Insert: Die vier Cover von murdernight.de wechseln alle 0,45 s auf dem automatisch erkannten Handy-Display.
- Retuschen: Neonschrift (01, 02, 03, V1 pro Frame), Glasreflex 05a, Doppelflamme 09.

**Export:** 1080×1920, 30 fps, H.264 (`-preset veryfast -crf 18 -pix_fmt yuv420p -movflags +faststart`), jede Szene als eigene MP4 → concat demuxer `-c copy` → Ton mit `-c:v copy` (AAC 256 kb/s, 48 kHz).

## Qualitätscheck

| Prüfung | Ergebnis |
|---|---|
| Länge | 14,500 s, 435 Frames |
| Lautheit `murdernight_reel_v5.mp4` (ffmpeg loudnorm) | **−13,9 LUFS integriert · −1,5 dBTP · LRA 4,4** |
| Lautheit `…_ohne_musik.mp4` | −13,8 LUFS · −1,6 dBTP · LRA 7,0 |
| Clipping | keins (Peak −1,5 dBTP nach AAC) |
| Musik unter VO | 15,5 dB |
| Text | alle Blöcke in den Safe Zones (Assertion im Code), nichts abgeschnitten |
| KI-Artefakte | behoben bzw. weggeschnitten: Neon-Pseudoschrift, Glasreflex 5a, Doppelflamme 9, Handschuh-Morphing V4 (geschnitten) |
| Bekannt / offen | Shot 3 ist ein Standbild mit Kamerabewegung, kein echtes Video. In Shot 2 erscheinen Funkenfontänen, die nicht im Brief standen |

## Credits (Starter, 30.000)

| Phase | Credits |
|---|---|
| Styleframes (inkl. blockiertem Versuch 609, falls berechnet) | ≈ 10.700 |
| 5 Clips Veo 3.1 Fast | 12.120 |
| Voice-over | 258 |
| Musik | 510 |
| SFX | ≈ 170 |
| **Summe** | **≈ 23.760** |
