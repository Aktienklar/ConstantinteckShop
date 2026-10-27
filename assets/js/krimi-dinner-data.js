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
  recipeCampaign: "krimi-dinner-rezept"
};

/**
 * DIE FÄLLE – Abschrift von murdernight.de / murdernight.store
 * (Stand 27.10.2026). Reihenfolge wie dort.
 *
 * id          Kennung für den Rezept-Hinweis: <div data-krimi-hint="id"></div>
 * players     Spielerzahl, so wie sie im Shop steht ("6" oder "5–7")
 * hours       Dauer in Stunden als Zahl (2.5 = "ca. 2,5 Std.")
 * difficulty  "medium" oder "tricky" – so steht es dort
 * price       Preis in Euro
 * image       Cover ab dem Hauptordner. Die Dateien in assets/img/krimi/ sind
 *             die englischen Cover von murdernight.store (27.10.2026, auf
 *             900 px verkleinert) – als eigene Kopie, nichts von Murdernight
 *             direkt einbinden. Leer = neutraler Platzhalter.
 * en / de     Titel, Genre, Schauplatz und Pfad der Produktseite. null = den
 *             Fall gibt es in dieser Sprache (noch) nicht.
 */
var KRIMI_CASES = [
  {
    id: "the-comet-vintage",
    players: "8–12",
    hours: 4,
    difficulty: "tricky",
    price: 8.99,
    image: "assets/img/krimi/the-comet-vintage.jpg",    en: {
      title: "The Comet Vintage",
      genre: "Country-house classic",
      setting: "An old wine estate on the Moselle",
      path: "/en/mysteries/the-comet-vintage"
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
    image: "assets/img/krimi/the-last-sleigh-ride.jpg",    en: {
      title: "The Last Sleigh Ride",
      genre: "Fairytale",
      setting: "The Christmas village at the North Pole",
      path: "/en/mysteries/the-last-sleigh-ride"
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
    image: "assets/img/krimi/the-last-night-at-fjell.jpg",    en: {
      title: "The Last Night at Fjell",
      genre: "Historical",
      setting: "A Norwegian mountain hotel, 1928",
      path: "/en/mysteries/the-last-night-at-fjell"
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
    image: "assets/img/krimi/radio-silence-on-ares.jpg",    en: {
      title: "Radio Silence on Ares",
      genre: "Sci-fi",
      setting: "A Mars station in 2152",
      path: "/en/mysteries/radio-silence-on-ares"
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
    image: "assets/img/krimi/witching-hour-at-ravenmoor.jpg",    en: {
      title: "Witching Hour at Ravenmoor",
      genre: "Historical",
      setting: "A haunted castle, Halloween 1986",
      path: "/en/mysteries/witching-hour-at-ravenmoor"
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
    image: "assets/img/krimi/murder-before-hibernation.jpg",    en: {
      title: "Murder Before Hibernation",
      genre: "Fairytale",
      setting: "An autumn forest of talking animals",
      path: "/en/mysteries/murder-before-hibernation"
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
    image: "assets/img/krimi/closing-bell-on-the-24th-floor.jpg",    en: {
      title: "Closing Bell on the 24th Floor",
      genre: "Modern / Business",
      setting: "The executive floor of a corporation",
      path: "/en/mysteries/closing-bell-on-the-24th-floor"
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
    image: "assets/img/krimi/death-at-studio-7.jpg",    en: {
      title: "Death at Studio 7",
      genre: "Historical",
      setting: "Hollywood, 1934",
      path: "/en/mysteries/death-at-studio-7"
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
    image: "assets/img/krimi/the-night-of-the-waxworks.jpg",    en: {
      title: "The Night of the Waxworks",
      genre: "Modern / Business",
      setting: "A Halloween case in a hotel full of wax figures",
      path: "/en/mysteries/the-night-of-the-waxworks"
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
    toGame: "To the game",
    toCases: "See the cases",
    newTab: "opens Murdernight in a new tab",
    hintEyebrow: "Murder mystery dinner",
    hintText: "This dish is part of a murder mystery dinner menu.",
    hintTextGeneric: "Cooking for friends? Make it a murder mystery night.",
    hintDetailGeneric: function (count, price) {
      return count + " cases to print at home · " + price + " each";
    },
    difficulty: { medium: "Medium", tricky: "Tricky" },
    locale: "en-IE"
  },
  de: {
    players: "Personen",
    duration: function (hours) {
      return "ca. " + String(hours).replace(".", ",") + " Std.";
    },
    toCase: "Zum Fall",
    toGame: "Zum Spiel",
    toCases: "Zu den Fällen",
    newTab: "öffnet Murdernight in neuem Tab",
    hintEyebrow: "Krimi-Dinner",
    hintText: "Dieses Gericht ist Teil eines Krimi-Dinner-Menüs.",
    hintTextGeneric: "Kochst du für Freunde? Mach einen Krimiabend daraus.",
    hintDetailGeneric: function (count, price) {
      return count + " Fälle zum Ausdrucken · je " + price;
    },
    difficulty: { medium: "Mittel", tricky: "Knifflig" },
    locale: "de-DE"
  }
};

/**
 * Der eine Weg zu einem Link nach Murdernight.
 *
 *   krimiUrl("/en/shop")                          -> … ?utm_campaign=krimi-dinner
 *   krimiUrl("/en/shop", KRIMI_SITE.recipeCampaign) -> … ?utm_campaign=krimi-dinner-rezept
 *
 * Kein Link zu Murdernight wird irgendwo von Hand geschrieben – nur so
 * lässt sich ein UTM-Parameter später an einer Stelle ändern.
 */
function krimiUrl(path, campaign) {
  var params = [];

  Object.keys(KRIMI_SITE.utm).forEach(function (key) {
    var value =
      key === "utm_campaign" && campaign ? campaign : KRIMI_SITE.utm[key];
    params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
  });

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

/** 16.9 -> "€16.90" (en) bzw. "16,90 €" (de) */
function krimiPrice(value) {
  return new Intl.NumberFormat(KRIMI_LABELS[KRIMI_SITE.lang].locale, {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
