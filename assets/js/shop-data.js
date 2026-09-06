/**
 * SHOP-DATEN
 *
 * Diese Datei ist die einzige Stelle, an der Preise, Varianten und die
 * Versandbedingungen als Daten stehen. Gebraucht wird sie vom Warenkorb und
 * von der Kaufbox – beide müssen rechnen können, und dafür brauchen sie die
 * Werte in JavaScript.
 *
 * WICHTIG: Preise und Titel stehen zusätzlich sichtbar in den HTML-Seiten.
 * Wenn du hier etwas änderst, ändere es auch dort – sonst zeigt die
 * Produktseite einen anderen Preis als der Warenkorb.
 *
 * Was in SHOP_TERMS steht, sind Versprechen an einen zahlenden Kunden.
 * Jeder Wert muss dem entsprechen, was du tatsächlich leisten kannst.
 */

/**
 * FARBEN UND GRÖSSEN
 *
 * Beide Schürzen gibt es in denselben drei Farben; die Kinderschürze zusätzlich
 * in drei Größen. Weil dieselbe Farbliste an mehreren Produkten hängt, steht
 * sie hier einmal und wird unten verwiesen – eine neue Farbe muss sonst an
 * drei Stellen gleich getippt werden.
 *
 * Die hex-Werte sind dieselben, die als Farbtupfer (.swatch) in den
 * Produktseiten stehen. Ändert sich hier einer, ändert er sich auch dort.
 */
var SHOP_COLOURS = [
  { id: "sand", label: "Sand", hex: "#D6C3A5" },
  { id: "rose", label: "Dusty pink", hex: "#D9A7A2" },
  { id: "grey", label: "Grey", hex: "#8E979B" }
];

/* Die Größen sind die drei Stufen des Schnittmusters. Das Alter ist eine
   Zusage an einen Käufer – wer "ab 8 Jahre" bestellt und die 34-cm-Schürze
   bekommt, schickt sie zurück. Die Maße dazu stehen sichtbar in der
   Größentabelle auf shop/kids-apron.html; beide müssen zusammenpassen. */
var SHOP_KIDS_SIZES = [
  { id: "4y", label: "From 4 years" },
  { id: "8y", label: "From 8 years" },
  { id: "12y", label: "From 12 years" }
];

/* Drei Positionen, aber nur zwei Dinge: die große Schürze, die kleine – und
   das Set, das beide zusammen billiger macht. Wer etwas hinzufügt, legt es
   hier an und in worker/src/catalog.js. Beide Listen müssen übereinstimmen. */
var SHOP_PRODUCTS = {
  /* Der Slug heißt weiter "linen-apron", obwohl die Schürze aus Waffelpiqué
     ist und nicht aus Leinen. Das ist Absicht: Am Slug hängen die Adresse
     shop/linen-apron.html, jeder geteilte Link darauf und die Warenkörbe im
     localStorage der Besucher. Ein Umbenennen macht alte Links zu 404 und
     leert offene Warenkörbe – für einen Namen, den nur die Adresszeile
     zeigt. Der Slug ist eine Kennung, kein Text für Kunden. */
  "linen-apron": {
    slug: "linen-apron",
    title: "Waffle apron »Dough Love«",
    type: "physical",
    price: 49.9,
    image: "assets/img/apron-adult.jpg",
    /* Eine Frage: die Farbe. Die Erwachsenenschürze hat nur eine Größe. */
    options: [{ id: "colour", legend: "Colour", choices: SHOP_COLOURS }]
  },

  "kids-apron": {
    slug: "kids-apron",
    title: "Kids' waffle apron »Little Dough Love«",
    type: "physical",
    price: 29.9,
    image: "assets/img/apron-kids.jpg",
    /* Zwei Fragen: Farbe und Größe. Als Kombination ausgeschrieben wären das
       neun Knöpfe unter einer Überschrift – zwei getrennte Auswahlen sind
       kürzer und lassen sich einzeln ändern. */
    options: [
      { id: "colour", legend: "Colour", choices: SHOP_COLOURS },
      { id: "size", legend: "Size", choices: SHOP_KIDS_SIZES }
    ],
    /** Überschrift der Zeile im Warenkorb. Ohne Angabe steht dort "Colour". */
    variantLegend: "Colour & size"
  },

  /* Das Set ist eine eigene Position, kein Rabatt auf zwei andere. Das ist die
     ehrlichste Bauart für einen Shop dieser Größe: Der Preis steht als eine
     Zahl im Katalog, die Kasse rechnet nichts zusammen, und es gibt keinen
     Zustand, in dem der Warenkorb je nach Reihenfolge des Hinzufügens etwas
     anderes kostet.

     Im Paket liegen zwei Schürzen, also werden drei Fragen gestellt: die Farbe
     der großen, die Farbe der kleinen und deren Größe. Ausgeschrieben wären
     das 27 Kombinationen – deshalb bekommt jede Frage ihre eigene Zeile, und
     jede Auswahl trägt vorn, zu welcher Schürze sie gehört. Genau dieser Text
     steht später auf der Stripe-Bestellung, nach der gepackt wird. */
  "apron-set": {
    slug: "apron-set",
    title: "Apron set »Dough Love« (adult + kids)",
    type: "physical",
    price: 69.9,
    /** Nur zur Anzeige: Summe der Einzelpreise, durchgestrichen neben dem Preis. */
    compareAtPrice: 79.8,
    image: "assets/img/apron-set.jpg",
    options: [
      {
        id: "adult-colour",
        legend: "Colour of the grown-up apron",
        prefix: "Adult",
        choices: SHOP_COLOURS
      },
      {
        id: "kids-colour",
        legend: "Colour of the kids' apron",
        prefix: "Kids",
        choices: SHOP_COLOURS
      },
      {
        id: "kids-size",
        legend: "Size of the kids' apron",
        prefix: "Kids size",
        choices: SHOP_KIDS_SIZES
      }
    ],
    /* Leer, nicht "Choice": Jede der drei Auswahlen trägt ihre Zuordnung schon
       selbst ("Adult: Sand"), eine Überschrift davor ergäbe im Warenkorb eine
       zweite Doppelpunkt-Ebene. */
    variantLegend: ""
  }
};

