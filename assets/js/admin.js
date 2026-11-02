/**
 * ADMIN-STATISTIK (admin.html)
 *
 * Login mit Passwort beim Worker, danach holt die Seite die Zahlen über
 * /api/admin/stats. Das Sitzungs-Token liegt nur in sessionStorage: Tab zu,
 * Sitzung weg. Nach 12 Stunden lehnt der Worker es ohnehin ab.
 *
 * Woher die Zahlen kommen und was sie bedeuten: worker/src/admin.js.
 */
(function () {
  "use strict";

  var API = SHOP_CHECKOUT.endpoint.replace(/\/$/, "") + "/api/admin/";
  var TOKEN_KEY = "ct-admin-token";
  var DAYS_KEY = "ct-admin-days";

  var loginBox = document.querySelector("[data-admin-login]");
  var loginForm = document.querySelector("[data-admin-login-form]");
  var loginError = document.querySelector("[data-admin-login-error]");
  var dashboard = document.querySelector("[data-admin-dashboard]");
  var body = document.querySelector("[data-admin-body]");
  var shopBox = document.querySelector("[data-admin-shop]");
  var mnBox = document.querySelector("[data-admin-mn]");
  var errorBox = document.querySelector("[data-admin-error]");
  var logout = document.querySelector("[data-admin-logout]");
  var deviceState = document.querySelector("[data-admin-device-state]");
  var deviceToggle = document.querySelector("[data-admin-device-toggle]");
  var deviceBox = document.querySelector("[data-admin-device]");
  var rangeButtons = document.querySelectorAll("[data-days]");

  var days = parseInt(read(sessionStorage, DAYS_KEY) || "30", 10);
  var data = null;
  var shopData = null;

  /* Klick-Ereignisse aus site-config.js, für Menschen übersetzt. */
  var EVENT_GROUPS = {
    "krimi-click": "Krimi-Kaufknopf (zu Murdernight)",
    "krimi-menu": "Rezept aus einem Krimi-Menü",
    "product-click": "Produktkarte",
    "banner-click": "Ankündigungsleiste",
    "add-to-cart": "In den Warenkorb gelegt",
    "checkout-start": "Kasse geöffnet",
    "newsletter-signup": "Newsletter-Anmeldung"
  };

  var REF_SCHEMES = { c: "Kampagne", g: "Suchmaschine/Gruppe", h: "Link", o: "Sonstiges" };

  /* --- Speicher (kann in privaten Fenstern fehlen) ----------------------- */

  function read(store, key) {
    try {
      return store.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function write(store, key, value) {
    try {
      if (value === null) store.removeItem(key);
      else store.setItem(key, value);
    } catch (error) {
      /* egal – dann eben ohne Merken */
    }
  }

  /* --- Login ------------------------------------------------------------- */

  function showLogin(message) {
    write(sessionStorage, TOKEN_KEY, null);
    dashboard.hidden = true;
    logout.hidden = true;
    loginBox.hidden = false;
    loginError.textContent = message || "";
    loginForm.password.focus();
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var button = loginForm.querySelector("button");
    button.disabled = true;
    loginError.textContent = "";

    fetch(API + "login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: loginForm.password.value })
    })
      .then(function (response) {
        return response.json().then(function (json) {
          if (!response.ok) throw new Error(json.error || "Anmeldung fehlgeschlagen.");
          return json;
        });
      })
      .then(function (json) {
        write(sessionStorage, TOKEN_KEY, json.token);
        loginForm.reset();
        showDashboard();
      })
      .catch(function (error) {
        loginError.textContent = error.message;
      })
      .then(function () {
        button.disabled = false;
      });
  });

  logout.addEventListener("click", function () {
    showLogin("Abgemeldet.");
  });

  /* --- Abruf ------------------------------------------------------------- */

  function api(endpoint, params) {
    var query = Object.keys(params)
      .map(function (key) {
        return key + "=" + encodeURIComponent(params[key]);
      })
      .join("&");

    return fetch(API + endpoint + "?" + query, {
      headers: { Authorization: "Bearer " + read(sessionStorage, TOKEN_KEY) }
    }).then(function (response) {
      return response.json().then(function (json) {
        if (response.status === 401) {
          showLogin(json.error);
          throw new Error("");
        }
        if (!response.ok) throw new Error(json.error || "Fehler " + response.status);
        return json;
      });
    });
  }

  function showDashboard() {
    loginBox.hidden = true;
    dashboard.hidden = false;
    logout.hidden = false;
    load();
  }

  function load() {
    rangeButtons.forEach(function (button) {
      var active = parseInt(button.getAttribute("data-days"), 10) === days;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    errorBox.textContent = "";
    body.classList.add("is-loading");
    loadShop();
    loadMurderNight();

    api("stats", { days: days })
      .then(function (json) {
        data = json;
        render();
        renderShopFunnel();
      })
      .catch(function (error) {
        errorBox.textContent = error.message;
        if (!data) body.innerHTML = "";
      })
      .then(function () {
        body.classList.remove("is-loading");
      });
  }

  rangeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      days = parseInt(button.getAttribute("data-days"), 10);
      write(sessionStorage, DAYS_KEY, String(days));
      load();
    });
  });

  /* --- Darstellung ------------------------------------------------------- */

  function esc(text) {
    return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function num(value) {
    return Number(value || 0).toLocaleString("de-DE");
  }

  function dayLabel(iso, long) {
    var date = new Date(iso + "T12:00:00Z");
    return date.toLocaleDateString("de-DE", long ? { weekday: "short", day: "numeric", month: "long" } : { day: "numeric", month: "numeric" });
  }

  /* Tage für "Ø pro Tag": ab dem ersten Tag mit Messdaten bis heute. Der
     gewählte Zeitraum (z. B. 30 Tage) reicht oft vor den Start der Zählung
     zurück – durch alle Tage geteilt, kam am 2.11.2026 "25" statt ~250
     heraus. Nullen nach dem ersten Datentag zählen mit (echte Flaute). */
  function daysWithData(daily) {
    for (var i = 0; i < daily.length; i++) {
      if (daily[i].count > 0) return daily.length - i;
    }
    return 0;
  }

  function perDay(total, daily) {
    var n = daysWithData(daily || []);
    return n ? total / n : 0;
  }

  function render() {
    var daily = data.daily || [];
    var top = (data.referrers || []).filter(function (ref) {
      return ref.name;
    })[0];

    body.innerHTML =
      '<div class="admin-tiles">' +
      tile("Besucher", num(data.visitors)) +
      tile("Ø pro Tag", num(Math.round(perDay(data.visitors, daily))), daysWithData(daily) < daily.length ? "seit " + num(daysWithData(daily)) + " Tagen mit Daten" : "") +
      tile("Klicks", num(data.clicks), "auf markierte Knöpfe") +
      tile("Top-Quelle", top ? esc(top.name) : "–", top ? num(top.count) + " Besucher" : "") +
      "</div>" +
      '<section class="admin-panel panel admin-panel--wide" data-posthog hidden></section>' +
      panel("Besucher pro Tag", chart(daily), "admin-panel--wide") +
      panel(
        "Seiten",
        bars(data.pages, function (row) {
          return { label: row.path, sub: row.title, count: row.count, id: row.id };
        }, "Noch keine Aufrufe.", true) +
          (data.morePages ? '<p class="muted admin-note">Nur die 100 meistbesuchten Einträge.</p>' : "") +
          '<p class="muted admin-note">Auf eine Seite tippen, um zu sehen, woher ihre Besucher kamen.</p>',
        "admin-panel--wide"
      ) +
      panel("Woher sie kamen", donut(data.referrers, function (row) {
        return { label: row.name || "Direkt / App", count: row.count };
      }, "Noch keine Daten.", { unit: "Besucher", label: "Herkunft" }) +
        '<p class="muted admin-note">„Direkt / App“: Lesezeichen, eingetippt oder Apps wie Instagram und TikTok, die keine Herkunft mitschicken.</p>') +
      panel("Geräte", donut(data.sizes, plainRow, "Noch keine Daten.", { unit: "Besucher", label: "Geräte" })) +
      panel("Länder", donut(data.countries, plainRow, "Noch keine Daten.", { unit: "Besucher", label: "Länder" })) +
      panel("Systeme", donut(data.systems, plainRow, "Noch keine Daten.", { unit: "Besucher", label: "Systeme" })) +
      panel("Browser", donut(data.browsers, plainRow, "Noch keine Daten.", { unit: "Besucher", label: "Browser" })) +
      panel("Kampagnen (utm / ref)", bars(data.campaigns, plainRow, "Keine Kampagnen-Links benutzt.")) +
      panel("Klicks", events(data.events), "admin-panel--wide");

    wireChart(body, daily, "Besucher");
    wirePages();
    loadPosthog();
  }

  /* --- Shop (Stripe) ------------------------------------------------------ */

  function money(cents, currency) {
    return ((cents || 0) / 100).toLocaleString("de-DE", { style: "currency", currency: (currency || "eur").toUpperCase() });
  }

  function loadShop() {
    var forDays = days;
    shopBox.classList.add("is-loading");

    api("orders", { days: days })
      .then(function (shop) {
        if (forDays !== days) return;
        shopData = shop;
        shopBox.innerHTML = renderShop(shop);
        renderShopFunnel();
      })
      .catch(function (error) {
        if (!error.message || forDays !== days) return;
        shopBox.innerHTML = '<section class="admin-panel panel admin-panel--wide"><p class="admin-error">' + esc(error.message) + "</p></section>";
      })
      .then(function () {
        shopBox.classList.remove("is-loading");
      });
  }

  function renderShop(shop) {
    var cur = shop.currency;
    var html =
      '<div class="admin-tiles">' +
      tile("Bestellungen", num(shop.orders), shop.pending ? num(shop.pending) + " Zahlung ausstehend" : "bezahlt") +
      tile("Umsatz", money(shop.revenue, cur), "inkl. " + money(shop.revenueShipping, cur) + " Versand") +
      tile("Davon Ware", money(shop.revenuePhysical, cur), shop.revenueDigital ? money(shop.revenueDigital, cur) + " digital (PDF)" : "keine digitalen Produkte") +
      tile("Ø Bestellwert", shop.orders ? money(Math.round(shop.revenue / shop.orders), cur) : "–") +
      "</div>";

    var co = shop.checkout;
    html += panel(
      "Kasse",
      '<div class="admin-split">' +
        ring(co.rate, "Abschlussquote", num(co.completed) + " von " + num(co.completed + co.expired) + " Kassen bezahlt") +
        donut(
          [
            { label: "Abgeschlossen", count: co.completed },
            { label: "Abgebrochen", count: co.expired },
            { label: "Noch offen", count: co.open }
          ],
          function (row) { return row; },
          "Noch niemand an der Kasse.",
          { unit: "Kassen", label: "Kassenvorgänge" }
        ) +
        '<div class="admin-mini">' +
        tile("Ø Warenkorb", co.avgValue === null ? "–" : money(co.avgValue, cur), co.avgItems === null ? "" : "Ø " + co.avgItems.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " Artikel") +
        tile("Ø abgebrochen", co.avgAbandonedValue ? money(co.avgAbandonedValue, cur) : "–", "Wert im verlassenen Korb") +
        "</div></div>" +
        '<h3 class="admin-subhead">Vom Produkt bis zur Zahlung</h3>' +
        '<div data-shop-funnel><p class="muted">Wartet auf die Besucherzahlen …</p></div>',
      "admin-panel--wide"
    );

    html += panel(
      "Umsatz pro Produkt",
      donut(shop.products, function (row) {
        return { label: row.name + " (" + num(row.quantity) + "×)", count: row.revenue, display: money(row.revenue, cur) };
      }, "Im Zeitraum noch nichts verkauft.", { unit: "Umsatz", total: money(shop.revenue - shop.revenueShipping, cur), label: "Umsatz pro Produkt" })
    );

    html += panel(
      "Letzte Bestellungen",
      shop.recent.length
        ? '<div class="admin-orders">' +
            shop.recent
              .map(function (order) {
                return (
                  '<div class="admin-order">' +
                  '<p class="admin-order__top"><span>' + esc(new Date(order.created * 1000).toLocaleString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })) + "</span>" +
                  "<strong>" + money(order.amount, order.currency) + "</strong></p>" +
                  '<p class="admin-order__items">' + esc(order.items.join(", ")) + "</p>" +
                  '<p class="admin-order__meta">' + esc([order.country, order.email].filter(Boolean).join(" · ")) +
                  ' <span class="admin-badge' + (order.paid ? "" : " admin-badge--pending") + '">' + (order.paid ? "bezahlt" : "ausstehend") + "</span></p>" +
                  "</div>"
                );
              })
              .join("") +
            "</div>"
        : '<p class="muted">Noch keine Bestellungen im Zeitraum.</p>'
    );

    return html;
  }

  /* Trichter Produktseite → Warenkorb → Kasse → bezahlt. Die ersten beiden
     Schritte zählt GoatCounter (alle Besucher, ohne Cookies; Ereignisse aus
     cart.js), die letzten beiden kommen aus Stripe. Erscheint, sobald beide
     Abrufe da sind – in welcher Reihenfolge auch immer. */
  function renderShopFunnel() {
    var box = shopBox.querySelector("[data-shop-funnel]");
    if (!box || !shopData) return;
    if (!data) {
      box.innerHTML = '<p class="muted">Ohne Besucherzahlen nur die Kasse oben.</p>';
      return;
    }

    function sum(rows, test) {
      return (rows || []).reduce(function (total, row) { return total + (test(row.path) ? row.count : 0); }, 0);
    }

    var steps = [
      { label: "Produktseite angesehen", count: sum(data.pages, function (p) { return /^\/shop\//.test(p); }) },
      { label: "In den Warenkorb gelegt", count: sum(data.events, function (p) { return /^add-to-cart(\/|$)/.test(p); }) },
      { label: "Zur Kasse gegangen", count: shopData.checkout.started },
      { label: "Bezahlt", count: shopData.orders }
    ];

    box.innerHTML =
      bars(steps, function (row) { return { label: row.label, count: row.count }; }, "") +
      '<p class="muted admin-note">Produktseite und Warenkorb: Besucher laut GoatCounter (Warenkorb erst seit Einbau der Messung). Kasse und Zahlung: Stripe.</p>';
  }

  /* --- Murder Night: Weiterleitungen --------------------------------------- */

  var PLACEMENTS = {
    "recipe-box": "Rezeptseite (Krimi-Box)",
    "krimi-card": "Krimi-Übersicht (Karte)",
    "case-page-hero": "Fallseite oben",
    "case-page-bottom": "Fallseite unten",
    "home-season": "Startseite (Saisonfall oben)",
    "home-pick": "Startseite (Auswahl)",
    "home-menu": "Startseite (Menü)",
    "closing-cta": "Startseite (Schluss)"
  };

  // "the-last-sleigh-ride" -> "The Last Sleigh Ride"
  function caseTitle(slug) {
    return slug.split("-").map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(" ");
  }

  function loadMurderNight() {
    var forDays = days;
    mnBox.classList.add("is-loading");

    api("murdernight", { days: days })
      .then(function (mn) {
        if (forDays !== days) return;
        mnBox.innerHTML = renderMurderNight(mn);
        wireChart(mnBox, mn.daily, "Weiterleitungen");
      })
      .catch(function (error) {
        if (!error.message || forDays !== days) return;
        mnBox.innerHTML = '<section class="admin-panel panel admin-panel--wide"><p class="admin-error">' + esc(error.message) + "</p></section>";
      })
      .then(function () {
        mnBox.classList.remove("is-loading");
      });
  }

  function renderMurderNight(mn) {
    var topCase = mn.cases[0];
    var topPlace = mn.placements[0];
    var mnPerDay = perDay(mn.total, mn.daily);

    var pages;
    if (mn.pages) {
      pages = bars(mn.pages, function (row) { return { label: row.name || "(unbekannt)", count: row.count }; }, "Noch keine Klicks von Besuchern mit Zustimmung.");
    } else {
      pages = '<p class="muted">' + esc(mn.pagesError || "Braucht PostHog (POSTHOG_API_KEY im Worker).") + "</p>";
    }

    return (
      '<div class="admin-tiles">' +
      tile("Weiterleitungen", num(mn.total), "Besucher, die rübergeklickt haben") +
      tile("Ø pro Tag", mnPerDay.toLocaleString("de-DE", { maximumFractionDigits: 1 })) +
      tile("Top-Fall", topCase ? esc(caseTitle(topCase.name)) : "–", topCase ? num(topCase.count) + " Klicks" : "") +
      tile("Top-Stelle", topPlace ? esc(PLACEMENTS[topPlace.name] || topPlace.name) : "–", topPlace ? num(topPlace.count) + " Klicks" : "") +
      "</div>" +
      panel("Weiterleitungen pro Tag", chart(mn.daily, "Weiterleitungen"), "admin-panel--wide") +
      panel("Nach Fall", donut(mn.cases, function (row) { return { label: caseTitle(row.name), count: row.count }; }, "Noch keine Weiterleitungen.", { unit: "Klicks", label: "Nach Fall" })) +
      panel("Nach Stelle", donut(mn.placements, function (row) { return { label: PLACEMENTS[row.name] || row.name, count: row.count }; }, "Noch keine Weiterleitungen.", { unit: "Klicks", label: "Nach Stelle" })) +
      panel(
        "Von welcher Seite",
        pages + '<p class="muted admin-note">Nur Besucher mit Zustimmung (PostHog). Käufe auf Murder Night selbst sind hier nicht zu sehen.</p>',
        "admin-panel--wide"
      )
    );
  }

  /* --- PostHog (nur Besucher mit Einwilligung) ---------------------------- */

  function loadPosthog() {
    var box = body.querySelector("[data-posthog]");
    var forDays = days;

    api("posthog", { days: days })
      .then(function (ph) {
        if (forDays !== days || !box.isConnected) return;
        box.hidden = false;
        box.innerHTML = ph.configured ? posthogPanel(ph) : posthogMissing();
      })
      .catch(function (error) {
        if (!error.message || !box.isConnected) return;
        box.hidden = false;
        box.innerHTML = "<h2>PostHog</h2>" + '<p class="admin-error">' + esc(error.message) + "</p>";
      });
  }

  function posthogPanel(ph) {
    // Grob, weil beide anders zählen – aber ein brauchbarer Hinweis, wie
    // viele im Banner "Accept all" wählen.
    var share = data.visitors ? Math.min(Math.round((ph.visitors / data.visitors) * 100), 100) : null;
    var minutes = Math.floor(ph.avgDuration / 60);
    var seconds = Math.round(ph.avgDuration % 60);

    return (
      '<div class="admin-ph-head"><h2>PostHog – Besucher mit Zustimmung</h2>' +
      '<p class="admin-ph-links"><a class="link-brand" href="' + esc(ph.dashboard) + '" target="_blank" rel="noreferrer">Dashboard</a>' +
      ' · <a class="link-brand" href="' + esc(ph.replays) + '" target="_blank" rel="noreferrer">Aufzeichnungen ansehen</a></p></div>' +
      '<div class="admin-split admin-split--four">' +
      ring(share === null ? null : share / 100, "Zustimmung", num(ph.visitors) + " von ca. " + num(data.visitors) + " Besuchern") +
      ring(ph.sessions ? ph.bounceRate : null, "Absprungrate", "nur eine Seite angesehen") +
      '<div class="admin-mini">' +
      tile("Sitzungen", num(ph.sessions), num(ph.pageviews) + " Seitenaufrufe") +
      tile("Ø Verweildauer", ph.sessions ? (minutes ? minutes + " min " : "") + seconds + " s" : "–") +
      "</div></div>" +
      '<h3 class="admin-subhead">Weg zu den Krimi-Dinnern</h3>' +
      bars(ph.funnel, function (row) {
        return { label: row.label, count: row.count };
      }, "Noch keine Daten.") +
      '<p class="muted admin-note">Zählt Besucher, die den jeweiligen Schritt im Zeitraum erreicht haben.</p>'
    );
  }

  function posthogMissing() {
    return (
      "<h2>PostHog</h2>" +
      '<p class="muted">Noch nicht verbunden. Dafür im Worker den Schlüssel <code>POSTHOG_API_KEY</code> setzen ' +
      "(PostHog → Settings → Personal API keys, Bereich „Query: Read“). Bis dahin: " +
      '<a class="link-brand" href="https://eu.posthog.com/project/327043/dashboard" target="_blank" rel="noreferrer">Dashboard in PostHog</a>.</p>'
    );
  }

  function tile(label, value, sub) {
    return (
      '<div class="admin-tile"><p class="admin-tile__label">' + label + "</p>" +
      '<p class="admin-tile__value">' + value + "</p>" +
      (sub ? '<p class="admin-tile__sub">' + sub + "</p>" : "") +
      "</div>"
    );
  }

  function panel(title, inner, modifier) {
    return '<section class="admin-panel panel ' + (modifier || "") + '"><h2>' + title + "</h2>" + inner + "</section>";
  }

  function plainRow(row) {
    return { label: row.name || "(unbekannt)", count: row.count };
  }

  function refRow(row) {
    return {
      label: row.name || "Direkt / ohne Angabe",
      sub: row.name ? REF_SCHEMES[row.scheme] || "" : "Lesezeichen, eingetippt, oder Apps wie Instagram/TikTok",
      count: row.count
    };
  }

  /* Waagrechte Balken: eine Farbe, Länge = Anteil am größten Wert. */
  function bars(rows, map, empty, clickable) {
    rows = (rows || []).map(map);
    if (!rows.length) return '<p class="muted">' + empty + "</p>";
    var max = Math.max.apply(null, rows.map(function (row) { return row.count; })) || 1;

    return (
      '<ol class="admin-bars">' +
      rows
        .map(function (row) {
          var inner =
            '<span class="admin-bars__text"><span class="admin-bars__label">' + esc(row.label) + "</span>" +
            (row.sub ? '<span class="admin-bars__sub">' + esc(row.sub) + "</span>" : "") +
            "</span>" +
            '<span class="admin-bars__count">' + (row.display || num(row.count)) + "</span>" +
            '<span class="admin-bars__track"><span class="admin-bars__fill" style="width:' +
            Math.max((row.count / max) * 100, 1.5).toFixed(1) + '%"></span></span>';
          return clickable
            ? '<li><button type="button" class="admin-bars__row" data-path-id="' + esc(row.id) + '" aria-expanded="false">' + inner + "</button>" +
                '<div class="admin-refs" hidden></div></li>'
            : '<li><div class="admin-bars__row">' + inner + "</div></li>";
        })
        .join("") +
      "</ol>"
    );
  }

  /* Klicks nach Art gruppiert: "krimi-click/hero/the-comet-vintage" steht
     unter "Krimi-Kaufknopf" als "hero › the-comet-vintage". */
  function events(rows) {
    if (!rows || !rows.length) return '<p class="muted">Noch keine Klicks.</p>';

    var groups = {};
    rows.forEach(function (row) {
      var parts = row.path.replace(/^\//, "").split("/");
      var key = parts.shift();
      (groups[key] = groups[key] || []).push({ name: parts.join(" › ") || key, count: row.count });
    });

    return Object.keys(groups)
      .map(function (key) {
        var total = groups[key].reduce(function (sum, row) { return sum + row.count; }, 0);
        return (
          '<h3 class="admin-subhead">' + esc(EVENT_GROUPS[key] || key) + ' <span class="muted">' + num(total) + "</span></h3>" +
          bars(groups[key], plainRow, "")
        );
      })
      .join("");
  }

  /* --- Tagesdiagramm ----------------------------------------------------- */

  function chart(daily, unit) {
    unit = unit || "Besucher";
    if (!daily.length) return '<p class="muted">Noch keine Daten.</p>';

    // Am Handy schmaler gezeichnet statt nur verkleinert – sonst wird die
    // Schrift der Achsen winzig.
    var width = Math.min(Math.max(body.clientWidth - 40, 300), 720);
    var height = width < 500 ? 200 : 220;
    var pad = { top: 16, right: 8, bottom: 26, left: 36 };
    var innerW = width - pad.left - pad.right;
    var innerH = height - pad.top - pad.bottom;
    var max = Math.max.apply(null, daily.map(function (d) { return d.count; }));
    var top = niceMax(max);
    var slot = innerW / daily.length;
    var gap = slot > 6 ? 2 : slot > 3 ? 1 : 0;
    var barW = Math.max(slot - gap, 1);

    var grid = [0, 0.5, 1]
      .map(function (step) {
        var y = pad.top + innerH - innerH * step;
        return (
          '<line class="admin-chart__grid" x1="' + pad.left + '" x2="' + (width - pad.right) + '" y1="' + y + '" y2="' + y + '"/>' +
          '<text class="admin-chart__axis" x="' + (pad.left - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + num(top * step) + "</text>"
        );
      })
      .join("");

    var ticks = [0, Math.floor((daily.length - 1) / 2), daily.length - 1]
      .filter(function (value, index, all) { return all.indexOf(value) === index; })
      .map(function (i) {
        var anchor = i === 0 ? "start" : i === daily.length - 1 ? "end" : "middle";
        var x = pad.left + slot * i + (anchor === "start" ? 0 : anchor === "end" ? slot : slot / 2);
        return '<text class="admin-chart__axis" x="' + x + '" y="' + (height - 6) + '" text-anchor="' + anchor + '">' + dayLabel(daily[i].day) + "</text>";
      })
      .join("");

    // Weiche Linie durch die Tageswerte (monotone Kurve: schießt nie über
    // einen Wert hinaus und nie unter null), darunter eine Fläche, die nach
    // unten ausläuft.
    var base = pad.top + innerH;
    var points = daily.map(function (d, i) {
      return [pad.left + slot * i + slot / 2, base - (top ? (d.count / top) * innerH : 0)];
    });
    var line = smoothPath(points);
    var gradient = "admin-fill-" + (++chartSeq);
    var area = points.length > 1
      ? line + "L" + points[points.length - 1][0].toFixed(1) + "," + base + "L" + points[0][0].toFixed(1) + "," + base + "Z"
      : "";

    var marks =
      '<defs><linearGradient id="' + gradient + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" class="admin-chart__stop-top" stop-color="#eb6834" stop-opacity="0.3"/><stop offset="1" class="admin-chart__stop-bottom" stop-color="#d4517a" stop-opacity="0"/></linearGradient></defs>' +
      (area ? '<path class="admin-chart__area" d="' + area + '" fill="url(#' + gradient + ')"/>' : "") +
      '<path class="admin-chart__line" d="' + line + '" fill="none" stroke="#eb6834" stroke-width="2.5"/>' +
      daily
        .map(function (d, i) {
          var x = points[i][0];
          // Trefferfläche über die ganze Höhe; Fadenkreuz und Punkt
          // erscheinen erst beim Zeigen.
          return (
            '<g class="admin-chart__day" data-index="' + i + '" tabindex="0">' +
            '<line class="admin-chart__cross" x1="' + x + '" x2="' + x + '" y1="' + pad.top + '" y2="' + base + '" opacity="0"/>' +
            '<circle class="admin-chart__dot" cx="' + x + '" cy="' + points[i][1] + '" r="5" opacity="0"/>' +
            '<rect class="admin-chart__hit" x="' + (pad.left + slot * i) + '" y="' + pad.top + '" width="' + slot + '" height="' + innerH + '"/></g>'
          );
        })
        .join("");

    var table =
      '<details class="admin-table"><summary>Als Tabelle</summary><table><thead><tr><th>Tag</th><th>Besucher</th></tr></thead><tbody>' +
      daily.slice().reverse().map(function (d) {
        return "<tr><td>" + dayLabel(d.day, true) + "</td><td>" + num(d.count) + "</td></tr>";
      }).join("") +
      "</tbody></table></details>";

    return (
      '<div class="admin-chart">' +
      '<svg viewBox="0 0 ' + width + " " + height + '" width="' + width + '" height="' + height + '" role="img" aria-label="' + unit + ' pro Tag, höchster Wert ' + num(max) + '">' +
      grid + marks + ticks +
      '<line class="admin-chart__base" x1="' + pad.left + '" x2="' + (width - pad.right) + '" y1="' + (pad.top + innerH) + '" y2="' + (pad.top + innerH) + '"/>' +
      "</svg>" +
      '<div class="admin-chart__tip" hidden></div>' +
      "</div>" +
      table
    );
  }

  var chartSeq = 0;

  /** Monotone kubische Kurve (Fritsch-Carlson) als SVG-Pfad. */
  function smoothPath(pts) {
    if (!pts.length) return "";
    if (pts.length < 3) {
      return pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1); }).join("");
    }
    var n = pts.length;
    var dx = [], dy = [], m = [], t = [];
    for (var i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1][0] - pts[i][0];
      dy[i] = pts[i + 1][1] - pts[i][1];
      m[i] = dy[i] / dx[i];
    }
    t[0] = m[0];
    t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
      if (h > 9) { var k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    var d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (i = 0; i < n - 1; i++) {
      var c = dx[i] / 3;
      d += "C" + (pts[i][0] + c).toFixed(1) + "," + (pts[i][1] + c * t[i]).toFixed(1) + " " +
        (pts[i + 1][0] - c).toFixed(1) + "," + (pts[i + 1][1] - c * t[i + 1]).toFixed(1) + " " +
        pts[i + 1][0].toFixed(1) + "," + pts[i + 1][1].toFixed(1);
    }
    return d;
  }

  /* --- Kreisdiagramm (Donut) ---------------------------------------------
     Für Anteile: höchstens fünf Stücke in fester Farbreihenfolge, der Rest
     als graues "Andere" – eine sechste, siebte Farbe liest niemand mehr
     auseinander. Die Legende daneben nennt Wert und Anteil, damit nichts
     nur an der Farbe hängt. Zeigen auf ein Stück oder eine Legendenzeile
     hebt beide hervor und schreibt den Wert in die Mitte. */

  var SLICES = 5;
  // Dieselben Töne wie --series-1 … --series-5 und --series-other im
  // Stylesheet. Stehen zusätzlich als Attribut im SVG, damit ein Diagramm
  // auch dann richtig aussieht, wenn das Stylesheet (noch) nicht da ist –
  // sonst malt der Browser jeden Kreis schwarz und gefüllt.
  var SERIES_FALLBACK = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#aeaeb2"];

  function donut(rows, map, empty, opts) {
    opts = opts || {};
    rows = (rows || []).map(map).filter(function (r) { return r.count > 0; });
    rows.sort(function (a, b) { return b.count - a.count; });
    if (!rows.length) return '<p class="muted">' + empty + "</p>";

    var shown = rows.slice(0, SLICES);
    var rest = rows.slice(SLICES).reduce(function (sum, r) { return sum + r.count; }, 0);
    if (rest) shown.push({ label: "Andere", count: rest, other: true });

    var total = shown.reduce(function (sum, r) { return sum + r.count; }, 0);
    var radius = 52;
    var circ = 2 * Math.PI * radius;
    var gap = shown.length > 1 ? 3 : 0;
    var offset = 0;
    var totalText = opts.total || num(total);

    var segments = shown
      .map(function (r, i) {
        var len = (r.count / total) * circ;
        var dash = Math.max(len - gap, 0.6);
        var seg =
          '<circle class="donut__seg donut__seg--' + (r.other ? "other" : i + 1) + '" data-donut-i="' + i + '" r="' + radius + '" cx="64" cy="64"' +
          ' fill="none" stroke-width="18" stroke="' + (r.other ? SERIES_FALLBACK[5] : SERIES_FALLBACK[i]) + '"' +
          ' stroke-dasharray="' + dash.toFixed(2) + " " + (circ - dash).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '"/>';
        offset += len;
        return seg;
      })
      .join("");

    var legend = shown
      .map(function (r, i) {
        var pct = Math.round((r.count / total) * 100);
        return (
          '<li data-donut-i="' + i + '" data-value="' + esc(r.display || num(r.count)) + '" data-label="' + esc(r.label) + '" tabindex="0">' +
          '<span class="donut__dot donut__dot--' + (r.other ? "other" : i + 1) + '"></span>' +
          '<span class="donut__name">' + esc(r.label) + "</span>" +
          '<span class="donut__value">' + esc(r.display || num(r.count)) + '</span><span class="donut__pct">' + pct + " %</span></li>"
        );
      })
      .join("");

    return (
      '<div class="donut" data-total="' + esc(totalText) + '" data-unit="' + esc(opts.unit || "gesamt") + '">' +
      '<div class="donut__figure"><svg viewBox="0 0 128 128" width="152" height="152" role="img" aria-label="' + esc((opts.label || "Anteile") + ": " + shown.map(function (r) { return r.label + " " + (r.display || num(r.count)); }).join(", ")) + '">' +
      '<circle class="donut__track" r="' + radius + '" cx="64" cy="64" fill="none" stroke-width="18" stroke="rgba(0,0,0,0.07)"/>' +
      '<g transform="rotate(-90 64 64)">' + segments + "</g></svg>" +
      '<div class="donut__center"><strong>' + esc(totalText) + "</strong><span>" + esc(opts.unit || "gesamt") + "</span></div></div>" +
      '<ul class="donut__legend">' + legend + "</ul></div>"
    );
  }

  function highlightDonut(target) {
    var box = target.closest(".donut");
    if (!box) return;
    var i = target.getAttribute("data-donut-i");
    var item = box.querySelector('li[data-donut-i="' + i + '"]');
    box.setAttribute("data-active", i);
    box.querySelectorAll("[data-donut-i]").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-donut-i") === i);
    });
    box.querySelector(".donut__center strong").textContent = item.getAttribute("data-value");
    box.querySelector(".donut__center span").textContent = item.getAttribute("data-label");
  }

  function resetDonut(box) {
    box.removeAttribute("data-active");
    box.querySelectorAll(".is-active").forEach(function (el) { el.classList.remove("is-active"); });
    box.querySelector(".donut__center strong").textContent = box.getAttribute("data-total");
    box.querySelector(".donut__center span").textContent = box.getAttribute("data-unit");
  }

  // Ein Zuhörer für alle Kreisdiagramme, auch die später nachgeladenen.
  ["mouseover", "focusin"].forEach(function (type) {
    document.addEventListener(type, function (event) {
      var target = event.target.closest && event.target.closest("[data-donut-i]");
      if (target) highlightDonut(target);
    });
  });
  document.addEventListener("mouseout", function (event) {
    var box = event.target.closest && event.target.closest(".donut");
    if (box && !box.contains(event.relatedTarget)) resetDonut(box);
  });
  document.addEventListener("focusout", function (event) {
    var box = event.target.closest && event.target.closest(".donut");
    if (box && !box.contains(event.relatedTarget)) resetDonut(box);
  });

  /* --- Ringanzeige für eine Quote (0–1) ------------------------------------ */

  function ring(fraction, label, sub) {
    var radius = 44;
    var circ = 2 * Math.PI * radius;
    var known = fraction !== null && fraction !== undefined && isFinite(fraction);
    var value = known ? Math.max(0, Math.min(1, fraction)) : 0;
    return (
      '<div class="ring">' +
      '<div class="ring__figure"><svg viewBox="0 0 100 100" width="128" height="128" role="img" aria-label="' + esc(label + ": " + (known ? Math.round(value * 100) + " %" : "keine Daten")) + '">' +
      '<circle class="ring__track" r="' + radius + '" cx="50" cy="50" fill="none" stroke-width="10" stroke="rgba(0,0,0,0.07)"/>' +
      (known && value > 0
        ? '<circle class="ring__value" r="' + radius + '" cx="50" cy="50" transform="rotate(-90 50 50)" fill="none" stroke-width="10" stroke="#eb6834" stroke-linecap="round" stroke-dasharray="' + (value * circ).toFixed(2) + " " + circ.toFixed(2) + '"/>'
        : "") +
      "</svg>" +
      '<strong class="ring__pct">' + (known ? Math.round(value * 100) + " %" : "–") + "</strong></div>" +
      '<p class="ring__label">' + esc(label) + "</p>" +
      (sub ? '<p class="ring__sub">' + esc(sub) + "</p>" : "") +
      "</div>"
    );
  }

  function niceMax(value) {
    if (value <= 4) return 4;
    var magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) {
      if (steps[i] * magnitude >= value) return steps[i] * magnitude;
    }
    return 10 * magnitude;
  }

  function wireChart(container, daily, unit) {
    var box = container.querySelector(".admin-chart");
    if (!box) return;
    var tip = box.querySelector(".admin-chart__tip");

    function show(group) {
      var d = daily[parseInt(group.getAttribute("data-index"), 10)];
      box.querySelectorAll(".is-hover").forEach(function (el) { el.classList.remove("is-hover"); });
      group.classList.add("is-hover");
      tip.innerHTML = "<strong>" + num(d.count) + "</strong> " + unit + "<br>" + dayLabel(d.day, true);
      tip.hidden = false;

      var boxRect = box.getBoundingClientRect();
      var rect = group.querySelector(".admin-chart__hit").getBoundingClientRect();
      var left = rect.left - boxRect.left + rect.width / 2;
      tip.style.left = Math.min(Math.max(left, 60), boxRect.width - 60) + "px";
    }

    function hide() {
      tip.hidden = true;
      box.querySelectorAll(".is-hover").forEach(function (el) { el.classList.remove("is-hover"); });
    }

    box.querySelectorAll(".admin-chart__day").forEach(function (group) {
      group.addEventListener("mouseenter", function () { show(group); });
      group.addEventListener("focus", function () { show(group); });
      group.addEventListener("click", function () { show(group); });
      group.addEventListener("blur", hide);
    });
    box.addEventListener("mouseleave", hide);
  }

  /* --- Herkunft je Seite ------------------------------------------------- */

  function wirePages() {
    body.querySelectorAll("[data-path-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        var box = button.nextElementSibling;
        var open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", open ? "false" : "true");
        box.hidden = open;
        if (open || box.getAttribute("data-loaded")) return;

        box.innerHTML = '<p class="muted">Lade …</p>';
        api("refs", { days: days, path_id: button.getAttribute("data-path-id") })
          .then(function (json) {
            box.setAttribute("data-loaded", "1");
            box.innerHTML = bars(json.refs, refRow, "Keine Herkunft bekannt.");
          })
          .catch(function (error) {
            box.innerHTML = '<p class="admin-error">' + esc(error.message) + "</p>";
          });
      });
    });
  }

  /* --- Eigene Besuche ausblenden ------------------------------------------ */

  /* Dieselben Schlüssel, die site.js vor dem Laden der Zähler prüft:
     "ct-exclude" sperrt GoatCounter und PostHog, "skipgc" versteht
     GoatCounters count.js zusätzlich selbst. admin.html liegt auf derselben
     Adresse wie die Website, der Eintrag gilt also dort. */
  function deviceExcluded() {
    return read(localStorage, "ct-exclude") === "1" || read(localStorage, "skipgc") === "t";
  }

  function showDevice() {
    var off = deviceExcluded();
    deviceBox.classList.toggle("is-excluded", off);
    deviceState.textContent = off ? "Wird nicht mitgezählt" : "Wird mitgezählt";
    deviceToggle.textContent = off ? "Wieder mitzählen" : "Nicht mitzählen";
    deviceToggle.setAttribute("aria-pressed", off ? "true" : "false");
  }

  deviceToggle.addEventListener("click", function () {
    var off = !deviceExcluded();
    write(localStorage, "ct-exclude", off ? "1" : null);
    write(localStorage, "skipgc", off ? "t" : null);
    showDevice();
    if (deviceExcluded() !== off) deviceState.textContent = "Konnte nicht gespeichert werden – privates Fenster?";
  });

  showDevice();

  /* --- Start ------------------------------------------------------------- */

  if (read(sessionStorage, TOKEN_KEY)) showDashboard();
  else showLogin();
})();
