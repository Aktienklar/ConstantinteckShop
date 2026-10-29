/**
 * KRIMI-DINNER – DATEN UND HILFSFUNKTIONEN FÜR DIE SKRIPTE
 *
 * Die Fälle selbst (Titel, Spieler, Preise, Murdernight-Adressen, Menüs,
 * UTM-Parameter) stehen NUR in data/cases.json. tools/cases.py schreibt sie
 * unten in den Block "Daten" – dort nie von Hand ändern, die nächste
 * Ausführung überschreibt ihn.
 *
 * Karten, Fallseiten und Rezept-Boxen stehen fertig im HTML (ebenfalls von
 * tools/cases.py). Diese Datei brauchen nur noch die Filter auf
 * krimi-dinner.html und die Krimi-Karte im Rezept-Raster
 * (recipes-overview.js).
 *
 * WICHTIG: Diese Seite verkauft die Krimi-Dinner NICHT. Kauf, Download und
 * alles Rechtliche laufen ausschließlich über Murdernight; hier wird nur
 * dorthin verlinkt. Deshalb steht nichts davon in shop-data.js oder in
 * worker/src/catalog.js – die Fälle dürfen nie im Warenkorb landen.
 */

/* Daten (geschrieben von tools/cases.py aus data/cases.json) – NICHT hier ändern. */
var KRIMI_SITE = {
  "name": "Murdernight",
  "lang": "en",
  "base": {
    "en": "https://murdernight.store",
    "de": "https://murdernight.de"
  },
  "paths": {
    "en": {
      "home": "/en",
      "shop": "/en/shop"
    },
    "de": {
      "home": "/",
      "shop": "/shop"
    }
  },
  "utm": {
    "utm_source": "constantinteck",
    "utm_medium": "website",
    "utm_campaign": "krimi-dinner"
  },
  "recipeCampaign": "krimi-dinner-rezept"
};

