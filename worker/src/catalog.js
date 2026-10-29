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
 * Farben und Größen – zeichengleich zu SHOP_COLOURS und SHOP_KIDS_SIZES in
 * assets/js/shop-data.js. Die Beschriftungen von hier stehen später auf der
 * Stripe-Bestellung, nach der gepackt wird; die Kennungen ("sand", "8y")
 * kommen aus dem Browser und müssen deshalb auf beiden Seiten gleich heißen.
 */
const COLOURS = [
  { id: "sand", label: "Sand" },
  { id: "rose", label: "Mauve" }, // Kennung bleibt "rose" (früher Dusty pink)
  { id: "grey", label: "Grey" }
];

const KIDS_SIZES = [
  { id: "4y", label: "From 4 years" },
  { id: "8y", label: "From 8 years" },
  { id: "12y", label: "From 12 years" }
];

/**
 * Baut aus den Fragen zu einem Produkt die Tabelle "Kennung -> Beschriftung".
 *
 * Der Browser schickt eine einzige Kennung je Zeile, in der alle Auswahlen
 * stecken: "sand__8y", beim Set "sand__rose__8y". Dieselbe Reihenfolge und
 * dasselbe Trennzeichen wie in buildVariants() in assets/js/shop-data.js –
 * weicht eines davon ab, weist die Kasse jede Bestellung ab.
 */
function variantsFrom(groups) {
  let variants = [["", ""]];

  for (const group of groups) {
    const next = [];

    for (const [partialId, partialLabel] of variants) {
      for (const choice of group.choices) {
        next.push([
          partialId ? partialId + "__" + choice.id : choice.id,
          (partialLabel ? partialLabel + " · " : "") +
            (group.prefix ? group.prefix + ": " : "") +
            choice.label
        ]);
      }
    }

    variants = next;
  }

  return Object.fromEntries(variants);
}

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
    /* Nur die Farbe – die große Schürze hat eine Größe. Muss zu den Optionen in
       assets/js/shop-data.js passen: Fehlt hier eine Farbe, die die Seite
       anbietet, weist die Kasse die Bestellung mit "Please choose an option"
       ab, obwohl der Käufer gewählt hat. */
    variants: variantsFrom([{ choices: COLOURS }])
  },

  "kids-apron": {
    title: "Kids' waffle apron »Little Dough Love«",
    type: "physical",
    amount: 2990,
    taxCode: TAX_TANGIBLE,
    /* Farbe und Größe – neun Kombinationen. Die Größe ist die wichtigste
       Angabe auf der Bestellung: Danach wird zugeschnitten. */
    variants: variantsFrom([{ choices: COLOURS }, { choices: KIDS_SIZES }])
  },

  /* Eigene Position mit eigenem Preis statt eines Rabatts auf zwei Zeilen –
     die Begründung steht bei apron-set in assets/js/shop-data.js. Im Paket
     liegen zwei Schürzen, deshalb drei Auswahlen: beide Farben und die Größe
     der kleinen. Die Vorsilben stehen mit auf der Bestellung, damit beim
     Packen nicht geraten werden muss, welche Farbe zu welcher Schürze gehört. */
  "apron-set": {
    title: "Apron set »Dough Love« (adult + kids)",
    type: "physical",
    amount: 6990,
    taxCode: TAX_TANGIBLE,
    variants: variantsFrom([
      { prefix: "Adult", choices: COLOURS },
      { prefix: "Kids", choices: COLOURS },
      { prefix: "Kids size", choices: KIDS_SIZES }
    ])
  }
};

/**
 * Versandbedingungen. Gleiche Zonen und Preise wie SHOP_SHIPPING_ZONES in
 * shop-data.js – der Besucher wählt die Zone im Warenkorb, berechnet und
 * durchgesetzt wird sie hier: Die Stripe-Kasse lässt nur Lieferadressen aus
 * den Ländern der gewählten Zone zu. Wer "Deutschland" wählt und eine
 * Adresse in Japan eingibt, kommt nicht durch.
 *
 * Stand 29.10.2026: Preise nach DHL Paket bis 2 kg (Online-Frankierung,
 * Preisübersicht auf dhl.de geprüft). Deutschland genau zum DHL-Preis
 * 6,19 €; Ausland auf ,90 aufgerundet (EU 14,49, CH/GB 19,49, übriges
 * Europa 22,49, Welt bis 27,49 €). Zonen folgen den DHL-Zonen; Monaco
 * gehört bei DHL zur EU-Zone. Lieferzeiten sind geschätzt, mit Puffer. Ändert sich hier etwas, auch AGB § 4 und § 6,
 * shipping-returns.html und SHOP_SHIPPING_ZONES anpassen.
 *
 * Ländercodes nur aus der Liste, die Stripe für allowed_countries kennt
 * (docs.stripe.com/api/checkout/sessions/create). Nicht aus dem Kopf
 * ergänzen: Ein einziger Code, den Stripe nicht kennt, lässt jede Kasse mit
 * einem Fehler auflaufen. Bewusst in keiner Zone: Belarus und Russland
 * (Sanktionen, DHL liefert nicht) sowie unbewohnte oder kaum erreichbare
 * Gebiete (AQ, BV, GS, TF, AC, TA, PN, IO).
 */
