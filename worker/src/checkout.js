/**
 * KASSE ANLEGEN
 *
 * Nimmt den Warenkorb aus dem Browser entgegen, bepreist ihn neu aus dem
 * eigenen Katalog und legt daraus eine Stripe-Checkout-Session an. Der
 * Besucher wird anschließend auf die von Stripe gehostete Seite geschickt.
 */

import { CURRENCY, SHIPPING, resolveCart, BadCart } from "./catalog.js";

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
    cart = resolveCart(body.lines);
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
    success_url: siteBase + "/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: siteBase + "/cart.html",
    // Für eine Rechnung nach deutschem Recht wird die Anschrift gebraucht,
    // auch bei reinen PDF-Bestellungen.
    billing_address_collection: "required",
    // Stripe zeigt die Kasse in der Sprache des Browsers; Preise werden
    // dadurch auch richtig formatiert (19,90 € statt €19.90).
    locale: "auto",
    metadata: {
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
    params.shipping_address_collection = { allowed_countries: SHIPPING.countries };
    params.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name:
            cart.shippingCents === 0 ? "Shipping (free)" : "Shipping",
          fixed_amount: { amount: cart.shippingCents, currency: CURRENCY },
          tax_behavior: "inclusive",
          delivery_estimate: {
            minimum: { unit: "business_day", value: SHIPPING.minDays },
            maximum: { unit: "business_day", value: SHIPPING.maxDays }
          }
        }
      }
    ];
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
  }

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

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}
