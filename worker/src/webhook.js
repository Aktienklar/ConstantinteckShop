/**
 * WEBHOOK – AUSLIEFERUNG
 *
 * Stripe meldet hier jede abgeschlossene Bestellung. Das ist die einzige
 * Stelle, an der ausgeliefert werden darf: Die Erfolgsseite im Browser sagt
 * nichts darüber aus, ob wirklich Geld geflossen ist – sie lässt sich
 * aufrufen, ohne bezahlt zu haben, und ein Käufer kann sie verpassen, wenn er
 * den Tab zu früh schließt.
 */

import { PRODUCTS } from "./catalog.js";
import { signDownloadUrl, downloadValidityDays } from "./download.js";

export async function handleWebhook(request, env, stripe, cryptoProvider) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });

  // Der Rohtext muss unverändert bleiben, sonst schlägt die Prüfung fehl.
  const payload = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      // Workers haben kein Node-Crypto; Stripe bringt für WebCrypto einen
      // eigenen Provider mit. Deshalb auch constructEventAsync statt
      // constructEvent – die Prüfung ist hier asynchron.
      cryptoProvider
    );
  } catch (error) {
    console.error("Webhook-Signatur ungültig:", error.message);
    return new Response("Invalid signature.", { status: 400 });
  }

  /* Stripe stellt dasselbe Ereignis notfalls mehrfach zu. Ohne diese Sperre
     bekäme ein Käufer seine Mail bei jedem Zustellversuch erneut.

     Solange nur die Schürze verkauft wird, gibt es das KV gar nicht: Bei einer
     Versandbestellung verschickt der Webhook nichts, also kann er auch nichts
     doppelt verschicken. */
  const seenKey = "event:" + event.id;
  if (env.ORDERS && (await env.ORDERS.get(seenKey))) {
    return new Response("Already handled.", { status: 200 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await fulfil(event.data.object, env, stripe);
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      // SEPA-Lastschrift und Klarna bestätigen teils erst Tage später.
      await fulfil(event.data.object, env, stripe);
    }
  } catch (error) {
    console.error("Auslieferung fehlgeschlagen:", error && error.stack);
    // 500 heißt: Stripe versucht es später noch einmal. Kein Vermerk in KV,
    // damit der zweite Versuch auch wirklich ausliefert.
    return new Response("Fulfilment failed.", { status: 500 });
  }

  if (env.ORDERS) {
    await env.ORDERS.put(seenKey, "1", { expirationTtl: 60 * 60 * 24 * 30 });
  }
  return new Response("ok", { status: 200 });
}

async function fulfil(session, env, stripe) {
  // Bei "unpaid" ist die Zahlung noch unterwegs (Lastschrift). Dann wartet die
  // Auslieferung auf async_payment_succeeded.
  if (session.payment_status !== "paid") return;

  const digitalSlugs = (session.metadata && session.metadata.digital_slugs
    ? session.metadata.digital_slugs.split(",")
    : []
  ).filter((slug) => PRODUCTS[slug] && PRODUCTS[slug].type === "digital");

  if (digitalSlugs.length === 0) return; // Reine Versandbestellung, nichts zu tun.

  const email =
    session.customer_details && session.customer_details.email
      ? session.customer_details.email
      : session.customer_email;

  if (!email) {
    throw new Error("Bestellung " + session.id + " hat keine E-Mail-Adresse.");
  }

  const downloads = [];
  for (const slug of digitalSlugs) {
    downloads.push({
      title: PRODUCTS[slug].title,
      url: await signDownloadUrl(env, slug, session.id)
    });
  }

  await sendDownloadEmail(env, email, downloads, session);
}

async function sendDownloadEmail(env, email, downloads, session) {
  const days = downloadValidityDays();
  const name =
    (session.customer_details && session.customer_details.name) || "";
  // Nur die HTML-Fassung wird maskiert – im Textteil würde aus "Ann & Bo"
  // sonst "Ann &amp; Bo".
  const greeting = name ? "Hi " + name.split(" ")[0] + "," : "Hi,";

  const list = downloads
    .map((d) => '<li><a href="' + d.url + '">' + escapeHtml(d.title) + "</a></li>")
    .join("");

  /* Englisch wie der Rest der Oberfläche – nur die Rezepte selbst sind
     deutsch. Wer stattdessen deutsche Mails schicken will, ändert die vier
     Textstellen hier und den Betreff weiter unten. */
  const html =
    "<p>" + escapeHtml(greeting) + "</p>" +
    "<p>thank you for your order! Here is your download:</p>" +
    "<ul>" + list + "</ul>" +
    "<p>The link works for " + days + " days. If it has expired, just reply " +
    "to this email and I'll send you a new one.</p>" +
    "<p>Happy baking!<br>Constantin</p>";

  const text =
    greeting + "\n\nthank you for your order! Here is your download:\n\n" +
    downloads.map((d) => d.title + "\n" + d.url).join("\n\n") +
    "\n\nThe link works for " + days + " days.\n\nHappy baking!\nConstantin";

  /* Ohne konfigurierten Mailversand soll die Kasse trotzdem testbar sein.
     Der Link landet dann im Worker-Log statt im Postfach. */
  if (!env.RESEND_API_KEY) {
    console.log(
      "Kein RESEND_API_KEY gesetzt – Download-Links für " + email + ":",
      downloads.map((d) => d.url).join(" ")
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email],
      subject: "Your download from Constantinteck",
      html,
      text
    })
  });

  if (!response.ok) {
    // Wirft, damit Stripe es erneut zustellt – der Käufer hat bezahlt und
    // wartet auf die Datei.
    throw new Error(
      "Resend antwortete mit " + response.status + ": " + (await response.text())
    );
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
