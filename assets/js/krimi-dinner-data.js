/**
 * KRIMI-DINNER – DATEN
 *
 * Diese Datei ist die einzige Stelle, an der die Krimi-Dinner-Fälle, ihre
 * Preise und ihre Adressen bei Murdernight stehen. Die Seite
 * krimi-dinner.html, die Startseite, about.html und der Hinweis-Block auf
 * den Rezeptseiten lesen alle von hier – wer einen Preis oder einen Fall ändert, ändert
 * ihn nur hier.
 *
 * WICHTIG: Diese Seite verkauft die Krimi-Dinner NICHT. Kauf, Download und
 * alles Rechtliche laufen ausschließlich über Murdernight; hier wird nur
 * dorthin verlinkt. Deshalb steht nichts davon in shop-data.js oder in
 * worker/src/catalog.js – die Fälle dürfen nie im Warenkorb landen.
 *
 * Die Werte sind eine Abschrift des Shops auf murdernight.de (Stand
 * 27.10.2026). Ändert sich dort ein Preis, muss er hier nachgezogen werden –
 * sonst nennt diese Seite einen anderen Preis als die Kasse dort.
 */

var KRIMI_SITE = {
  /**
   * Adresse je Sprache, ohne Schrägstrich am Ende. krimiabend24.de leitet
   * seit Oktober 2026 auf Murdernight um: Deutsch läuft über murdernight.de,
   * Englisch über murdernight.store.
   */
  base: {
    en: "https://murdernight.store",
    de: "https://murdernight.de"
  },

  /** So heißt der Shop in sichtbaren Texten. */
  name: "Murdernight",

  /**
   * Sprache, in der auf Murdernight verlinkt wird: "en" oder "de".
   * Diese Website ist englisch, also "en". Fälle ohne Eintrag in der
   * gewählten Sprache werden nicht angezeigt.
   */
  lang: "en",

  /** Shop-Übersicht und Startseite je Sprache. */
  paths: {
    en: { home: "/en", shop: "/en/shop" },
    de: { home: "/", shop: "/shop" }
  },

  /**
   * UTM-Parameter, die an JEDEN Link zu Murdernight gehängt werden.
   * Nur hier ändern – krimiUrl() unten baut alle Links daraus.
   *
   * Absprache mit Jonas (Murdernight), 27.10.2026: Jeder Link muss
   * utm_source=<Seitenname> tragen, damit deren Marketing-Cookie erkennt,
   * dass der Besuch von hier kommt. utm_source darf also nie fehlen und
   * bleibt "constantinteck". murdernight.de leitet englische Adressen samt
   * Parametern auf murdernight.store weiter – beide Domains sind in Ordnung.
   */
  utm: {
    utm_source: "constantinteck",
    utm_medium: "website",
    utm_campaign: "krimi-dinner"
  },

  /** Abweichende Kampagne für den Hinweis-Block auf Rezeptseiten. */
  recipeCampaign: "krimi-dinner-rezept",

  /**
   * Fall für den Teaser auf der Startseite, wenn gerade kein Fall Saison hat
   * (Feld "seasonal"). Leer = der erste Fall der Liste.
   */
  featured: ""
};

/**
 * DIE FÄLLE – Abschrift von murdernight.de / murdernight.store
 * (Stand 27.10.2026). Reihenfolge wie dort.
 *
 * id          Kennung für den Rezept-Hinweis: <div data-krimi-hint="id"></div>
 * players     Spielerzahl, so wie sie im Shop steht ("6" oder "5–7")
 * hours       Dauer in Stunden als Zahl (2.5 = "ca. 2,5 Std.")
 * difficulty  "easy", "medium" oder "tricky" – so steht es dort
 * price       Preis in Euro
 * image       Cover ab dem Hauptordner. Die Dateien in assets/img/krimi/ sind
 *             die englischen Cover von murdernight.store (27.10.2026, auf
 *             900 px verkleinert) – als eigene Kopie, nichts von Murdernight
 *             direkt einbinden. Leer = neutraler Platzhalter.
 *             Hochformat 675 × 900 (3:4), Titel im Bild – wird nie
 *             beschnitten. Neben jedem JPEG liegen <name>-400.webp und
 *             <name>-675.webp; bei einem neuen Cover einmal
 *             python3 tools/krimi-images.py laufen lassen.
 * moods       Stimmung für die Filter auf krimi-dinner.html, Schlüssel aus
 *             KRIMI_LABELS.<lang>.moods ("cosy", "spooky", "glamorous", "scifi")
 * occasions   Anlässe – erscheinen als "Perfect for:" auf der Karte und als
 *             Filter. Schlüssel aus KRIMI_LABELS.<lang>.occasions.
 * seasonal    Optional: Monate (1–12), in denen der Fall als "Seasonal pick"
 *             markiert und im Raster und auf der Startseite nach vorn
 *             gestellt wird. Entscheidet das Datum im Browser des Besuchers.
 * recipes     Rezepte von dieser Seite, die zum Fall passen – für "Cook the
 *             menu, solve the case". { slug: "<datei in recipes/ ohne .html>",
 *             title: "<sichtbarer Titel>" }. Leer = der Fall erscheint dort
 *             nicht.
 * en / de     Titel, Genre, Schauplatz, Pfad der Produktseite und teaser
 *             (1–2 Sätze Story; leer = keine Zeile auf der Karte). null = den
 *             Fall gibt es in dieser Sprache (noch) nicht.
 */
