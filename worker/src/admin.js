/**
 * ADMIN-STATISTIK
 *
 * Die Seite admin.html zeigt die Besucherzahlen aus GoatCounter. Den
 * API-Schlüssel von GoatCounter darf der Browser nie sehen – wer ihn hat,
 * kann die Statistik lesen und das Konto verändern. Deshalb fragt die Seite
 * hier nach, und dieser Worker holt die Zahlen mit dem Schlüssel ab.
 *
 *   POST /api/admin/login   Passwort  ->  Sitzungs-Token (12 Stunden gültig)
 *   GET  /api/admin/stats   Token     ->  alle Zahlen für einen Zeitraum
 *   GET  /api/admin/refs    Token     ->  Herkunft der Besucher einer Seite
 *
 * Geheim, per "wrangler secret put":
 *   ADMIN_PASSWORD      das Passwort für admin.html
 *   GOATCOUNTER_TOKEN   API-Schlüssel aus GoatCounter (Benutzername oben
 *                       rechts -> API, Haken bei "Read statistics" genügt)
 *
 * Das Token ist kein gespeicherter Zustand, sondern Ablaufzeit + Signatur.
 * Der Signaturschlüssel ist das Passwort selbst: Wer das Passwort ändert,
 * meldet damit alle offenen Sitzungen ab.
 */

const SESSION_HOURS = 12;
const MAX_DAYS = 365;

export async function adminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) return notConfigured();

  let password = "";
  try {
    password = String((await request.json()).password || "");
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  if (!(await sameString(password, env.ADMIN_PASSWORD))) {
    // Bremst Rateversuche. Ohne Datenbank gibt es keine Sperre nach X
    // Fehlversuchen – das Passwort muss deshalb lang genug sein.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return Response.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const token = expires + "." + (await sign(String(expires), env.ADMIN_PASSWORD));
  return Response.json({ token, expires });
}

export async function adminStats(request, url, env) {
  const denied = await requireSession(request, env);
  if (denied) return denied;

  const range = rangeFrom(url);
  const gc = goatcounter(env, range);

  // Nacheinander statt parallel: GoatCounter erlaubt 4 Anfragen pro Sekunde.
  const total = await gc("stats/total");
  const hits = await gc("stats/hits", { limit: 100 });
  const referrers = await gc("stats/toprefs", { limit: 25 });
  const campaigns = await gc("stats/campaigns", { limit: 20 });
  const countries = await gc("stats/locations", { limit: 15 });
  const sizes = await gc("stats/sizes", { limit: 10 });
  const systems = await gc("stats/systems", { limit: 10 });
  const browsers = await gc("stats/browsers", { limit: 10 });

  const list = (response) =>
    (response.stats || []).map((row) => ({ id: row.id, name: row.name, scheme: row.ref_scheme, count: row.count }));
  const all = hits.hits || [];
  const toRow = (hit) => ({ id: hit.path_id, path: hit.path, title: hit.title, count: hit.count });

  return Response.json({
    days: range.days,
    start: range.start,
    end: range.end,
    // "total" enthält die Klick-Ereignisse mit, die Seitenbesuche stehen
    // deshalb erst nach dem Abzug da.
    visitors: (total.total || 0) - (total.total_events || 0),
    clicks: total.total_events || 0,
    daily: (total.stats || []).map((day) => ({ day: day.day, count: day.daily || 0 })),
    pages: all.filter((hit) => !hit.event).map(toRow),
    events: all.filter((hit) => hit.event).map(toRow),
    morePages: Boolean(hits.more),
    referrers: list(referrers),
    campaigns: list(campaigns),
    countries: list(countries),
    sizes: list(sizes),
    systems: list(systems),
    browsers: list(browsers)
  });
}

export async function adminRefs(request, url, env) {
  const denied = await requireSession(request, env);
  if (denied) return denied;

  const pathId = url.searchParams.get("path_id") || "";
  if (!/^\d+$/.test(pathId)) {
    return Response.json({ error: "Unknown page." }, { status: 400 });
  }

  const response = await goatcounter(env, rangeFrom(url))("stats/hits/" + pathId, { limit: 25 });
  return Response.json({
    refs: (response.refs || []).map((row) => ({ name: row.name, scheme: row.ref_scheme, count: row.count }))
  });
}

/* --- Zeitraum ----------------------------------------------------------- */

/** Die letzten N Tage einschließlich heute, auf volle Stunden gerundet – so
    verlangt es die GoatCounter-API. */
function rangeFrom(url) {
  const asked = parseInt(url.searchParams.get("days") || "7", 10);
  const days = Math.min(Math.max(Number.isFinite(asked) ? asked : 7, 1), MAX_DAYS);

  const end = new Date();
  end.setUTCMinutes(0, 0, 0);
  end.setUTCHours(end.getUTCHours() + 1);

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  return { days, start: start.toISOString(), end: end.toISOString() };
}

/* --- GoatCounter ---------------------------------------------------------- */

function goatcounter(env, range) {
  const base = "https://" + env.GOATCOUNTER_SITE + ".goatcounter.com/api/v0/";

  return async function get(endpoint, params = {}) {
    const query = new URLSearchParams({ start: range.start, end: range.end, ...params });
    const target = base + endpoint + "?" + query;
    const init = {
      headers: {
        Authorization: "Bearer " + env.GOATCOUNTER_TOKEN,
        "Content-Type": "application/json"
      }
    };

    let response = await fetch(target, init);
    if (response.status === 429) {
      // Ein einziger zweiter Versuch, sobald GoatCounter wieder annimmt.
      const wait = Math.min(parseFloat(response.headers.get("X-Rate-Limit-Reset") || "1"), 3);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      response = await fetch(target, init);
    }
    if (!response.ok) {
      throw new Error("GoatCounter " + endpoint + " answered " + response.status);
    }
    return response.json();
  };
}

/* --- Sitzung -------------------------------------------------------------- */

async function requireSession(request, env) {
  if (!env.ADMIN_PASSWORD || !env.GOATCOUNTER_TOKEN || !env.GOATCOUNTER_SITE) return notConfigured();

  const header = request.headers.get("Authorization") || "";
  const [expires, signature] = header.replace(/^Bearer\s+/i, "").split(".");

  const valid =
    /^\d+$/.test(expires || "") &&
    Number(expires) > Date.now() &&
    (await sameString(signature || "", await sign(expires, env.ADMIN_PASSWORD)));

  return valid ? null : Response.json({ error: "Bitte neu anmelden." }, { status: 401 });
}

function notConfigured() {
  return Response.json(
    { error: "Admin ist noch nicht eingerichtet (ADMIN_PASSWORD, GOATCOUNTER_TOKEN, GOATCOUNTER_SITE)." },
    { status: 503 }
  );
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("admin-session:" + value));
  return btoa(String.fromCharCode(...new Uint8Array(mac)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Vergleich in konstanter Zeit: Beide Seiten werden erst gehasht, damit die
    Längen gleich sind und die Laufzeit nichts über das Passwort verrät. */
async function sameString(a, b) {
  const [x, y] = await Promise.all(
    [a, b].map((text) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))
  );
  return crypto.subtle.timingSafeEqual(x, y);
}
