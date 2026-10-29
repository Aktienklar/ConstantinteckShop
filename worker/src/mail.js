/**
 * E-MAIL-VERSAND ÜBER RESEND
 *
 * Gebraucht für drei Dinge: die Bestellbestätigung mit AGB und
 * Widerrufsbelehrung (webhook.js), die Eingangsbestätigung eines Widerrufs
 * (withdraw.js) und – falls je wieder PDFs verkauft werden – den Download-Link.
 *
 * Voraussetzung: RESEND_API_KEY als Secret und eine bei Resend verifizierte
 * Absenderdomain (MAIL_FROM in wrangler.toml). Fehlt der Schlüssel, wirft
 * sendMail – lieber ein sichtbarer Fehler als eine Bestätigung, die
 * stillschweigend nie ankommt.
 */

export class MailNotConfigured extends Error {}

/**
 * attachments: [{ filename, content }] – content als Klartext, wird hier
 * base64-kodiert. idempotencyKey verhindert, dass Resend dieselbe Mail bei
 * einem zweiten Zustellversuch von Stripe noch einmal verschickt (24 h).
 */
export async function sendMail(env, { to, subject, html, text, replyTo, attachments, idempotencyKey }) {
  if (!env.RESEND_API_KEY) {
    throw new MailNotConfigured("RESEND_API_KEY ist nicht gesetzt.");
  }

  const headers = {
    Authorization: "Bearer " + env.RESEND_API_KEY,
    "Content-Type": "application/json"
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo || undefined,
      subject,
      html,
      text,
      attachments: (attachments || []).map((file) => ({
        filename: file.filename,
        content: base64(file.content)
      }))
    })
  });

  if (!response.ok) {
    throw new Error("Resend antwortete mit " + response.status + ": " + (await response.text()));
  }
}

/**
 * AGB und Widerrufsbelehrung als Klartext, geholt von der veröffentlichten
 * Website. So gibt es nur eine Fassung: die auf der Seite. Was der Kunde per
 * Mail bekommt, ist genau das, was er vor dem Kauf lesen konnte.
 */
export async function legalTexts(env) {
  const base = env.SITE_BASE.replace(/\/$/, "");
  const [terms, returns] = await Promise.all([
    pageText(base + "/terms.html"),
    pageText(base + "/shipping-returns.html")
  ]);
  return [
    { filename: "AGB-Terms-Constantinteck.txt", content: terms },
    { filename: "Widerrufsbelehrung-Withdrawal-Constantinteck.txt", content: returns }
  ];
}

async function pageText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Konnte " + url + " nicht laden: " + response.status);
  const html = await response.text();
  const article = (html.match(/<article>([\s\S]*?)<\/article>/) || [null, html])[1];

  return (
    decodeEntities(
      article
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<(h1|h2|h3)[^>]*>/g, "\n\n")
        .replace(/<\/(h1|h2|h3)>/g, "\n")
        .replace(/<li[^>]*>/g, "\n- ")
        .replace(/<\/(p|li|ul|ol|div|section)>/g, "\n")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<[^>]+>/g, "")
    )
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() +
    "\n\nQuelle / Source: " + url + "\n"
  );
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** UTF-8-sicher: btoa kennt nur Latin-1, die Texte enthalten Umlaute und €. */
function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Anbieterangaben für jede Mail – dieselben wie im Impressum. */
export const SELLER = {
  name: "Constantin Teckentrup",
  address: "Dormagenerstrasse 23a, 41540 Dormagen, Deutschland / Germany",
  phone: "+49 2133 9366017",
  email: "info@constantinteck.com"
};
