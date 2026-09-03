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
    /* Vorerst nur Natural, deshalb keine Variante. Muss zu den Varianten in
       assets/js/shop-data.js passen: Steht dort eine Liste und hier nicht,
       geht die Farbe auf der Bestellung verloren; umgekehrt weist die Kasse
       jede Bestellung mit "Please choose an option" ab. */
    variants: {}
  },

  "kids-apron": {
    title: "Kids' waffle apron »Little Dough Love«",
    type: "physical",
    amount: 2990,
    taxCode: TAX_TANGIBLE,
    variants: {}
  },

  /* Eigene Position mit eigenem Preis statt eines Rabatts auf zwei Zeilen –
     die Begründung steht bei apron-set in assets/js/shop-data.js. Sobald es
     mehr als eine Farbe gibt, stecken hier beide Farben in einer Variante,
     und genau dieser Text steht später auf der Stripe-Bestellung, nach der
     gepackt wird. */
  "apron-set": {
    title: "Apron set »Dough Love« (adult + kids)",
    type: "physical",
    amount: 6990,
    taxCode: TAX_TANGIBLE,
    variants: {}
  }
};

/**
 * Versandbedingungen. Gleiche Werte wie SHOP_TERMS in shop-data.js – der
 * Besucher sieht sie im Warenkorb, berechnet werden sie hier.
 */
export const SHIPPING = {
  flatRateCents: 490,
  /* null = keine Freigrenze. Die Pauschale fällt bei jeder Warensendung an,
     egal wie hoch der Bestellwert ist – so steht es auch in den AGB. */
  freeFromCents: null,
  /* Es wird weltweit verschickt. Stripe kennt für allowed_countries keinen
     Platzhalter "überall", sondern nur diese feste Aufzählung – Wortlaut aus
     der API-Referenz (docs.stripe.com/api/checkout/sessions/create, Parameter
     shipping_address_collection.allowed_countries). Länder wie Kuba, Iran,
     Nordkorea oder Syrien stehen dort nicht drin und fehlen deshalb auch
     hier. Nicht aus dem Kopf ergänzen: Ein einziger Code, den Stripe nicht
     kennt, lässt jede Kasse mit einem Fehler auflaufen. ZZ aus dem Enum ist
     bewusst weggelassen, das ist kein Lieferziel. */
  countries: [
    "AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR",
    "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG",
    "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT",
    "BV", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH", "CI", "CK",
    "CL", "CM", "CN", "CO", "CR", "CV", "CW", "CY", "CZ", "DE", "DJ",
    "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET",
    "FI", "FJ", "FK", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG",
    "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU",
    "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM",
    "IN", "IO", "IQ", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG",
    "KH", "KI", "KM", "KN", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
    "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD",
    "ME", "MF", "MG", "MK", "ML", "MM", "MN", "MO", "MQ", "MR", "MS",
    "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NG",
    "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF",
    "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PY", "QA",
    "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG",
    "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST",
    "SV", "SX", "SZ", "TA", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
    "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG",
    "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VN", "VU", "WF", "WS",
    "XK", "YE", "YT", "ZA", "ZM", "ZW"
  ]
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

  /* Reine PDF-Bestellungen werden nie versandt. Eine Freigrenze gibt es
     derzeit nicht; der Zweig bleibt für den Fall stehen, dass wieder eine
     eingeführt wird – genau wie es cart-page.js dem Kunden vorrechnet. */
  const shippingFree =
    SHIPPING.freeFromCents !== null && subtotal >= SHIPPING.freeFromCents;
  const shippingCents = hasPhysical && !shippingFree ? SHIPPING.flatRateCents : 0;

  return { lines, subtotal, hasPhysical, hasDigital, shippingCents };
}

export class BadCart extends Error {}
