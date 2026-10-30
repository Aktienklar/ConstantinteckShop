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
 *   GET  /api/admin/posthog Token     ->  Kennzahlen aus PostHog (nur
 *                                         Besucher mit Einwilligung)
 *
 * Geheim, per "wrangler secret put":
 *   ADMIN_PASSWORD      das Passwort für admin.html
 *   GOATCOUNTER_TOKEN   API-Schlüssel aus GoatCounter (Benutzername oben
 *                       rechts -> API, Haken bei "Read statistics" genügt)
 *   POSTHOG_API_KEY     optional: persönlicher API-Schlüssel aus PostHog
 *                       (Settings -> Personal API keys, Bereich "Query:
 *                       Read"). Fehlt er, zeigt admin.html nur GoatCounter.
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

  // Bildschirmgrößen kommen ohne Namen ("phone", "tablet" … nur als id)
  // und auch mit 0 Besuchern – beides hier glätten.
  const SIZES = { phone: "Handy", tablet: "Tablet", desktop: "Computer", desktophd: "Großer Bildschirm", unknown: "Unbekannt" };
  const list = (response, names = {}) =>
    (response.stats || [])
      .filter((row) => row.count > 0)
      .map((row) => ({ id: row.id, name: row.name || names[row.id] || "", scheme: row.ref_scheme, count: row.count }));
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
    sizes: list(sizes, SIZES),
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

/* Die Ereignisnamen kommen aus data-track (site-config.js); site.js schickt
   den Teil vor dem ersten "/" als Ereignis an PostHog. */
const POSTHOG_SUMMARY = (days) => `
  SELECT
    uniq(distinct_id),
    countIf(event = '$pageview'),
    uniq(\`$session_id\`),
    uniqIf(distinct_id, event = '$pageview' AND properties.$pathname = '/krimi-dinner.html'),
    uniqIf(distinct_id, event = '$pageview' AND properties.$pathname LIKE '/murder-mystery/%'),
    uniqIf(distinct_id, event = 'krimi-click'),
    uniqIf(distinct_id, event = 'product-click')
  FROM events
  WHERE timestamp >= toStartOfDay(now()) - INTERVAL ${days - 1} DAY`;

const POSTHOG_SESSIONS = (days) => `
  SELECT round(avg(\`$session_duration\`)), round(countIf(\`$is_bounce\`) / greatest(count(), 1), 3)
  FROM sessions
  WHERE \`$start_timestamp\` >= toStartOfDay(now()) - INTERVAL ${days - 1} DAY`;

export async function adminPosthog(request, url, env) {
  const denied = await requireSession(request, env);
  if (denied) return denied;
  if (!env.POSTHOG_API_KEY) return Response.json({ configured: false });

  const { days } = rangeFrom(url);
  const [summary, sessions] = [await posthogQuery(env, POSTHOG_SUMMARY(days)), await posthogQuery(env, POSTHOG_SESSIONS(days))];
  const [visitors, pageviews, sessionCount, krimiOverview, casePages, krimiClicks, productClicks] = summary[0] || [];
  const [avgDuration, bounceRate] = sessions[0] || [];

  return Response.json({
    configured: true,
    dashboard: env.POSTHOG_HOST + "/project/" + env.POSTHOG_PROJECT + "/dashboard",
    replays: env.POSTHOG_HOST + "/project/" + env.POSTHOG_PROJECT + "/replay/home",
    visitors: visitors || 0,
    pageviews: pageviews || 0,
    sessions: sessionCount || 0,
    avgDuration: avgDuration || 0,
    bounceRate: bounceRate || 0,
    funnel: [
      { label: "Besucher", count: visitors || 0 },
      { label: "Krimi-Übersicht angesehen", count: krimiOverview || 0 },
      { label: "Eine Fallseite angesehen", count: casePages || 0 },
      { label: "Krimi-Kaufknopf geklickt", count: krimiClicks || 0 }
    ],
    productClicks: productClicks || 0
  });
}

async function posthogQuery(env, query) {
  const response = await fetch(env.POSTHOG_HOST + "/api/projects/" + env.POSTHOG_PROJECT + "/query/", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.POSTHOG_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("PostHog", response.status, detail.slice(0, 300));
    throw new PosthogError(response.status);
  }
  return (await response.json()).results || [];
}

export class PosthogError extends Error {
  constructor(status) {
    const hints = {
      401: "PostHog lehnt den API-Schlüssel ab (401). POSTHOG_API_KEY neu setzen.",
      403: "Dem PostHog-Schlüssel fehlt das Recht \"Query: Read\" für dieses Projekt (403)."
    };
    super(hints[status] || "PostHog antwortet mit Fehler " + status + ".");
    this.status = status;
  }
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

  // Ohne Millisekunden: "2026-10-30T00:00:00Z", wie in der API-Doku.
  const iso = (date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");
  return { days, start: iso(start), end: iso(end) };
}

/* --- GoatCounter ---------------------------------------------------------- */

const GAP_MS = 260;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function goatcounter(env, range) {
  let lastCall = 0;
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

    // GoatCounter nimmt höchstens 4 Anfragen pro Sekunde an. Abstand
    // halten und bei 429 bis zu dreimal nachfassen.
    const since = Date.now() - lastCall;
    if (since < GAP_MS) await sleep(GAP_MS - since);

    let response;
    for (let attempt = 0; attempt < 4; attempt++) {
      lastCall = Date.now();
      response = await fetch(target, init);
      if (response.status !== 429) break;
      const reset = parseFloat(response.headers.get("X-Rate-Limit-Reset") || "0");
      await sleep(Math.min(Math.max(reset * 1000, 400), 2000));
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("GoatCounter", endpoint, response.status, detail.slice(0, 300));
      throw new GoatCounterError(response.status);
    }
    return response.json();
  };
}

/** Fehler von GoatCounter, mit einer Meldung, die auf admin.html sagt, was
    zu tun ist – "nicht erreichbar" allein hilft niemandem weiter. */
export class GoatCounterError extends Error {
  constructor(status) {
    const hints = {
      401: "GoatCounter lehnt den API-Schlüssel ab (401). GOATCOUNTER_TOKEN neu setzen.",
      403: "Dem GoatCounter-Schlüssel fehlt das Recht \"Read statistics\" (403). In GoatCounter einen Schlüssel mit diesem Haken anlegen und GOATCOUNTER_TOKEN neu setzen.",
      404: "GoatCounter kennt die Seite nicht (404). GOATCOUNTER_SITE in wrangler.toml prüfen.",
      429: "GoatCounter bremst gerade (429). In ein paar Sekunden neu laden."
    };
    super(hints[status] || "GoatCounter antwortet mit Fehler " + status + ".");
    this.status = status;
  }
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
