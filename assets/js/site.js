/**
 * WAS AUF JEDER SEITE LÄUFT
 *
 * Setzt die Werte aus assets/js/site-config.js um. Jeder Teil tut nichts,
 * solange sein Eintrag dort leer oder ausgeschaltet ist – die Seiten sehen
 * dann genau so aus, wie sie im HTML stehen.
 *
 * Voraussetzung: site-config.js ist vorher geladen.
 */
(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};

  /* Diese Datei wird von Seiten im Hauptordner und aus recipes/ und shop/
     geladen. Der Weg zurück zum Hauptordner ("" oder "../") steckt in ihrer
     eigenen Adresse. */
  var script = document.currentScript;
  var root = script
    ? script.getAttribute("src").replace(/assets\/js\/site\.js.*$/, "")
    : "";

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* --- Saison (Krimi-Dinner) ----------------------------------------------
     Eine statische Seite kennt das heutige Datum nicht – deshalb entscheidet
     hier der Browser des Besuchers. Alle Werte schreibt tools/cases.py aus
     data/cases.json in die Seite (Feld "seasonal" eines Falls):

       Leiste      data-season-months="11,12" + data-season-href/-short/-long:
                   im Zeitraum wirbt sie für diesen Fall statt für alle.
       Karten      .krimi-cases__item[data-seasonal="11,12"]: rückt nach vorn,
                   bekommt das Abzeichen "Seasonal pick".
       Startseite  [data-season-only] erscheint nur im Zeitraum,
                   [data-off-season-only] nur außerhalb. */

  function inSeason(list) {
    var month = new Date().getMonth() + 1;
    return String(list || "").split(",").map(Number).indexOf(month) !== -1;
  }

  function applySeason() {
    document.querySelectorAll(".announcement__deal[data-season-months]").forEach(function (link) {
      if (!inSeason(link.getAttribute("data-season-months"))) return;
      var narrow = link.querySelector(".only-narrow");
      var wide = link.querySelector(".only-wide");
      if (narrow) narrow.textContent = link.getAttribute("data-season-short");
      if (wide) wide.textContent = link.getAttribute("data-season-long");
      link.setAttribute("href", link.getAttribute("data-season-href"));
      link.setAttribute("data-track", link.getAttribute("data-season-track"));
    });

    document.querySelectorAll(".krimi-cases__item[data-seasonal]").forEach(function (cell) {
      if (!inSeason(cell.getAttribute("data-seasonal"))) return;
      var card = cell.querySelector(".krimi-card");
      var badge = cell.querySelector("[data-season-badge]");
      if (card) card.classList.add("is-seasonal");
      if (badge) badge.hidden = false;
      cell.parentNode.insertBefore(cell, cell.parentNode.firstElementChild);
    });

    document.querySelectorAll("[data-season-only]").forEach(function (el) {
      if (!inSeason(el.getAttribute("data-season-only"))) return;
      el.hidden = false;
      var badge = el.querySelector("[data-season-badge]");
      var card = el.querySelector(".krimi-card");
      if (badge) badge.hidden = false;
      if (card) card.classList.add("is-seasonal");
    });
    document.querySelectorAll("[data-off-season-only]").forEach(function (el) {
      if (inSeason(el.getAttribute("data-off-season-only"))) el.hidden = true;
    });
  }

  /* --- Herkunft eines Kaufs (utm_content) -----------------------------------
     Kaufknöpfe tragen utm_content = ihre Stelle (z. B. "krimi-card"). Kam der
     Besucher über einen Link mit data-via="nav" (Navigation, Leiste, Fuß,
     Rezept-Box …) auf die Krimi- oder Fallseite, hängt diese Stelle sich an:
     utm_content=krimi-card--from-nav. Gemerkt wird nur der letzte Weg, nur
     für diesen Tab (sessionStorage) und ohne die Adresse zu verändern. */

  var VIA_KEY = "ct-via";

  function setupVia() {
    document.addEventListener(
      "click",
      function (event) {
        var link = event.target.closest ? event.target.closest("a") : null;
        if (!link) return;

        var via = link.getAttribute("data-via");
        if (via) {
          try { sessionStorage.setItem(VIA_KEY, via); } catch (e) { /* privat: dann eben ohne */ }
          return;
        }

        if (!link.hasAttribute("data-mn-funnel")) return;
        var from = "";
        try { from = sessionStorage.getItem(VIA_KEY) || ""; } catch (e) { /* ohne */ }
        if (!/^[a-z0-9-]+$/.test(from)) return;
        link.href = link.href.replace(/([?&]utm_content=)([^&#]*)/, function (all, key, value) {
          return key + value.replace(/--from-[a-z0-9-]+$/, "") + "--from-" + from;
        });
      },
      true
    );
  }

  /* --- Newsletter ----------------------------------------------------------- */

  function renderNewsletter() {
    var news = config.newsletter;
    if (!news || !news.enabled || !news.formAction) return;

    document.querySelectorAll("[data-newsletter]").forEach(function (box, index) {
      var id = "newsletter-email-" + index;

      box.innerHTML =
        '<section class="panel panel--outline newsletter" aria-label="Newsletter">' +
        '<h2 class="newsletter__title">' + esc(news.heading) + "</h2>" +
        (news.text ? '<p class="newsletter__text">' + esc(news.text) + "</p>" : "") +
        /* target="_blank": Die Bestätigungsseite des Anbieters öffnet sich
           daneben, das Rezept bleibt offen. */
        '<form class="newsletter__form" method="post" target="_blank" action="' + esc(news.formAction) + '" data-track-submit="newsletter-signup">' +
        '<label class="sr-only" for="' + id + '">Email address</label>' +
        '<input id="' + id + '" type="email" required autocomplete="email" inputmode="email"' +
        ' name="' + esc(news.emailField || "EMAIL") + '" placeholder="you@example.com">' +
        '<button type="submit" class="btn btn--primary">' + esc(news.button || "Sign up") + "</button>" +
        "</form>" +
        '<p class="newsletter__note">' + esc(news.note || "") +
        ' <a href="' + root + 'privacy.html">Privacy</a></p>' +
        "</section>";
      box.hidden = false;
    });
  }

  /* --- Besucherzählung ------------------------------------------------------ */

  function setupTracking() {
    var code = ((config.tracking || {}).goatcounter || "").trim();
    // Nur Buchstaben, Ziffern, Bindestrich – der Wert landet in einer Adresse.
    if (!/^[a-z0-9-]+$/i.test(code)) return;

    var tag = document.createElement("script");
    tag.async = true;
    // Von unserem eigenen Server statt von gc.zgo.at – privacy.html sagt zu,
    // dass alle Skripte von hier kommen. Kopie des offiziellen count.js
    // (ISC-Lizenz), Stand 30.10.2026; nur bei Bedarf neu holen.
    // Neben site.js; die Seiten liegen in verschiedenen Ordnern.
    var self = document.querySelector('script[src$="site.js"]');
    tag.src = new URL("goatcounter-count.js", self ? self.src : location.href).href;
    tag.setAttribute("data-goatcounter", "https://" + code + ".goatcounter.com/count");
    document.head.appendChild(tag);

    function count(name) {
      if (!name || !window.goatcounter || !window.goatcounter.count) return;
      window.goatcounter.count({ path: name, title: location.pathname, event: true });
    }

    /* Ein Zuhörer für die ganze Seite: Er erfasst auch Karten, die erst ein
       Skript eingesetzt hat. Der Klick selbst läuft ungestört weiter. */
    document.addEventListener(
      "click",
      function (event) {
        var target = event.target.closest ? event.target.closest("[data-track]") : null;
        if (target) count(target.getAttribute("data-track"));
      },
      true
    );

    document.addEventListener(
      "submit",
      function (event) {
        count(event.target.getAttribute && event.target.getAttribute("data-track-submit"));
      },
      true
    );
  }

  /* --- Kundenfotos ------------------------------------------------------- */

  function renderCustomerPhotos() {
    var photos = (config.customerPhotos || []).filter(function (photo) {
      return photo && photo.file;
    });
    if (!photos.length) return;

    document.querySelectorAll("[data-customer-photos]").forEach(function (box) {
      box.innerHTML =
        '<section aria-labelledby="in-your-kitchens">' +
        '<h2 id="in-your-kitchens" style="font-size:1.25rem">In your kitchens</h2>' +
        '<p class="muted" style="margin-top:.25rem;font-size:.875rem">Photos you sent me – thank you!</p>' +
        '<ul class="customer-photos no-scrollbar">' +
        photos
          .map(function (photo) {
            return (
              "<li><figure>" +
              '<img src="' + esc(root + "assets/img/customers/" + photo.file) + '" alt="' + esc(photo.alt || "") + '" loading="lazy">' +
              (photo.by ? "<figcaption>" + esc(photo.by) + "</figcaption>" : "") +
              "</figure></li>"
            );
          })
          .join("") +
        "</ul>" +
        "</section>";
      box.hidden = false;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applySeason();
    setupVia();
    renderNewsletter();
    renderCustomerPhotos();
    setupTracking();
  });
})();
