/**
 * ADMIN: BESTELLUNGEN UND UMSATZ AUS STRIPE
 *
 *   GET /api/admin/orders?days=N   Token  ->  Bestellungen, Umsatz, Kasse
 *
 * Liest nur. Am Bezahlablauf (checkout.js, webhook.js, download.js) ändert
 * diese Datei nichts – sie fragt Stripe dieselben Checkout-Sessions ab, die
 * checkout.js angelegt hat.
 *
 * Gebraucht wird STRIPE_SECRET_KEY mit Leserecht auf Checkout Sessions (ein
 * voller Secret Key hat es; ein eingeschränkter "rk_…" braucht "Checkout
 * Sessions: Read").
 *
 * Damit nicht jeder Aufruf der Admin-Seite Dutzende Anfragen an Stripe
 * auslöst, liegt das Ergebnis 5 Minuten im KV-Namespace ADMIN_CACHE. Ohne
 * diese Bindung wird jedes Mal frisch gefragt. Bewusst NICHT im KV "ORDERS":
 * Sobald es gebunden ist, schaltet webhook.js seine Doppelzustellungs-Sperre
 * ein – das soll eine Statistik nicht nebenbei auslösen.
 *
 * Personenbezogenes verlässt den Worker nur gekürzt: Land, E-Mail als
 * "ma…@gmail.com", kein Name, keine Anschrift.
 */

import { PRODUCTS } from "./catalog.js";
import { requireLogin, rangeFrom } from "./admin.js";

const CACHE_SECONDS = 300;
// 100 Sessions je Seite – 20 Seiten reichen für 2000 Kassenvorgänge.
const MAX_PAGES = 20;
const RECENT = 15;

// "Waffle apron »Dough Love«" -> "physical": Die Bestellposition trägt den
// Produktnamen aus checkout.js, ggf. mit " – Variante" dahinter.
const TYPE_BY_TITLE = Object.fromEntries(Object.values(PRODUCTS).map((p) => [p.title, p.type]));

export async function adminOrders(request, url, env) {
  const denied = await requireLogin(request, env);
  if (denied) return denied;
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "STRIPE_SECRET_KEY fehlt im Worker." }, { status: 503 });
  }

  const { days, start } = rangeFrom(url);
  const sessions = await cachedSessions(env, days, Math.floor(Date.parse(start) / 1000));
  return Response.json({ days, ...summarize(sessions) });
}

/* --- Auswertung ------------------------------------------------------------ */

export function summarize(sessions) {
  const live = sessions.filter((s) => s.livemode);
  const paid = live.filter((s) => s.status === "complete" && s.paid);
  const pending = live.filter((s) => s.status === "complete" && !s.paid);

  const products = {};
  let digital = 0;
  let physical = 0;
  for (const order of paid) {
    for (const item of order.items) {
      const row = (products[item.product] = products[item.product] || { name: item.product, type: item.type, quantity: 0, revenue: 0 });
      row.quantity += item.quantity;
      row.revenue += item.amount;
      if (item.type === "digital") digital += item.amount;
      else physical += item.amount;
    }
  }

  const revenue = paid.reduce((sum, s) => sum + s.amount, 0);

  return {
    currency: (paid[0] && paid[0].currency) || "eur",
    orders: paid.length,
    pending: pending.length,
    revenue,
    revenueDigital: digital,
    revenuePhysical: physical,
    // Versand und Rundung: Gesamtbetrag minus Positionen.
    revenueShipping: revenue - digital - physical,
    products: Object.values(products).sort((a, b) => b.revenue - a.revenue),
    recent: [...paid, ...pending]
      .sort((a, b) => b.created - a.created)
      .slice(0, RECENT)
      .map((s) => ({
        created: s.created,
        items: s.items.map((i) => (i.quantity > 1 ? i.quantity + "× " : "") + i.name),
        amount: s.amount,
        currency: s.currency,
        country: s.country,
        email: s.email,
        paid: s.paid
      }))
  };
}

/* --- Stripe ---------------------------------------------------------------- */

async function cachedSessions(env, days, since) {
  const key = "stripe-sessions:" + days;
  if (env.ADMIN_CACHE) {
    const hit = await env.ADMIN_CACHE.get(key, "json");
    if (hit) return hit;
  }

  const sessions = await listSessions(env, since);
  if (env.ADMIN_CACHE) {
    await env.ADMIN_CACHE.put(key, JSON.stringify(sessions), { expirationTtl: CACHE_SECONDS });
  }
  return sessions;
}

/** Alle Checkout-Sessions ab "since", Seite für Seite, auf das Nötige gekürzt. */
async function listSessions(env, since) {
  const all = [];
  let after = "";

  for (let page = 0; page < MAX_PAGES; page++) {
    const query = new URLSearchParams({ limit: "100", "created[gte]": String(since) });
    query.append("expand[]", "data.line_items");
    if (after) query.set("starting_after", after);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions?" + query, {
      headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY }
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Stripe", response.status, detail.slice(0, 300));
      throw new StripeReadError(response.status);
    }

    const body = await response.json();
    for (const session of body.data) all.push(compact(session));
    if (!body.has_more || body.data.length === 0) break;
    after = body.data[body.data.length - 1].id;
  }

  return all;
}

function compact(session) {
  const details = session.customer_details || {};
  const physicalOnly = !(session.metadata && session.metadata.digital_slugs);

  const items = ((session.line_items && session.line_items.data) || []).map((line) => {
    const name = line.description || "Artikel";
    const product = name.split(" – ")[0];
    return {
      name,
      product,
      type: TYPE_BY_TITLE[product] || (physicalOnly ? "physical" : "digital"),
      quantity: line.quantity || 1,
      amount: line.amount_total || 0
    };
  });

  return {
    created: session.created,
    status: session.status, // open | complete | expired
    paid: session.payment_status === "paid" || session.payment_status === "no_payment_required",
    livemode: session.livemode,
    amount: session.amount_total || 0,
    currency: session.currency,
    country: (details.address && details.address.country) || null,
    email: maskEmail(details.email || session.customer_email || ""),
    items
  };
}

/** "maria.mustermann@gmail.com" -> "ma…@gmail.com" */
export function maskEmail(email) {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  return email.slice(0, Math.min(2, at)) + "…" + email.slice(at);
}

export class StripeReadError extends Error {
  constructor(status) {
    const hints = {
      401: "Stripe lehnt den Schlüssel ab (401). STRIPE_SECRET_KEY prüfen.",
      403: "Dem Stripe-Schlüssel fehlt das Leserecht \"Checkout Sessions: Read\" (403)."
    };
    super(hints[status] || "Stripe antwortet mit Fehler " + status + ".");
    this.status = status;
  }
}
