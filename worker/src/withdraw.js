/**
 * WIDERRUFSFUNKTION
 *
 * Seit 19.06.2026 muss ein Online-Shop Verbrauchern eine elektronische
 * Widerrufsfunktion anbieten (Richtlinie (EU) 2023/2673, § 356a BGB n. F.):
 * Der Kunde gibt Name, Vertragskennung (Bestellnummer) und eine Adresse für
 * die Bestätigung an, bestätigt den Widerruf mit einem eigenen Knopf – und
 * bekommt unverzüglich eine Eingangsbestätigung mit Inhalt, Datum und
 * Uhrzeit auf einem dauerhaften Datenträger (hier: E-Mail).
 *
 * Die Seite dazu ist withdraw.html. Hier wird nichts gespeichert: Der
 * Widerruf existiert danach als zwei E-Mails – eine an den Kunden, eine an
 * den Shop (SHOP_EMAIL). Das ist zugleich der Nachweis des Zugangs.
 *
 * Diesen Ablauf hat kein Anwalt gesehen – siehe LEGAL-TODO.md.
 */

import { sendMail, escapeHtml, MailNotConfigured, SELLER } from "./mail.js";

const LIMITS = { name: 200, orderNumber: 60, email: 200, items: 1000, message: 2000 };

/* Grober Schutz gegen Massenanfragen: pro Worker-Instanz und IP höchstens
   fünf Widerrufe in zehn Minuten. Kein Captcha – das wäre ein weiterer
   Dienst in der Datenschutzerklärung. */
const recent = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function handleWithdrawal(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return reply("We could not read that request.", 400);
  }

  // Unsichtbares Feld, das nur Bots ausfüllen. Ihnen sagen wir "ok".
  if (body.website) return Response.json({ ok: true });

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    return reply("Too many requests. Please try again later or email us.", 429);
  }
  hits.push(now);
  recent.set(ip, hits);

  const data = {};
  for (const key of Object.keys(LIMITS)) {
    data[key] = typeof body[key] === "string" ? body[key].trim().slice(0, LIMITS[key]) : "";
  }

  if (!data.name || !data.orderNumber) {
    return reply("Please enter your name and your order number.", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return reply("Please enter a valid email address for the confirmation.", 400);
  }
  if (body.confirmed !== true) {
    return reply("Please confirm the withdrawal.", 400);
  }

  const received = new Date();
  const stamp =
    received.toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "long", timeStyle: "medium" }) +
    " (Europe/Berlin) · " + received.toISOString();

  const rows = [
    ["Name", data.name],
    ["Bestellnummer / Order number", data.orderNumber],
    ["E-Mail / Email", data.email],
    ["Betroffene Waren / Goods concerned", data.items || "alle / all"],
    ["Nachricht / Message", data.message || "–"],
    ["Eingegangen am / Received on", stamp]
  ];

  const tableHtml =
    "<table cellpadding='6' style='border-collapse:collapse'>" +
    rows
      .map(([label, value]) =>
        "<tr><td style='vertical-align:top'><b>" + escapeHtml(label) + "</b></td><td>" +
        escapeHtml(value).replace(/\n/g, "<br>") + "</td></tr>")
      .join("") +
    "</table>";
  const tableText = rows.map(([label, value]) => label + ": " + value).join("\n");

  const sellerText =
    SELLER.name + ", " + SELLER.address + "\nTel. " + SELLER.phone + " · " + SELLER.email;

  try {
    await sendMail(env, {
      to: data.email,
      replyTo: SELLER.email,
      subject: "Eingangsbestätigung deines Widerrufs / Your withdrawal has been received – " + data.orderNumber,
      html:
        "<p>Wir haben deinen Widerruf erhalten. Diese E-Mail bestätigt den Eingang mit Inhalt, Datum und Uhrzeit. " +
        "Die Rücksendung und Erstattung richten sich nach unserer Widerrufsbelehrung: " +
        "<a href='" + env.SITE_BASE + "/shipping-returns.html#widerruf'>" + env.SITE_BASE + "/shipping-returns.html#widerruf</a></p>" +
        "<p>We have received your withdrawal. This email confirms its receipt, with its content, date and time. " +
        "Returning the goods and the refund follow our withdrawal instructions (link above).</p>" +
        tableHtml +
        "<p>" + escapeHtml(sellerText).replace(/\n/g, "<br>") + "</p>",
      text:
        "Wir haben deinen Widerruf erhalten. Diese E-Mail bestätigt den Eingang mit Inhalt, Datum und Uhrzeit.\n" +
        "We have received your withdrawal. This email confirms its receipt, with its content, date and time.\n\n" +
        tableText + "\n\n" +
        "Widerrufsbelehrung / Withdrawal instructions: " + env.SITE_BASE + "/shipping-returns.html#widerruf\n\n" +
        sellerText + "\n"
    });

    await sendMail(env, {
      to: env.SHOP_EMAIL || SELLER.email,
      replyTo: data.email,
      subject: "Widerruf eingegangen – " + data.orderNumber + " – " + data.name,
      html: "<p>Über die Widerrufsfunktion der Website ist ein Widerruf eingegangen. Der Kunde hat die Eingangsbestätigung erhalten.</p>" + tableHtml,
      text: "Über die Widerrufsfunktion der Website ist ein Widerruf eingegangen. Der Kunde hat die Eingangsbestätigung erhalten.\n\n" + tableText + "\n"
    });
  } catch (error) {
    console.error("Widerruf konnte nicht bestätigt werden:", error && error.message);
    const reason = error instanceof MailNotConfigured ? 503 : 502;
    return reply(
      "Your withdrawal could not be sent. Please email it to " + SELLER.email + " instead – that is just as valid.",
      reason
    );
  }

  return Response.json({ ok: true, receivedAt: received.toISOString() });
}

function reply(message, status) {
  return Response.json({ error: message }, { status });
}
