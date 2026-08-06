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
  },
  "dough-scraper-set": {
    slug: "dough-scraper-set",
    title: "Dough scraper set (3 pieces)",
    type: "physical",
    price: 14.9,
    image: "https://placehold.co/800x800/F6ECDD/3B2A20?text=Scraper+Set",
    variants: []
  },
  "baking-book-pdf": {
    slug: "baking-book-pdf",
    title: "Sweet & Simple – The Baking Book (PDF)",
    type: "digital",
    price: 19.9,
    image: "https://placehold.co/800x1000/D4517A/FFFFFF?text=Baking+Book+PDF",
    variants: []
  },
  "weeknight-pdf": {
    slug: "weeknight-pdf",
    title: "Weeknight Kitchen – 30 everyday dishes (PDF)",
    type: "digital",
    price: 12.9,
    image: "https://placehold.co/800x1000/4F7C4A/FFFFFF?text=Weeknight+PDF",
    variants: []
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
  paymentMethods: ["PayPal", "Credit card", "Instant bank transfer"],
  /**
   * Auf false setzen, sobald eine echte Kasse angebunden ist. Solange true,
   * sagt die Seite überall, dass keine echte Bestellung zustande kommt –
   * ohne diesen Hinweis würde der Shop Bestellungen annehmen, die er nicht
   * erfüllen kann.
   */
  isPrototype: true
};

/** Einheitliche Preisdarstellung: 44.9 -> "€44.90" */
function formatPrice(value) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
