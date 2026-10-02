/**
 * KRIMI-DINNER – DATEN
 *
 * Diese Datei ist die einzige Stelle, an der die Krimi-Dinner-Fälle, ihre
 * Preise und ihre Adressen bei krimiabend24.de stehen. Die Seite
 * krimi-dinner.html, die Teaser-Karte in shop.html und der Hinweis-Block für
 * Rezepte lesen alle von hier – wer einen Preis oder einen Fall ändert, ändert
 * ihn nur hier.
 *
 * WICHTIG: Diese Seite verkauft die Krimi-Dinner NICHT. Kauf, Download und
 * alles Rechtliche laufen ausschließlich über krimiabend24.de; hier wird nur
 * dorthin verlinkt. Deshalb steht nichts davon in shop-data.js oder in
 * worker/src/catalog.js – die Fälle dürfen nie im Warenkorb landen.
 *
 * Die Werte sind eine Abschrift des Shops auf krimiabend24.de (Stand
 * 02.10.2026). Ändert sich dort ein Preis, muss er hier nachgezogen werden –
 * sonst nennt diese Seite einen anderen Preis als die Kasse dort.
 */

var KRIMI_SITE = {
  /** Ohne Schrägstrich am Ende. */
  base: "https://www.krimiabend24.de",

  /**
   * Sprache, in der auf krimiabend24.de verlinkt wird: "en" oder "de".
   * Diese Website ist englisch, also "en". Fälle ohne Eintrag in der
   * gewählten Sprache werden nicht angezeigt.
   */
  lang: "en",

  /** Shop-Übersicht und Startseite je Sprache. */
  paths: {
    en: { home: "/en", shop: "/en/shop" },
    de: { home: "/de", shop: "/shop" }
  },

  /**
   * UTM-Parameter, die an JEDEN Link zu krimiabend24.de gehängt werden.
   * Nur hier ändern – krimiUrl() unten baut alle Links daraus.
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
 * DIE FÄLLE
 *
 * id        Kennung für den Rezept-Hinweis: <div data-krimi-hint="id"></div>
 * players   Spielerzahl, so wie sie im Shop steht ("6" oder "5–7")
 * hours     Dauer in Stunden als Zahl (2.5 = "ca. 2,5 Std.")
 * price     Preis in Euro
 * image     TODO: echtes Cover. Solange der Wert leer ist, zeigt die Karte
 *           einen neutralen Platzhalter. Eigene Datei nach assets/img/ legen
 *           und hier den Pfad ab dem Hauptordner eintragen, z. B.
 *           "assets/img/krimi-teatime-caper.jpg" – nichts von krimiabend24.de
 *           direkt einbinden.
 * en / de   Titel, Genre und Pfad der Produktseite. null = den Fall gibt es
 *           in dieser Sprache (noch) nicht.
 */
var KRIMI_CASES = [
  {
    id: "silence-in-the-drawing-room",
    players: "6",
    hours: 3,
    price: 16.9,
    image: "", // TODO: echtes Cover
    en: {
      title: "Silence in the Drawing Room",
      genre: "Country-house classic",
      path: "/en/mysteries/silence-in-the-drawing-room"
    },
    de: {
      title: "Das Schweigen im Salon",
      genre: "Landhaus-Klassik",
      path: "/krimis/das-schweigen-im-salon"
    }
  },
  {
    id: "murder-in-the-boardroom",
    players: "5–7",
    hours: 2.5,
    price: 14.9,
    image: "", // TODO: echtes Cover
    en: {
      title: "Murder in the Boardroom",
      genre: "Modern / Business",
      path: "/en/mysteries/murder-in-the-boardroom"
    },
    de: {
      title: "Mord im Vorstand",
      genre: "Modern / Business",
      path: "/krimis/mord-im-vorstand"
    }
  },
  {
    id: "the-teatime-caper",
    players: "4–6",
    hours: 2,
    price: 12.9,
    image: "", // TODO: echtes Cover
    en: {
      title: "The Teatime Caper",
      genre: "Comedy mystery",
      path: "/en/mysteries/the-teatime-caper"
    },
    de: {
      title: "Tatort Teestunde",
      genre: "Comedy-Krimi",
      path: "/krimis/tatort-teestunde"
    }
  },
  {
    id: "silent-night-deadly-night",
    players: "5–8",
    hours: 3,
    price: 16.9,
    image: "", // TODO: echtes Cover
    en: {
      title: "Silent Night, Deadly Night",
      genre: "Christmas mystery",
      path: "/en/mysteries/silent-night-deadly-night"
    },
    de: {
      title: "Stille Nacht, tödliche Nacht",
      genre: "Weihnachtskrimi",
      path: "/krimis/stille-nacht-toedliche-nacht"
    }
  },

  /* Die folgenden zwei Fälle gibt es bisher nur auf Deutsch. Sie erscheinen
     erst, wenn KRIMI_SITE.lang auf "de" steht oder ein "en"-Eintrag dazukommt. */
  {
    id: "signal-aus-dem-nichts",
    players: "6–8",
    hours: 3.3,
    price: 17.9,
    image: "", // TODO: echtes Cover
    en: null,
    de: {
      title: "Signal aus dem Nichts",
      genre: "Sci-Fi",
      path: "/krimis/signal-aus-dem-nichts"
    }
  },
  {
    id: "der-letzte-walzer",
    players: "7–10",
    hours: 3.5,
    price: 18.9,
    image: "", // TODO: echtes Cover
    en: null,
    de: {
      title: "Der letzte Walzer",
      genre: "Historisch",
      path: "/krimis/der-letzte-walzer"
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
    newTab: "opens krimiabend24.de in a new tab",
    hintEyebrow: "Murder mystery dinner",
    hintText: "This dish is part of a murder mystery dinner menu.",
    locale: "en-IE"
  },
  de: {
    players: "Personen",
    duration: function (hours) {
      return "ca. " + String(hours).replace(".", ",") + " Std.";
    },
    toCase: "Zum Fall",
    toGame: "Zum Spiel",
    newTab: "öffnet krimiabend24.de in neuem Tab",
    hintEyebrow: "Krimi-Dinner",
    hintText: "Dieses Gericht ist Teil eines Krimi-Dinner-Menüs.",
    locale: "de-DE"
  }
};

/**
 * Der eine Weg zu einem Link nach krimiabend24.de.
 *
 *   krimiUrl("/en/shop")                          -> … ?utm_campaign=krimi-dinner
 *   krimiUrl("/en/shop", KRIMI_SITE.recipeCampaign) -> … ?utm_campaign=krimi-dinner-rezept
 *
 * Kein Link zu krimiabend24.de wird irgendwo von Hand geschrieben – nur so
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
    KRIMI_SITE.base +
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