/**
 * Aus den Fragen die fertigen Varianten bauen.
 *
 * Der Warenkorb speichert je Zeile eine einzige Kennung, kein Objekt aus
 * mehreren Auswahlen – daran hängen der Vergleich zweier Zeilen, die Kasse und
 * der Text auf der Bestellung. Die Kennung ist deshalb die Aneinanderreihung
 * der gewählten Werte, getrennt durch "__": "sand__8y", beim Set
 * "sand__rose__8y". Die Reihenfolge ist die der Fragen oben; wer sie umstellt,
 * macht bestehende Warenkörbe ungültig.
 *
 * Erzeugt wird jede mögliche Kombination – neun bei der Kinderschürze, 27 beim
 * Set. Das ist eine Liste zum Nachschlagen, keine Lagerhaltung: Gebraucht wird
 * sie nur, um zu einer Kennung wieder die Beschriftung zu finden (Warenkorb).
 */
function buildVariants(options) {
  var variants = [{ id: "", label: "" }];

  options.forEach(function (group) {
    var next = [];

    variants.forEach(function (partial) {
      group.choices.forEach(function (choice) {
        next.push({
          id: partial.id ? partial.id + "__" + choice.id : choice.id,
          label:
            (partial.label ? partial.label + " · " : "") +
            (group.prefix ? group.prefix + ": " : "") +
            choice.label
        });
      });
    });

    variants = next;
  });

  return variants;
}

Object.keys(SHOP_PRODUCTS).forEach(function (slug) {
  var product = SHOP_PRODUCTS[slug];
  product.variants = product.options ? buildVariants(product.options) : [];
});

var SHOP_TERMS = {
  /** Versandpauschale innerhalb Deutschlands, in Euro. */
  shippingFlatRate: 4.9,
  /** Bestellwert, ab dem der Versand entfällt. null = keine Freigrenze. */
  freeShippingFrom: null,
  /**
   * Bewusst ohne Tagesangabe: Es wird schnell verschickt, aber keine konkrete
   * Laufzeit versprochen, die der Versanddienstleister nicht garantiert.
   */
  deliveryPromise: "Fast shipping",
  shipsTo: "all over the world",
  /** Gesetzliches Minimum in der EU sind 14 Tage. Nicht unterschreiten. */
  returnDays: 14,
  /**
   * Muss zu dem passen, was im Stripe-Dashboard unter Zahlungsmethoden
   * tatsächlich aktiviert ist. "Sofortüberweisung" stand hier früher – die
   * Methode gibt es nicht mehr, Stripe hat sie abgeschaltet. PayPal und
   * SEPA-Lastschrift standen bis September 2026 hier, tauchen an der echten
   * Kasse aber nicht auf (im Checkout geprüft) – nichts nennen, was der
   * Käufer dort nicht anklicken kann. Unter "Weitere Zahlungsmethoden"
   * zeigt Stripe je nach Land noch eps und andere lokale Verfahren.
   */
  paymentMethods: ["Card", "Apple Pay", "Klarna", "Link", "Amazon Pay"],
  /**
   * Seit dem 10.08.2026 false: Auf dem Worker liegt ein sk_live_-Schlüssel,
   * jede Kasse bucht echtes Geld ab (geprüft, die Session kam als cs_live_
   * zurück). Der Hinweis "nothing is charged" wäre damit eine Falschaussage
   * gegenüber dem Käufer.
   *
   * Wieder auf true, falls der Worker je auf einen Testschlüssel zurückfällt –
   * dieser Wert und der Schlüssel auf dem Worker müssen zusammenpassen, sonst
   * lügt die Seite in die eine oder die andere Richtung.
   */
  isPrototype: false
};

/**
 * KASSE
 *
 * Die Adresse des Cloudflare Workers aus worker/. Er rechnet den Warenkorb
 * neu durch und legt die Stripe-Session an. Das muss ein Server tun: Der
 * geheime Stripe-Schlüssel darf nicht in den Browser, und Beträge aus dem
 * localStorage des Besuchers darf niemand ungeprüft abrechnen.
 *
 * Nach "wrangler deploy" die ausgegebene Adresse hier eintragen.
 */
var SHOP_CHECKOUT = {
  endpoint: "https://constantinteck-checkout.constantinteck-checkout.workers.dev"
};

/* Lokale Vorschau: dann liegt die Kasse nebenan auf Port 8787
   ("npx wrangler dev" in worker/), nicht auf der veröffentlichten Adresse. */
if (
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
) {
  SHOP_CHECKOUT.endpoint = "http://localhost:8787";
}

/** Einheitliche Preisdarstellung: 44.9 -> "€44.90" */
function formatPrice(value) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