var KRIMI_CASES = [
  {
    "id": "the-comet-vintage",
    "players": "8–12",
    "hours": 4,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-comet-vintage.jpg",
    "moods": [
      "glamorous"
    ],
    "occasions": [
      "birthday",
      "new-years-eve"
    ],
    "menu": {
      "starter": "baba-ganoush",
      "main": "creamy-roasted-red-pepper-tomato-pasta",
      "dessert": "grape-sorbet"
    },
    "recipes": [
      "grape-sorbet",
      "peach-sorbet",
      "baba-ganoush",
      "creamy-roasted-red-pepper-tomato-pasta"
    ],
    "en": {
      "title": "The Comet Vintage",
      "genre": "Country-house classic",
      "setting": "An old wine estate on the Moselle",
      "path": "/en/mysteries/the-comet-vintage",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Der Kometenjahrgang",
      "genre": "Landhaus-Klassik",
      "setting": "Ein altes Weingut an der Mosel",
      "path": "/krimis/der-kometenjahrgang"
    }
  },
  {
    "id": "the-last-sleigh-ride",
    "players": "6–10",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-last-sleigh-ride.jpg",
    "moods": [
      "cosy"
    ],
    "occasions": [
      "christmas"
    ],
    "seasonal": [
      11,
      12
    ],
    "menu": {
      "starter": "strawberry-smoothie",
      "main": "cheesy-roasted-chicken-wrap",
      "dessert": "fudgy-chocolate-raspberry-banana-bread"
    },
    "recipes": [
      "strawberry-smoothie",
      "cheesy-roasted-chicken-wrap",
      "fudgy-chocolate-raspberry-banana-bread",
      "thick-raspberry-chia-pudding"
    ],
    "en": {
      "title": "The Last Sleigh Ride",
      "genre": "Fairytale",
      "setting": "The Christmas village at the North Pole",
      "path": "/en/mysteries/the-last-sleigh-ride",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Die letzte Bescherung",
      "genre": "Märchenhaft",
      "setting": "Im Weihnachtsdorf am Nordpol",
      "path": "/krimis/die-letzte-bescherung"
    }
  },
  {
    "id": "the-last-night-at-fjell",
    "players": "5–6",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-last-night-at-fjell.jpg",
    "moods": [
      "cosy"
    ],
    "occasions": [
      "game-night",
      "birthday"
    ],
    "menu": {
      "starter": "",
      "main": "creamy-one-pan-salmon-pasta",
      "dessert": "blueberry-sorbet"
    },
    "recipes": [
      "creamy-one-pan-salmon-pasta",
      "blueberry-sorbet",
      "thick-blueberry-chia-pudding"
    ],
    "en": {
      "title": "The Last Night at Fjell",
      "genre": "Historical",
      "setting": "A Norwegian mountain hotel, 1928",
      "path": "/en/mysteries/the-last-night-at-fjell",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Die letzte Nacht in Fjell",
      "genre": "Historisch",
      "setting": "Ein norwegisches Berghotel, 1928",
      "path": "/krimis/die-letzte-nacht-in-fjell"
    }
  },
  {
    "id": "radio-silence-on-ares",
    "players": "6–8",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/radio-silence-on-ares.jpg",
    "moods": [
      "scifi"
    ],
    "occasions": [
      "game-night",
      "birthday"
    ],
    "menu": {
      "starter": "dragon-fruit-smoothie",
      "main": "peanut-spicy-udon",
      "dessert": "dragonfruit-mango-sorbet"
    },
    "recipes": [
      "dragon-fruit-smoothie",
      "peanut-spicy-udon",
      "dragonfruit-mango-sorbet"
    ],
    "en": {
      "title": "Radio Silence on Ares",
      "genre": "Sci-fi",
      "setting": "A Mars station in 2152",
      "path": "/en/mysteries/radio-silence-on-ares",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Funkstille auf Ares",
      "genre": "Sci-Fi",
      "setting": "Eine Marsstation im Jahr 2152",
      "path": "/krimis/funkstille-auf-ares"
    }
  },
  {
    "id": "witching-hour-at-ravenmoor",
    "players": "6–7",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/witching-hour-at-ravenmoor.jpg",
    "moods": [
      "spooky"
    ],
    "occasions": [
      "halloween"
    ],
    "menu": {
      "starter": "",
      "main": "creamy-sucuk-carbonara",
      "dessert": "healthy-raspberry-chocolate-nice-cream"
    },
    "recipes": [
      "creamy-sucuk-carbonara",
      "healthy-raspberry-chocolate-nice-cream"
    ],
    "en": {
      "title": "Witching Hour at Ravenmoor",
      "genre": "Historical",
      "setting": "A haunted castle, Halloween 1986",
      "path": "/en/mysteries/witching-hour-at-ravenmoor",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Geisterstunde auf Ravenmoor",
      "genre": "Historisch",
      "setting": "Ein Spukschloss, Halloween 1986",
      "path": "/krimis/geisterstunde-auf-ravenmoor"
    }
  },
  {
    "id": "murder-before-hibernation",
    "players": "5–7",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/murder-before-hibernation.jpg",
    "moods": [
      "cosy"
    ],
    "occasions": [
      "game-night"
    ],
    "menu": {
      "starter": "granola-berry-smoothie-bowl",
      "main": "creamy-roasted-red-pepper-tomato-pasta",
      "dessert": "chocolate-banana-ice-cream"
    },
    "recipes": [
      "granola-berry-smoothie-bowl",
      "chocolate-banana-ice-cream",
      "thick-mango-chia-pudding"
    ],
    "en": {
      "title": "Murder Before Hibernation",
      "genre": "Fairytale",
      "setting": "An autumn forest of talking animals",
      "path": "/en/mysteries/murder-before-hibernation",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Mord vor dem Winterschlaf",
      "genre": "Märchenhaft",
      "setting": "Der herbstliche Tierwald",
      "path": "/krimis/mord-vor-dem-winterschlaf"
    }
  },
  {
    "id": "closing-bell-on-the-24th-floor",
    "players": "6–7",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/closing-bell-on-the-24th-floor.jpg",
    "moods": [
      "glamorous"
    ],
    "occasions": [
      "team-event"
    ],
    "menu": {
      "starter": "mango-passionfruit-smoothie",
      "main": "peanut-spicy-udon",
      "dessert": "lemon-sorbet"
    },
    "recipes": [
      "mango-passionfruit-smoothie",
      "lemon-sorbet",
      "kiwi-sorbet"
    ],
    "en": {
      "title": "Closing Bell on the 24th Floor",
      "genre": "Modern / Business",
      "setting": "The executive floor of a corporation",
      "path": "/en/mysteries/closing-bell-on-the-24th-floor",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Schlusskurs im 24. Stock",
      "genre": "Modern / Business",
      "setting": "Die Vorstandsetage eines Konzerns",
      "path": "/krimis/schlusskurs-im-24-stock"
    }
  },
  {
    "id": "death-at-studio-7",
    "players": "6–8",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/death-at-studio-7.jpg",
    "moods": [
      "glamorous"
    ],
    "occasions": [
      "new-years-eve",
      "birthday"
    ],
    "menu": {
      "starter": "strawberry-passion-fruit-smoothie",
      "main": "creamy-one-pan-salmon-pasta",
      "dessert": "strawberry-sorbet"
    },
    "recipes": [
      "strawberry-passion-fruit-smoothie",
      "strawberry-sorbet",
      "coconut-mango-sorbet",
      "pineapple-sorbet"
    ],
    "en": {
      "title": "Death at Studio 7",
      "genre": "Historical",
      "setting": "Hollywood, 1934",
      "path": "/en/mysteries/death-at-studio-7",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Tod im Studio 7",
      "genre": "Historisch",
      "setting": "Hollywood im Jahr 1934",
      "path": "/krimis/tod-im-studio-7"
    }
  },
  {
    "id": "the-night-of-the-waxworks",
    "players": "8–10",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-night-of-the-waxworks.jpg",
    "moods": [
      "spooky"
    ],
    "occasions": [
      "halloween",
      "team-event"
    ],
    "menu": {
      "starter": "baba-ganoush",
      "main": "creamy-sucuk-carbonara",
      "dessert": "avocado-ice-cream"
    },
    "recipes": [
      "avocado-ice-cream",
      "mango-raspberry-sorbet",
      "strawberry-pineapple-sorbet",
      "yellow-watermelon-sorbet"
    ],
    "en": {
      "title": "The Night of the Waxworks",
      "genre": "Modern / Business",
      "setting": "A Halloween case in a hotel full of wax figures",
      "path": "/en/mysteries/the-night-of-the-waxworks",
      "teaser": "",
      "roles": []
    },
    "de": {
      "title": "Das Wachsfigurenhotel",
      "genre": "Modern / Business",
      "setting": "Halloween in einem Hotel voller Wachsfiguren",
      "path": "/krimis/das-wachsfigurenhotel"
    }
  }
];

