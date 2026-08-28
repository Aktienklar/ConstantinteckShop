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
    variants: [
      { id: "natural", label: "Natural" },
      { id: "berry", label: "Berry red" }
    ]
  },

  "kids-apron": {
    slug: "kids-apron",
    title: "Kids' waffle apron »Little Dough Love«",
    type: "physical",
    price: 29.9,
    image: "assets/img/apron-kids.jpg",
    variants: [
      { id: "natural", label: "Natural" },
      { id: "berry", label: "Berry red" }
    ]
  },

  /* Das Set ist eine eigene Position, kein Rabatt auf zwei andere. Das ist die
     ehrlichste Bauart für einen Shop dieser Größe: Der Preis steht als eine
     Zahl im Katalog, die Kasse rechnet nichts zusammen, und es gibt keinen
     Zustand, in dem der Warenkorb je nach Reihenfolge des Hinzufügens etwas
     anderes kostet.

     Die Farbe wird deshalb als Kombination gewählt: Eine Variantenliste je
     Produkt kann nur eine Frage stellen, hier sind es aber zwei Schürzen.
     Vier Kombinationen sind noch überschaubar – bei einer dritten Farbe wären
     es neun, dann braucht die Kaufbox zwei getrennte Auswahlen. */
  "apron-set": {
    slug: "apron-set",
    title: "Apron set »Dough Love« (adult + kids)",
    type: "physical",
    price: 69.9,
    /** Nur zur Anzeige: Summe der Einzelpreise, durchgestrichen neben dem Preis. */
    compareAtPrice: 79.8,
    /** Überschrift der Variante im Warenkorb. Ohne Angabe steht dort "Colour". */
    variantLegend: "Colours",
    image: "assets/img/apron-set.jpg",
    variants: [
      { id: "natural-natural", label: "Both Natural" },
      { id: "berry-berry", label: "Both Berry red" },
      { id: "natural-berry", label: "Adult Natural · Kids Berry" },
      { id: "berry-natural", label: "Adult Berry · Kids Natural" }
    ]
  }
};

var SHOP_TERMS = {
  /** Versandpauschale innerhalb Deutschlands, in Euro. */
  shippingFlatRate: 4.9,
  /** Bestellwert, ab dem der Versand entfällt. null = keine Freigrenze. */
  freeShippingFrom: 60,
  deliveryTime: "2–4 working days",
  shipsTo: "Germany and Austria",
  /** Gesetzliches Minimum in der EU sind 14 Tage. Nicht unterschreiten. */
  returnDays: 14,
  /**
   * Muss zu dem passen, was im Stripe-Dashboard unter Zahlungsmethoden
   * tatsächlich aktiviert ist. "Sofortüberweisung" stand hier früher – die
   * Methode gibt es nicht mehr, Stripe hat sie abgeschaltet.
   */
  paymentMethods: ["Credit card", "PayPal", "Klarna", "SEPA Direct Debit"],
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
