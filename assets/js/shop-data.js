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
    /* Vorerst nur Natural. Eine leere Liste heißt: keine Auswahl an der
       Kaufbox, keine Farbe auf der Bestellung. Kommt Berry rot zurück, hier
       wieder { id: "natural", ... }, { id: "berry", ... } eintragen – und
       zeichengleich in worker/src/catalog.js, sonst weist die Kasse ab. */
    variants: []
  },

  "kids-apron": {
    slug: "kids-apron",
    title: "Kids' waffle apron »Little Dough Love«",
    type: "physical",
    price: 29.9,
    image: "assets/img/apron-kids.jpg",
    variants: []
  },

  /* Das Set ist eine eigene Position, kein Rabatt auf zwei andere. Das ist die
     ehrlichste Bauart für einen Shop dieser Größe: Der Preis steht als eine
     Zahl im Katalog, die Kasse rechnet nichts zusammen, und es gibt keinen
     Zustand, in dem der Warenkorb je nach Reihenfolge des Hinzufügens etwas
     anderes kostet.

     Solange es nur Natural gibt, hat das Set keine Varianten. Sobald eine
     zweite Farbe dazukommt, wird sie hier als Kombination gewählt: Eine
     Variantenliste je Produkt kann nur eine Frage stellen, hier sind es aber
     zwei Schürzen. Vier Kombinationen sind noch überschaubar – bei einer
     dritten Farbe wären es neun, dann braucht die Kaufbox zwei getrennte
     Auswahlen. */
  "apron-set": {
    slug: "apron-set",
    title: "Apron set »Dough Love« (adult + kids)",
    type: "physical",
    price: 69.9,
    /** Nur zur Anzeige: Summe der Einzelpreise, durchgestrichen neben dem Preis. */
    compareAtPrice: 79.8,
    image: "assets/img/apron-set.jpg",
    variants: []
  }
};

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
