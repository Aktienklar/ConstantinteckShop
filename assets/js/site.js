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

  /* --- Ankündigungsleiste -------------------------------------------------- */

  /** "2026-11-01" -> lokales Datum um Mitternacht; leer oder kaputt -> null */
  function day(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return match ? new Date(+match[1], +match[2] - 1, +match[3]) : null;
  }

  function applyBanner() {
    var banner = config.banner;
    if (!banner || !banner.enabled || !banner.text) return;

    var now = new Date();
    var start = day(banner.start);
    var end = day(banner.end);
    if (start && now < start) return;
    // Der Endtag zählt ganz mit.
    if (end && now >= new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)) return;

    var long = banner.text;
    var short = banner.textShort || banner.text;
    if ((long + short).indexOf("{orderBy}") !== -1) {
      if (!banner.orderBy) return;
      long = long.replace("{orderBy}", banner.orderBy);
      short = short.replace("{orderBy}", banner.orderBy);
    }

    document.querySelectorAll(".announcement__deal").forEach(function (link) {
      var narrow = link.querySelector(".only-narrow");
      var wide = link.querySelector(".only-wide");
      if (!narrow || !wide) return;

      narrow.textContent = short;
      wide.textContent = long;
      if (banner.href) link.setAttribute("href", root + banner.href);
      link.setAttribute("data-track", "banner-click");
    });
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
    tag.src = "https://gc.zgo.at/count.js";
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
    applyBanner();
    renderNewsletter();
    renderCustomerPhotos();
    setupTracking();
  });
})();