export const SHIPPING = {
  /* null = keine Freigrenze. Die Versandkosten fallen bei jeder
     Warensendung an, egal wie hoch der Bestellwert ist. */
  freeFromCents: null,
  zones: {
    de: {
      label: "Germany",
      cents: 619,
      days: [3, 5],
      countries: ["DE"]
    },
    eu: {
      label: "European Union & Monaco",
      cents: 1490,
      days: [5, 8],
      countries: [
        "AT", "BE", "BG", "CY", "CZ", "DK", "EE", "ES", "FI", "FR", "GR",
        "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MC", "MT", "NL", "PL", "PT",
        "RO", "SE", "SI", "SK"
      ]
    },
    "ch-gb": {
      label: "Switzerland & United Kingdom",
      cents: 1990,
      days: [6, 10],
      countries: ["CH", "GB"]
    },
    europe: {
      label: "Rest of Europe",
      cents: 2290,
      days: [6, 10],
      countries: [
        "AD", "AL", "AX", "BA", "FO", "GG", "GI", "IM", "IS", "JE", "LI",
        "MD", "ME", "MK", "NO", "RS", "SJ", "SM", "TR", "UA", "VA",
        "XK"
      ]
    },
    world: {
      label: "Rest of the world",
      cents: 2990,
      days: [10, 20],
      countries: [
        "AE", "AF", "AG", "AI", "AM", "AO", "AR", "AU", "AW", "AZ", "BB",
        "BD", "BF", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR",
        "BS", "BT", "BW", "BZ", "CA", "CD", "CF", "CG", "CI", "CK", "CL",
        "CM", "CN", "CO", "CR", "CV", "CW", "DJ", "DM", "DO", "DZ", "EC",
        "EG", "EH", "ER", "ET", "FJ", "FK", "GA", "GD", "GE", "GF", "GH",
        "GL", "GM", "GN", "GP", "GQ", "GT", "GU", "GW", "GY", "HK", "HN",
        "HT", "ID", "IL", "IN", "IQ", "JM", "JO", "JP", "KE", "KG", "KH",
        "KI", "KM", "KN", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LK",
        "LR", "LS", "LY", "MA", "MF", "MG", "ML", "MM", "MN", "MO", "MQ",
        "MR", "MS", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE",
        "NG", "NI", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
        "PH", "PK", "PM", "PR", "PS", "PY", "QA", "RE", "RW", "SA", "SB",
        "SC", "SD", "SG", "SH", "SL", "SN", "SO", "SR", "SS", "ST", "SV",
        "SX", "SZ", "TC", "TD", "TG", "TH", "TJ", "TK", "TL", "TM", "TN",
        "TO", "TT", "TV", "TW", "TZ", "UG", "US", "UY", "UZ", "VC", "VE",
        "VG", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
      ]
    }
  }
};

/** Höchstmenge je Position – bremst Unfug und Tippfehler. */
const MAX_QUANTITY = 20;

/**
 * Prüft den Warenkorb aus dem Browser und übersetzt ihn in Positionen mit
 * Preisen aus diesem Katalog. Wirft bei allem, was nicht zusammenpasst –
 * lieber gar keine Kasse als eine mit falschen Beträgen.
 */
export function resolveCart(rawLines, zoneId) {
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

  // Ohne Angabe Deutschland – so verhielt sich die Kasse vor den Zonen, und
  // ein alter Warenkorb im Browser schickt noch keine Zone mit.
  const zone = SHIPPING.zones[zoneId || "de"];
  if (hasPhysical && !zone) {
    throw new BadCart("Please choose where the order should be shipped.");
  }
  const shippingCents = hasPhysical && !shippingFree ? zone.cents : 0;

  return { lines, subtotal, hasPhysical, hasDigital, shippingCents, zone };
}

export class BadCart extends Error {}