var KRIMI_CASES = [
  {
    id: "the-comet-vintage",
    players: "8–12",
    hours: 4,
    difficulty: "tricky",
    price: 8.99,
    image: "assets/img/krimi/the-comet-vintage.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["glamorous"],
    occasions: ["birthday", "new-years-eve"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "The Comet Vintage",
      genre: "Country-house classic",
      setting: "An old wine estate on the Moselle",
      path: "/en/mysteries/the-comet-vintage",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Der Kometenjahrgang",
      genre: "Landhaus-Klassik",
      setting: "Ein altes Weingut an der Mosel",
      path: "/krimis/der-kometenjahrgang"
    }
  },
  {
    id: "the-last-sleigh-ride",
    players: "6–10",
    hours: 3,
    difficulty: "tricky",
    price: 8.99,
    image: "assets/img/krimi/the-last-sleigh-ride.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["cosy"],
    occasions: ["christmas"],
    seasonal: [11, 12],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "The Last Sleigh Ride",
      genre: "Fairytale",
      setting: "The Christmas village at the North Pole",
      path: "/en/mysteries/the-last-sleigh-ride",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Die letzte Bescherung",
      genre: "Märchenhaft",
      setting: "Im Weihnachtsdorf am Nordpol",
      path: "/krimis/die-letzte-bescherung"
    }
  },
  {
    id: "the-last-night-at-fjell",
    players: "5–6",
    hours: 3,
    difficulty: "tricky",
    price: 8.99,
    image: "assets/img/krimi/the-last-night-at-fjell.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["cosy"],
    occasions: ["game-night", "birthday"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "The Last Night at Fjell",
      genre: "Historical",
      setting: "A Norwegian mountain hotel, 1928",
      path: "/en/mysteries/the-last-night-at-fjell",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Die letzte Nacht in Fjell",
      genre: "Historisch",
      setting: "Ein norwegisches Berghotel, 1928",
      path: "/krimis/die-letzte-nacht-in-fjell"
    }
  },
  {
    id: "radio-silence-on-ares",
    players: "6–8",
    hours: 3,
    difficulty: "medium",
    price: 8.99,
    image: "assets/img/krimi/radio-silence-on-ares.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["scifi"],
    occasions: ["game-night", "birthday"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "Radio Silence on Ares",
      genre: "Sci-fi",
      setting: "A Mars station in 2152",
      path: "/en/mysteries/radio-silence-on-ares",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Funkstille auf Ares",
      genre: "Sci-Fi",
      setting: "Eine Marsstation im Jahr 2152",
      path: "/krimis/funkstille-auf-ares"
    }
  },
  {
    id: "witching-hour-at-ravenmoor",
    players: "6–7",
    hours: 3,
    difficulty: "medium",
    price: 8.99,
    image: "assets/img/krimi/witching-hour-at-ravenmoor.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["spooky"],
    occasions: ["halloween"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "Witching Hour at Ravenmoor",
      genre: "Historical",
      setting: "A haunted castle, Halloween 1986",
      path: "/en/mysteries/witching-hour-at-ravenmoor",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Geisterstunde auf Ravenmoor",
      genre: "Historisch",
      setting: "Ein Spukschloss, Halloween 1986",
      path: "/krimis/geisterstunde-auf-ravenmoor"
    }
  },
  {
    id: "murder-before-hibernation",
    players: "5–7",
    hours: 3,
    difficulty: "medium",
    price: 8.99,
    image: "assets/img/krimi/murder-before-hibernation.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["cosy"],
    occasions: ["game-night"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "Murder Before Hibernation",
      genre: "Fairytale",
      setting: "An autumn forest of talking animals",
      path: "/en/mysteries/murder-before-hibernation",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Mord vor dem Winterschlaf",
      genre: "Märchenhaft",
      setting: "Der herbstliche Tierwald",
      path: "/krimis/mord-vor-dem-winterschlaf"
    }
  },
  {
    id: "closing-bell-on-the-24th-floor",
    players: "6–7",
    hours: 3,
    difficulty: "tricky",
    price: 8.99,
    image: "assets/img/krimi/closing-bell-on-the-24th-floor.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["glamorous"],
    occasions: ["team-event"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "Closing Bell on the 24th Floor",
      genre: "Modern / Business",
      setting: "The executive floor of a corporation",
      path: "/en/mysteries/closing-bell-on-the-24th-floor",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Schlusskurs im 24. Stock",
      genre: "Modern / Business",
      setting: "Die Vorstandsetage eines Konzerns",
      path: "/krimis/schlusskurs-im-24-stock"
    }
  },
  {
    id: "death-at-studio-7",
    players: "6–8",
    hours: 3,
    difficulty: "medium",
    price: 8.99,
    image: "assets/img/krimi/death-at-studio-7.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["glamorous"],
    occasions: ["new-years-eve", "birthday"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "Death at Studio 7",
      genre: "Historical",
      setting: "Hollywood, 1934",
      path: "/en/mysteries/death-at-studio-7",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Tod im Studio 7",
      genre: "Historisch",
      setting: "Hollywood im Jahr 1934",
      path: "/krimis/tod-im-studio-7"
    }
  },
  {
    id: "the-night-of-the-waxworks",
    players: "8–10",
    hours: 3,
    difficulty: "tricky",
    price: 8.99,
    image: "assets/img/krimi/the-night-of-the-waxworks.jpg",
    // TODO: Stimmung und Anlässe sind mein Vorschlag aus Genre und Schauplatz – bitte prüfen.
    moods: ["spooky"],
    occasions: ["halloween", "team-event"],
    recipes: [], // TODO: 2–3 passende Rezepte, z. B. { slug: "creamy-sucuk-carbonara", title: "Creamy Sucuk Carbonara" }
    en: {
      title: "The Night of the Waxworks",
      genre: "Modern / Business",
      setting: "A Halloween case in a hotel full of wax figures",
      path: "/en/mysteries/the-night-of-the-waxworks",
      teaser: "" // TODO: 1–2 Sätze mit Hook – wer ist tot, warum ist jeder verdächtig?
    },
    de: {
      title: "Das Wachsfigurenhotel",
      genre: "Modern / Business",
      setting: "Halloween in einem Hotel voller Wachsfiguren",
      path: "/krimis/das-wachsfigurenhotel"
    }
  }
];

