/**
 * DOWNLOAD-LINKS
 *
 * Die PDFs liegen in einem R2-Bucket, der von außen nicht erreichbar ist.
 * Zugang gibt es nur über einen Link, den dieser Worker signiert hat und der
 * nach einigen Tagen abläuft. Ohne Signatur wäre die Datei unter einer
 * ratbaren Adresse für jeden herunterladbar.
 */

import { PRODUCTS } from "./catalog.js";

/** Wie lange ein Link gilt. Lang genug für "mache ich heute Abend". */
const VALID_DAYS = 7;

export function downloadValidityDays() {
  return VALID_DAYS;
}

export async function signDownloadUrl(env, slug, sessionId) {
  const expires = Math.floor(Date.now() / 1000) + VALID_DAYS * 24 * 60 * 60;
  const payload = [slug, sessionId, String(expires)].join(".");
  const signature = await hmac(env.DOWNLOAD_SECRET, payload);

  const url = new URL(env.WORKER_BASE.replace(/\/$/, "") + "/api/download");
  url.searchParams.set("p", slug);
  url.searchParams.set("s", sessionId);
  url.searchParams.set("e", String(expires));
  url.searchParams.set("sig", signature);
  return url.toString();
}

export async function serveDownload(request, env) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("p") || "";
  const sessionId = url.searchParams.get("s") || "";
  const expires = url.searchParams.get("e") || "";
  const signature = url.searchParams.get("sig") || "";

  // Solange nur die Schürze verkauft wird, ist der R2-Bucket in wrangler.toml
  // auskommentiert – dann gibt es hier auch nichts auszuliefern.
  const product = PRODUCTS[slug];
  if (!env.PDFS || !product || product.type !== "digital") {
    return new Response("Unknown file.", { status: 404 });
  }

  const expected = await hmac(env.DOWNLOAD_SECRET, [slug, sessionId, expires].join("."));
  if (!timingSafeEqual(expected, signature)) {
    return new Response("This link is not valid.", { status: 403 });
  }

  // Erst nach der Signaturprüfung, damit ein abgelaufener Link nicht verrät,
  // ob er jemals gültig war.
  if (!/^\d+$/.test(expires) || Number(expires) * 1000 < Date.now()) {
    return new Response(
      "This download link has expired. Drop us a line and we'll send a fresh one.",
      { status: 410 }
    );
  }

  const object = await env.PDFS.get(product.file);
  if (!object) {
    // Bezahlt, aber die Datei fehlt im Bucket – das ist unser Fehler.
    return new Response("That file is temporarily unavailable. Please get in touch.", {
      status: 500
    });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="' + product.file + '"',
      "Cache-Control": "private, no-store"
    }
  });
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64url(new Uint8Array(signature));
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Vergleich ohne verräterische Laufzeit. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
