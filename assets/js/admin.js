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
  var errorBox = document.querySelector("[data-admin-error]");
  var logout = document.querySelector("[data-admin-logout]");
  var skip = document.querySelector("[data-admin-skip]");
  var rangeButtons = document.querySelectorAll("[data-days]");

  var days = parseInt(read(sessionStorage, DAYS_KEY) || "30", 10);
  var data = null;

  /* Klick-Ereignisse aus site-config.js, für Menschen übersetzt. */
  var EVENT_GROUPS = {
    "krimi-click": "Krimi-Kaufknopf (zu Murdernight)",
    "krimi-menu": "Rezept aus einem Krimi-Menü",
    "product-click": "Produktkarte",
    "banner-click": "Ankündigungsleiste",
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

    api("stats", { days: days })
      .then(function (json) {
        data = json;
        render();
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

  function render() {
    var daily = data.daily || [];
    var top = (data.referrers || []).filter(function (ref) {
      return ref.name;
    })[0];

    body.innerHTML =
      '<div class="admin-tiles">' +
      tile("Besucher", num(data.visitors)) +
      tile("Ø pro Tag", num(Math.round(data.visitors / Math.max(daily.length, 1)))) +
      tile("Klicks", num(data.clicks), "auf markierte Knöpfe") +
      tile("Top-Quelle", top ? esc(top.name) : "–", top ? num(top.count) + " Besucher" : "") +
      "</div>" +
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
      panel("Woher sie kamen", bars(data.referrers, refRow, "Noch keine Daten.")) +
      panel("Klicks", events(data.events)) +
      panel("Kampagnen (utm / ref)", bars(data.campaigns, plainRow, "Keine Kampagnen-Links benutzt.")) +
      panel("Länder", bars(data.countries, plainRow, "Noch keine Daten.")) +
      panel("Geräte (Bildschirm)", bars(data.sizes, plainRow, "Noch keine Daten.")) +
      panel("Systeme", bars(data.systems, plainRow, "Noch keine Daten.")) +
      panel("Browser", bars(data.browsers, plainRow, "Noch keine Daten."));

    wireChart();
    wirePages();
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
            '<span class="admin-bars__count">' + num(row.count) + "</span>" +
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

  function chart(daily) {
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

    var marks = daily
      .map(function (d, i) {
        var h = top ? (d.count / top) * innerH : 0;
        var x = pad.left + slot * i + gap / 2;
        var y = pad.top + innerH - h;
        var r = Math.min(4, barW / 2, h);
        // Oben abgerundet, unten gerade auf der Grundlinie.
        var bar = h > 0
          ? '<path class="admin-chart__bar" d="M' + x + "," + (pad.top + innerH) + "V" + (y + r) +
            "q0,-" + r + " " + r + ",-" + r + "H" + (x + barW - r) + "q" + r + ",0 " + r + "," + r +
            "V" + (pad.top + innerH) + 'Z"/>'
          : "";
        // Trefferfläche über die ganze Höhe – auch kleine Balken sind antippbar.
        return (
          '<g class="admin-chart__day" data-index="' + i + '" tabindex="0">' + bar +
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
      '<svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Besucher pro Tag, höchster Wert ' + num(max) + '">' +
      grid + marks + ticks +
      '<line class="admin-chart__base" x1="' + pad.left + '" x2="' + (width - pad.right) + '" y1="' + (pad.top + innerH) + '" y2="' + (pad.top + innerH) + '"/>' +
      "</svg>" +
      '<div class="admin-chart__tip" hidden></div>' +
      "</div>" +
      table
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

  function wireChart() {
    var box = body.querySelector(".admin-chart");
    if (!box) return;
    var tip = box.querySelector(".admin-chart__tip");

    function show(group) {
      var d = data.daily[parseInt(group.getAttribute("data-index"), 10)];
      box.querySelectorAll(".is-hover").forEach(function (el) { el.classList.remove("is-hover"); });
      group.classList.add("is-hover");
      tip.innerHTML = "<strong>" + num(d.count) + "</strong> Besucher<br>" + dayLabel(d.day, true);
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

  /* count.js von GoatCounter zählt nicht, solange "skipgc" = "t" in
     localStorage steht. Gilt nur für diesen Browser auf diesem Gerät. */
  skip.checked = read(localStorage, "skipgc") === "t";
  skip.addEventListener("change", function () {
    write(localStorage, "skipgc", skip.checked ? "t" : null);
  });

  /* --- Start ------------------------------------------------------------- */

  if (read(sessionStorage, TOKEN_KEY)) showDashboard();
  else showLogin();
})();