/** Sichtbare Beschriftungen je Sprache – passend zu KRIMI_SITE.lang. */
var KRIMI_LABELS = {
  en: {
    players: "players",
    duration: function (hours) { return "approx. " + hours + " hrs"; },
    toCase: "View case",
    getCase: function (price) { return "Get the case – " + price; },
    seasonal: "Seasonal pick",
    perfectFor: "Perfect for:",
    difficultyLevel: "Difficulty",
    /* TODO: Erklärungen mit Murdernight abgleichen – wie definieren sie
       "Medium" und "Tricky"? */
    difficultyHelp: {
      easy: "Easy: the clues lead fairly directly to the culprit – good for a first murder mystery night.",
      medium: "Medium: some clues only make sense together – fine for mixed groups.",
      tricky: "Tricky: the decisive clues are well hidden – for groups who like a real puzzle."
    },
    moods: { cosy: "Cosy", spooky: "Spooky", glamorous: "Glamorous", scifi: "Sci-fi" },
    occasions: {
      christmas: "Christmas party",
      halloween: "Halloween party",
      "new-years-eve": "New Year's Eve",
      birthday: "Birthday",
      "game-night": "Game night",
      "team-event": "Team event"
    },
    toGame: "To the game",
    toCases: "See the cases",
    newTab: "opens Murdernight in a new tab",
    hintEyebrow: "Murder mystery dinner",
    hintText: "This dish is part of a murder mystery dinner menu.",
    hintTextGeneric: "Cooking for friends? Make it a murder mystery night.",
    hintDetailGeneric: function (count, price) {
      return count + " cases to print at home · " + price + " each";
    },
    difficulty: { easy: "Easy", medium: "Medium", tricky: "Tricky" },
    coverAlt: function (title, setting) {
      return "Cover of the murder mystery dinner " + title + (setting ? " – " + setting : "");
    },
    locale: "en-IE"
  },
  de: {
    players: "Personen",
    duration: function (hours) {
      return "ca. " + String(hours).replace(".", ",") + " Std.";
    },
    toCase: "Zum Fall",
    getCase: function (price) { return "Fall holen – " + price; },
    seasonal: "Passt zur Saison",
    perfectFor: "Ideal für:",
    difficultyLevel: "Schwierigkeit",
    difficultyHelp: {
      easy: "Leicht: Die Hinweise führen recht direkt zum Täter – gut für den ersten Krimiabend.",
      medium: "Mittel: Manche Hinweise ergeben erst zusammen Sinn – passt für gemischte Gruppen.",
      tricky: "Knifflig: Die entscheidenden Hinweise sind gut versteckt – für Gruppen, die gern rätseln."
    },
    moods: { cosy: "Gemütlich", spooky: "Gruselig", glamorous: "Glamourös", scifi: "Sci-Fi" },
    occasions: {
      christmas: "Weihnachtsfeier",
      halloween: "Halloween",
      "new-years-eve": "Silvester",
      birthday: "Geburtstag",
      "game-night": "Spieleabend",
      "team-event": "Teamevent"
    },
    toGame: "Zum Spiel",
    toCases: "Zu den Fällen",
    newTab: "öffnet Murdernight in neuem Tab",
    hintEyebrow: "Krimi-Dinner",
    hintText: "Dieses Gericht ist Teil eines Krimi-Dinner-Menüs.",
    hintTextGeneric: "Kochst du für Freunde? Mach einen Krimiabend daraus.",
    hintDetailGeneric: function (count, price) {
      return count + " Fälle zum Ausdrucken · je " + price;
    },
    difficulty: { easy: "Leicht", medium: "Mittel", tricky: "Knifflig" },
    coverAlt: function (title, setting) {
      return "Cover des Krimi-Dinners " + title + (setting ? " – " + setting : "");
    },
    locale: "de-DE"
  }
};

