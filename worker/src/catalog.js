/**
 * VERTRAUENSWÜRDIGER KATALOG
 *
 * Das ist die einzige Preisliste, der die Kasse glaubt. Der Browser schickt
 * nur Slug, Variante und Menge – niemals einen Betrag. Würden wir den Preis
 * aus dem Warenkorb des Besuchers übernehmen, könnte sich jeder die Schürze
 * über die Entwicklertools für einen Cent bestellen.
 *
 * WICHTIG: Diese Beträge müssen zu assets/js/shop-data.js passen. Dort stehen
 * sie in Euro (49.9), hier in Cent (4990) – Stripe rechnet in der kleinsten
 * Währungseinheit.
 */

export const CURRENCY = "eur";

/** txcd_99999999 = "General – Tangible Goods". */
const TAX_TANGIBLE = "txcd_99999999";

/**
 * Verkauft werden die beiden Schürzen und das Set aus beiden. Kommt wieder
 * eine Rezeptsammlung als PDF dazu, gehört sie hier und in
 * assets/js/shop-data.js angelegt – mit type:"digital", einem file-Schlüssel
 * für den R2-Bucket, dem Steuercode txcd_10302000 ("Digital Books –
 * downloaded – non subscription – with permanent rights", in Deutschland
 * ermäßigte 7 % statt 19 %), und den in wrangler.toml auskommentierten
 * Blöcken für R2 und KV.
 */
export const PRODUCTS = {
  /* "linen-apron" ist ein historischer Slug – die Schürze ist aus Waffelpiqué.
     Er muss zeichengleich zu assets/js/shop-data.js bleiben, sonst weist die
     Kasse jede Bestellung mit "Unknown product" ab. Siehe die Begründung dort. */
  "linen-apron": {
    title: "Waffle apron »Dough Love«",
    type: "physical",
    amount: 4990,
    taxCode: TAX_TANGIBLE,
    variants: {
      natural: "Natural",
      berry: "Berry red"
    }
  },

  "kids-apron": {
    title: "Kids' waffle apron »Little Dough Love«",
    type: "physical",
    amount: 2990,
    taxCode: TAX_TANGIBLE,
    variants: {
      natural: "Natural",
      berry: "Berry red"
    }
  },

  /* Eigene Position mit eigenem Preis statt eines Rabatts auf zwei Zeilen –
     die Begründung steht bei apron-set in assets/js/shop-data.js. Wichtig für
     das Packen der Bestellung: In der Variante stecken beide Farben, und
     genau dieser Text steht später auf der Stripe-Bestellung. */
  "apron-set": {
    title: "Apron set »Dough Love« (adult + kids)",
    type: "physical",
    amount: 6990,
    taxCode: TAX_TANGIBLE,
    variants: {
      "natural-natural": "Both Natural",
      "berry-berry": "Both Berry red",
      "natural-berry": "Adult Natural · Kids Berry",
      "berry-natural": "Adult Berry · Kids Natural"
    }
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
