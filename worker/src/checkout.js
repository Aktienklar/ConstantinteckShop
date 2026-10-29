/**
 * KASSE ANLEGEN
 *
 * Nimmt den Warenkorb aus dem Browser entgegen, bepreist ihn neu aus dem
 * eigenen Katalog und legt daraus eine Stripe-Checkout-Session an. Der
 * Besucher wird anschließend auf die von Stripe gehostete Seite geschickt.
 */

import { CURRENCY, resolveCart, BadCart } from "./catalog.js";

/**
 * Der Verzicht auf das Widerrufsrecht muss vor dem Kauf ausdrücklich erklärt
 * werden, sonst kann der Käufer die PDF behalten und trotzdem widerrufen.
 * Die Zustimmung holt cart.html ein; hier wird sie nur noch geprüft und mit
 * Zeitstempel an der Bestellung vermerkt.
 *
 * Diesen Text hat kein Anwalt gesehen – vor dem Livegang prüfen lassen.
 */
const WITHDRAWAL_WAIVER =
  "Buyer agreed that the download starts immediately and acknowledged that " +
  "the 14-day right of withdrawal lapses once it does.";

export async function createCheckoutSession(request, env, stripe) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("We could not read that request.", 400);
  }

  let cart;
  try {
    cart = resolveCart(body.lines, body.shippingZone);
  } catch (error) {
    if (error instanceof BadCart) return jsonError(error.message, 400);
    throw error;
  }

  // Ohne erklärten Verzicht keine PDF-Bestellung.
  if (cart.hasDigital && body.waivesWithdrawal !== true) {
    return jsonError(
      "Please confirm the note about the instant download before paying.",
      400
    );
  }

  const siteBase = env.SITE_BASE.replace(/\/$/, "");

  /* Eigene, kurze Bestellnummer. Sie steht in der Bestellbestätigung und auf
     der Erfolgsseite, und der Kunde gibt sie bei einem Widerruf an. Im
     Stripe-Dashboard findet man die Zahlung über die Suche nach ihr
     (Beschreibung und Metadaten der Zahlung). */
  const orderNumber = newOrderNumber();

  const params = {
    mode: "payment",
    line_items: cart.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: CURRENCY,
        unit_amount: line.product.amount,
        // Die Preise auf der Website sind Bruttopreise – die Steuer ist
        // enthalten und wird nicht obendrauf gerechnet.
        tax_behavior: "inclusive",
        product_data: {
          name: line.variantLabel
            ? line.product.title + " – " + line.variantLabel
            : line.product.title,
          tax_code: line.product.taxCode,
          metadata: { slug: line.slug }
        }
      }
    })),
    // Der Knopf heißt dann "Bezahlen" / "Pay". Eine Beschriftung
    // "zahlungspflichtig bestellen" bietet Stripe nicht an – der Hinweis
    // darauf steht deshalb in custom_text.submit direkt darüber.
    submit_type: "pay",
    success_url: siteBase + "/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: siteBase + "/cart.html",
    // Für eine Rechnung nach deutschem Recht wird die Anschrift gebraucht,
    // auch bei reinen PDF-Bestellungen.
    billing_address_collection: "required",
    // Stripe zeigt die Kasse in der Sprache des Browsers; Preise werden
    // dadurch auch richtig formatiert (19,90 € statt €19.90).
    locale: "auto",
    payment_intent_data: {
      description: "Order " + orderNumber,
      metadata: { order_number: orderNumber }
    },
    metadata: {
      order_number: orderNumber,
      // Was ausgeliefert werden muss, steht an der Bestellung selbst. Der
      // Webhook soll sich nicht darauf verlassen, dass es diesen Warenkorb
      // im Browser noch gibt.
      digital_slugs: cart.lines
        .filter((l) => l.product.type === "digital")
        .map((l) => l.slug)
        .join(","),
      physical_slugs: cart.lines
        .filter((l) => l.product.type === "physical")
        .map((l) => (l.variantId ? l.slug + ":" + l.variantId : l.slug))
        .join(",")
    }
  };

  if (cart.hasDigital) {
    params.metadata.withdrawal_waiver = WITHDRAWAL_WAIVER;
    params.metadata.withdrawal_waiver_at = new Date().toISOString();
  }

  if (cart.hasPhysical) {
    /* Nur Länder der im Warenkorb gewählten Zone – sonst ließe sich eine
       Lieferung nach Übersee zum Preis für Deutschland bestellen. */
    params.shipping_address_collection = { allowed_countries: cart.zone.countries };
    params.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name:
            (cart.shippingCents === 0 ? "Shipping (free)" : "Shipping") +
            " – " + cart.zone.label,
          fixed_amount: { amount: cart.shippingCents, currency: CURRENCY },
          tax_behavior: "inclusive",
          /* Dieselben Werktage wie in AGB § 6 und auf shipping-returns.html. */
          delivery_estimate: {
            minimum: { unit: "business_day", value: cart.zone.days[0] },
            maximum: { unit: "business_day", value: cart.zone.days[1] }
          }
        }
      }
    ];
    params.metadata.shipping_zone = body.shippingZone || "de";
  }

  /* Stripe Tax rechnet nur richtig, wenn im Dashboard eine Steuerregistrierung
     und eine Herkunftsadresse hinterlegt sind. Vorher würde jede Session mit
     einem Fehler abbrechen – deshalb ein Schalter statt fest an. */
  if (env.AUTOMATIC_TAX === "true") {
    params.automatic_tax = { enabled: true };
  }

  /* Häkchen "Ich akzeptiere die AGB" an der Kasse. Stripe verweigert die
     Session, solange unter "Public details" im Dashboard keine AGB-Adresse
     hinterlegt ist – deshalb ebenfalls ein Schalter. Für einen deutschen Shop
     gehört das eingeschaltet, sobald die AGB-Seite fertig ist. */
  if (env.TOS_CONSENT === "true") {
    params.consent_collection = { terms_of_service: "required" };
    /* Text am AGB-Häkchen: verlinkt zusätzlich Widerrufsbelehrung und
       Datenschutz, die Stripe von sich aus nicht nennt. Zweisprachig, weil
       Stripe die Kasse in der Browsersprache zeigt, dieser Text aber fest
       ist. Höchstens 1200 Zeichen. */
    params.custom_text = {
      terms_of_service_acceptance: {
        message:
          "I agree to the [terms](" + siteBase + "/terms.html) and have read the " +
          "[withdrawal instructions](" + siteBase + "/shipping-returns.html#widerruf) and the " +
          "[privacy policy](" + siteBase + "/privacy.html). · Ich akzeptiere die " +
          "[AGB](" + siteBase + "/terms.html) und habe die " +
          "[Widerrufsbelehrung](" + siteBase + "/shipping-returns.html#widerruf) und die " +
          "[Datenschutzerklärung](" + siteBase + "/privacy.html) gelesen."
      }
    };
  }

  // Direkt über dem Bezahlknopf (§ 312j Abs. 3 BGB: Zahlungspflicht deutlich machen).
  params.custom_text = Object.assign({}, params.custom_text, {
    submit: {
      message:
        "Clicking “Pay” places a binding order that you must pay for. · " +
        "Mit Klick auf „Bezahlen“ bestellst du zahlungspflichtig."
    }
  });

  // E-Mail vorbelegen, falls die Seite sie schon kennt – spart einen Schritt.
  if (typeof body.email === "string" && body.email.includes("@")) {
    params.customer_email = body.email.slice(0, 200);
  }

  const session = await stripe.checkout.sessions.create(params, {
    // Ein Doppelklick auf "Zur Kasse" darf keine zweite Session anlegen.
    idempotencyKey: body.idempotencyKey || undefined
  });

  return Response.json({ url: session.url });
}

/** "CT-7K3QX9MD" – ohne leicht verwechselbare Zeichen (0/O, 1/I/L). */
function newOrderNumber() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return "CT-" + code;
}

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}