/**
 * Der eine Weg zu einem Link nach Murdernight.
 *
 *   krimiUrl("/en/shop")                          -> … ?utm_campaign=krimi-dinner
 *   krimiUrl("/en/shop", KRIMI_SITE.recipeCampaign) -> … ?utm_campaign=krimi-dinner-rezept
 *   krimiUrl(path, null, "the-comet-vintage")     -> … &utm_content=the-comet-vintage
 *
 * utm_content sagt, welcher Link geklickt wurde: bei Fallkarten die id des
 * Falls, bei allgemeinen Knöpfen deren Stelle (z. B. "closing-cta").
 *
 * Kein Link zu Murdernight wird irgendwo von Hand geschrieben – nur so
 * lässt sich ein UTM-Parameter später an einer Stelle ändern.
 */
function krimiUrl(path, campaign, content) {
  var params = [];

  Object.keys(KRIMI_SITE.utm).forEach(function (key) {
    var value =
      key === "utm_campaign" && campaign ? campaign : KRIMI_SITE.utm[key];
    params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
  });
  if (content) params.push("utm_content=" + encodeURIComponent(content));

  return (
    KRIMI_SITE.base[KRIMI_SITE.lang] +
    path +
    (path.indexOf("?") === -1 ? "?" : "&") +
    params.join("&")
  );
}

/** Die Fälle, die es in der eingestellten Sprache gibt. */
function krimiCases() {
  return KRIMI_CASES.filter(function (item) {
    return Boolean(item[KRIMI_SITE.lang]);
  });
}

/** Hat der Fall heute Saison (Feld "seasonal")? */
function krimiInSeason(item, date) {
  var month = (date || new Date()).getMonth() + 1;
  return Boolean(item.seasonal && item.seasonal.indexOf(month) !== -1);
}

/** Wie krimiCases(), aber Fälle mit Saison stehen vorn. */
function krimiCasesBySeason() {
  var cases = krimiCases();
  return cases
    .filter(function (item) { return krimiInSeason(item); })
    .concat(cases.filter(function (item) { return !krimiInSeason(item); }));
}

/** "5–7" -> [5, 7], "6" -> [6, 6] */
function krimiPlayerRange(item) {
  var numbers = String(item.players).match(/\d+/g) || [];
  var low = Number(numbers[0]);
  return [low, Number(numbers[1] || low)];
}

/** 16.9 -> "€16.90" (en) bzw. "16,90 €" (de) */
function krimiPrice(value) {
  return new Intl.NumberFormat(KRIMI_LABELS[KRIMI_SITE.lang].locale, {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