var KRIMI_PREVIEWS = [];

var KRIMI_SOCIAL = {
  "reviews": [],
  "photos": []
};
/* /Daten */
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
    filters: {
      players: "Players",
      mood: "Mood",
      occasion: "Occasion",
      count: function (shown, all) {
        return shown === all ? "All " + all + " cases" : shown + " of " + all + " cases";
      },
      reset: "Reset"
    },
    playerBuckets: [[5, 6], [7, 9], [10, 12]],
    seasonalBanner: function (title, occasion) {
      return { short: title + " · seasonal pick", long: title + " – the murder mystery for your " + occasion };
    },
    menuFor: "Cook for",
    reviewsHeading: "From your murder mystery nights",
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
    allCases: function (count) { return "See all " + count + " cases"; },
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
    filters: {
      players: "Personen",
      mood: "Stimmung",
      occasion: "Anlass",
      count: function (shown, all) {
        return shown === all ? "Alle " + all + " Fälle" : shown + " von " + all + " Fällen";
      },
      reset: "Zurücksetzen"
    },
    playerBuckets: [[5, 6], [7, 9], [10, 12]],
    seasonalBanner: function (title, occasion) {
      return { short: title + " · passt zur Saison", long: title + " – der Krimi für deine " + occasion };
    },
    menuFor: "Menü für",
    reviewsHeading: "Von euren Krimiabenden",
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
    allCases: function (count) { return "Alle " + count + " Fälle ansehen"; },
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
