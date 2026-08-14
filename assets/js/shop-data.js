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

/* Ein einziges Produkt. Der Warenkorb, die Kaufbox und cart-page.js kommen mit
   beliebig vielen Einträgen zurecht – wer wieder etwas verkaufen will, legt es
   hier an und in worker/src/catalog.js. Beide Listen müssen übereinstimmen. */
var SHOP_PRODUCTS = {
  "linen-apron": {
    slug: "linen-apron",
    title: "Linen apron »Dough Love«",
    type: "physical",
    price: 44.9,
    image: "https://placehold.co/800x800/E4CFB2/3B2A20?text=Linen+Apron",
    variants: [
      { id: "natural", label: "Natural" },
      { id: "berry", label: "Berry red" }
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
