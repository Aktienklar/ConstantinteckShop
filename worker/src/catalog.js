/**
 * VERTRAUENSWÜRDIGER KATALOG
 *
 * Das ist die einzige Preisliste, der die Kasse glaubt. Der Browser schickt
 * nur Slug, Variante und Menge – niemals einen Betrag. Würden wir den Preis
 * aus dem Warenkorb des Besuchers übernehmen, könnte sich jeder die Schürze
 * über die Entwicklertools für einen Cent bestellen.
 *
 * WICHTIG: Diese Beträge müssen zu assets/js/shop-data.js passen. Dort stehen
 * sie in Euro (44.9), hier in Cent (4490) – Stripe rechnet in der kleinsten
 * Währungseinheit.
 */

export const CURRENCY = "eur";

/**
 * txcd_10302000 = "Digital Books – downloaded – non subscription – with
 * permanent rights". Stripe nennt Kochbücher in der Beschreibung dieses Codes
 * ausdrücklich. In Deutschland gilt dafür der ermäßigte Satz von 7 % – mit dem
 * allgemeinen Code für elektronische Dienstleistungen wären es 19 %.
 */
const TAX_DIGITAL_BOOK = "txcd_10302000";
/** txcd_99999999 = "General – Tangible Goods". */
const TAX_TANGIBLE = "txcd_99999999";

export const PRODUCTS = {
  "linen-apron": {
    title: "Linen apron »Dough Love«",
    type: "physical",
    amount: 4490,
    taxCode: TAX_TANGIBLE,
    variants: {
      natural: "Natural",
      berry: "Berry red"
    }
  },
  "dough-scraper-set": {
    title: "Dough scraper set (3 pieces)",
    type: "physical",
    amount: 1490,
    taxCode: TAX_TANGIBLE,
    variants: {}
  },
  /* Die beiden PDFs sind vorbereitet, aber NICHT verkäuflich: available:false.
     Verkauft wird vorerst nur die Schürze. Bevor eine PDF freigeschaltet wird,
     muss dreierlei stehen – die Datei im R2-Bucket, der Mailversand für den
     Download-Link, und das Widerrufs-Häkchen im Warenkorb. Sonst zahlt jemand
     und bekommt nichts. Zum Freischalten: available auf true setzen und in
     wrangler.toml die Blöcke für R2 und KV wieder einkommentieren. */
  "baking-book-pdf": {
    title: "Sweet & Simple – The Baking Book (PDF)",
    type: "digital",
    available: false,
    amount: 1990,
    taxCode: TAX_DIGITAL_BOOK,
    variants: {},
    /** Objektschlüssel im R2-Bucket. */
    file: "sweet-and-simple-baking-book.pdf"
  },
  "weeknight-pdf": {
    title: "Weeknight Kitchen – 30 everyday dishes (PDF)",
    type: "digital",
    available: false,
    amount: 1290,
    taxCode: TAX_DIGITAL_BOOK,
    variants: {},
    file: "weeknight-kitchen.pdf"
  }
};

/**
 * Versandbedingungen. Gleiche Werte wie SHOP_TERMS in shop-data.js – der
 * Besucher sieht sie im Warenkorb, berechnet werden sie hier.
 */
export const SHIPPING = {
  flatRateCents: 490,
  freeFromCents: 6000,
  countries: ["DE", "AT"],
  minDays: 2,
  maxDays: 4
};

/** Höchstmenge je Position – bremst Unfug und Tippfehler. */
const MAX_QUANTITY = 20;

/**
 * Prüft den Warenkorb aus dem Browser und übersetzt ihn in Positionen mit
 * Preisen aus diesem Katalog. Wirft bei allem, was nicht zusammenpasst –
 * lieber gar keine Kasse als eine mit falschen Beträgen.
 */
export function resolveCart(rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new BadCart("Your cart is empty.");
  }
  if (rawLines.length > 20) {
    throw new BadCart("Too many different items in one order.");
  }

  const lines = rawLines.map((line) => {
    const product = PRODUCTS[line && line.productSlug];
    if (!product) {
      throw new BadCart("Unknown product: " + String(line && line.productSlug));
    }

    // Vorbereitet, aber noch nicht lieferbar.
    if (product.available === false) {
      throw new BadCart(product.title + " is not on sale yet.");
    }

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new BadCart("Invalid quantity for " + product.title + ".");
    }

    // Eine Variante muss es geben, wenn das Produkt welche hat – und sie muss
    // aus dem Katalog stammen, nicht aus der Anfrage.
    const variantIds = Object.keys(product.variants);
    let variantId = line.variantId || null;
    if (variantIds.length > 0) {
      if (!variantId || !product.variants[variantId]) {
        throw new BadCart("Please choose an option for " + product.title + ".");
      }
    } else {
      variantId = null;
    }

    return {
      slug: line.productSlug,
      product,
      quantity,
      variantId,
      variantLabel: variantId ? product.variants[variantId] : null
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.product.amount * l.quantity, 0);
  const hasPhysical = lines.some((l) => l.product.type === "physical");
  const hasDigital = lines.some((l) => l.product.type === "digital");

  /* Reine PDF-Bestellungen werden nie versandt, und die Freigrenze zählt auf
     den Warenwert – genau wie es cart-page.js dem Kunden vorrechnet. */
  const shippingCents =
    hasPhysical && subtotal < SHIPPING.freeFromCents ? SHIPPING.flatRateCents : 0;

  return { lines, subtotal, hasPhysical, hasDigital, shippingCents };
}

export class BadCart extends Error {}
