/**
 * CONSTANTINTECK – KASSE
 *
 * Ein kleiner Cloudflare Worker neben der statischen Website. Er existiert aus
 * einem einzigen Grund: Der Stripe-Secret-Key darf nicht in den Browser. Die
 * Website auf GitHub Pages liefert jede Datei aus, die im Repository liegt –
 * ein Schlüssel im Seitenquelltext wäre öffentlich.
 *
 *   POST /api/checkout   Warenkorb  ->  Stripe-Checkout-Session
 *   POST /api/webhook    Stripe     ->  Auslieferung der PDFs
 *   GET  /api/session    Erfolgsseite fragt, ob wirklich bezahlt wurde
 *   GET  /api/download   Signierter PDF-Download
 */

import Stripe from "stripe";
import { createCheckoutSession } from "./checkout.js";
import { handleWebhook } from "./webhook.js";
import { serveDownload } from "./download.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      // Der Standard-HTTP-Client von stripe-node setzt Node voraus. In Workers
      // gibt es nur fetch.
      httpClient: Stripe.createFetchHttpClient(),
      appInfo: { name: "Constantinteck Shop", url: env.SITE_BASE }
    });

    try {
      if (path === "/api/webhook" && request.method === "POST") {
        // Kein CORS: Diesen Endpunkt ruft Stripe auf, kein Browser.
        return await handleWebhook(request, env, stripe, Stripe.createSubtleCryptoProvider());
      }

      if (path === "/api/download" && request.method === "GET") {
        return await serveDownload(request, env);
      }

      if (path === "/api/checkout" && request.method === "POST") {
        const denied = rejectForeignOrigin(request, env);
        if (denied) return denied;
        const response = await createCheckoutSession(request, env, stripe);
        return withCors(response, request, env);
      }

      if (path === "/api/session" && request.method === "GET") {
        const response = await describeSession(url, env, stripe);
        return withCors(response, request, env);
      }

      return new Response("Not found.", { status: 404 });
    } catch (error) {
      // Der Text einer Stripe-Ausnahme kann Interna enthalten – ins Log damit,
      // nicht in die Antwort.
      console.error(path, error && error.stack);
      return withCors(
        Response.json({ error: "The checkout is unavailable right now." }, { status: 500 }),
        request,
        env
      );
    }
  }
};

/**
 * Die Erfolgsseite darf nichts behaupten, was sie nicht geprüft hat. Sie fragt
 * hier nach, statt einfach "Danke für deine Bestellung" anzuzeigen, weil die
 * Adresse mit der Session-ID auch ohne Bezahlung aufrufbar ist.
 */
async function describeSession(url, env, stripe) {
  const id = url.searchParams.get("session_id") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) {
    return Response.json({ error: "Unknown order." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(id);
  const paid = session.payment_status === "paid";

  return Response.json({
    paid,
    pending: session.payment_status === "unpaid" && session.status === "complete",
    email: (session.customer_details && session.customer_details.email) || null,
    amountTotal: session.amount_total,
    currency: session.currency,
    hasDigital: Boolean(session.metadata && session.metadata.digital_slugs),
    hasPhysical: Boolean(session.metadata && session.metadata.physical_slugs)
  });
}

/**
 * Erlaubte Absender: die veröffentlichte Website und die lokale Vorschau.
 * SITE_ORIGIN darf mehrere Adressen mit Komma getrennt enthalten – die Seite
 * ist unter der nackten Domain und unter www erreichbar.
 */
function allowedOrigins(env) {
  const published = env.SITE_ORIGIN.split(",").map((entry) => entry.trim()).filter(Boolean);
  return [...published, "http://localhost:4000", "http://127.0.0.1:4000"];
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
  if (allowedOrigins(env).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function withCors(response, request, env) {
  const merged = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) {
    merged.headers.set(key, value);
  }
  return merged;
}

/**
 * CORS schützt nur Browser. Ein fremdes Skript könnte trotzdem Sessions auf
 * unsere Rechnung anlegen lassen – das kostet zwar nichts, füllt aber das
 * Dashboard mit Müll.
 */
function rejectForeignOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins(env).includes(origin)) {
    return new Response(JSON.stringify({ error: "Not allowed." }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}
