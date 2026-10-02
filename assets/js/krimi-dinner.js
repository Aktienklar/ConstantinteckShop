/**
 * KRIMI-DINNER – ANZEIGE
 *
 * Baut aus assets/js/krimi-dinner-data.js alles, was auf dieser Website zu den
 * Krimi-Dinnern zu sehen ist. Im HTML stehen dafür nur Markierungen:
 *
 *   <div data-krimi-cases></div>
 *       Die Karten aller Fälle (krimi-dinner.html).
 *
 *   <a data-krimi-link="shop">…</a>      oder  data-krimi-link="home"
 *       Bekommt die Adresse bei krimiabend24.de samt UTM-Parametern.
 *
 *   <span data-krimi-from-price></span>   <span data-krimi-count></span>
 *       Niedrigster Preis bzw. Anzahl der Fälle – für die Teaser-Karte im Shop.
 *
 *   <div data-krimi-hint="the-teatime-caper"></div>
 *       Der Hinweis-Block für eine Rezeptseite. Der Wert ist die id des Falls
 *       aus KRIMI_CASES; ohne Wert führt der Block zur Shop-Übersicht.
 *
 * Hier wird nichts verkauft und nichts in den Warenkorb gelegt – jeder Knopf
 * ist ein Link nach krimiabend24.de. Die Datei kennt cart.js nicht, und das
 * soll so bleiben.
 *
 * Voraussetzung: krimi-dinner-data.js ist vorher geladen.
 */
(function () {
  "use strict";

  /* Diese Datei wird von Seiten im Hauptordner und aus recipes/ geladen. Der
     Weg zurück zum Hauptordner ("" oder "../") steckt in ihrer eigenen
     Adresse – daraus werden Bildpfade gebaut, die auf beiden Ebenen stimmen. */
  var script = document.currentScript;
  var root = script
    ? script.getAttribute("src").replace(/assets\/js\/krimi-dinner\.js.*$/, "")
    : "";

  var ICON_CASE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.6" cy="10.6" r="6.4"/><path d="m15.4 15.4 5.2 5.2"/><path d="M8.2 10.6a2.4 2.4 0 0 1 2.4-2.4"/></svg>';
  var ICON_PLAYERS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M2.8 19.2a6.2 6.2 0 0 1 12.4 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M18.2 14.4a6.2 6.2 0 0 1 3 4.8"/></svg>';
  var ICON_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.KRIMI_CASES) return;

    document.querySelectorAll("[data-krimi-cases]").forEach(renderCases);
    document.querySelectorAll("[data-krimi-link]").forEach(setLink);
    document.querySelectorAll("[data-krimi-from-price]").forEach(setFromPrice);
    document.querySelectorAll("[data-krimi-count]").forEach(function (el) {
      el.textContent = krimiCases().length;
    });
    document.querySelectorAll("[data-krimi-hint]").forEach(renderHint);

    /* Zeilen, die nur mit eingesetzten Zahlen Sinn ergeben, stehen im HTML
       auf "hidden" und werden erst jetzt gezeigt. */
    document.querySelectorAll("[data-krimi-reveal]").forEach(function (el) {
      el.hidden = false;
    });
  });

  function labels() {
    return KRIMI_LABELS[KRIMI_SITE.lang];
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Externe Links öffnen im neuen Tab, damit das Rezept offen bleibt.
     "noopener" ohne "noreferrer": krimiabend24.de darf sehen, woher der
     Besuch kommt – genau dafür sind die UTM-Parameter da. */
  function externalAttrs(href) {
    return ' href="' + escapeHtml(href) + '" target="_blank" rel="noopener"';
  }

  function newTabHint() {
    return (
      ' <span aria-hidden="true">↗</span><span class="sr-only"> (' +
      escapeHtml(labels().newTab) +
      ")</span>"
    );
  }

  function metaLine(item) {
    return (
      "<span>" + ICON_PLAYERS + escapeHtml(item.players) + " " + labels().players + "</span>" +
      "<span>" + ICON_CLOCK + escapeHtml(labels().duration(item.hours)) + "</span>"
    );
  }

  /* Solange kein eigenes Cover hinterlegt ist, steht hier eine neutrale Fläche
     in den Farben der Seite. TODO: echte Cover in krimi-dinner-data.js
     eintragen (Feld "image"). */
  function media(item) {
    if (item.image) {
      return (
        '<img src="' + escapeHtml(root + item.image) + '" alt="" loading="lazy">'
      );
    }
    return '<div class="krimi-placeholder" aria-hidden="true">' + ICON_CASE + "</div>";
  }

  function renderCases(box) {
    var html = krimiCases()
      .map(function (item, index) {
        var text = item[KRIMI_SITE.lang];
        var href = krimiUrl(text.path);

        return (
          '<div class="rise" style="animation-delay:' + index * 70 + 'ms;height:100%">' +
          '<article class="card product-card lift-3d" style="height:100%">' +
          '<a class="krimi-card__media" tabindex="-1" aria-hidden="true"' + externalAttrs(href) + ">" +
          media(item) +
          "</a>" +
          '<div class="product-card__body">' +
          '<span class="tag krimi-card__genre">' + escapeHtml(text.genre) + "</span>" +
          "<h3><a" + externalAttrs(href) + ">" + escapeHtml(text.title) + "</a></h3>" +
          '<div class="recipe-card__meta">' + metaLine(item) + "</div>" +
          '<div class="product-card__foot">' +
          '<span class="product-card__price">' + krimiPrice(item.price) + "</span>" +
          '<a class="btn btn--primary btn--sm"' + externalAttrs(href) + ">" +
          escapeHtml(labels().toCase) + newTabHint() +
          "</a>" +
          "</div>" +
          "</div>" +
          "</article>" +
          "</div>"
        );
      })
      .join("");

    box.innerHTML = html;
  }

  function setLink(link) {
    var target = link.getAttribute("data-krimi-link") || "shop";
    var paths = KRIMI_SITE.paths[KRIMI_SITE.lang];

    link.href = krimiUrl(
      paths[target] || paths.shop,
      link.getAttribute("data-krimi-campaign") || undefined
    );
    link.target = "_blank";
    link.rel = "noopener";
  }

  function setFromPrice(el) {
    var prices = krimiCases().map(function (item) {
      return item.price;
    });
    if (prices.length) el.textContent = krimiPrice(Math.min.apply(null, prices));
  }

  /* Der Hinweis auf einer Rezeptseite. Steht dort eine id, die es nicht (oder
     nicht in dieser Sprache) gibt, bleibt die Stelle leer – ein Knopf, der auf
     einen falschen Fall zeigt, wäre schlimmer als keiner. */
  function renderHint(box) {
    var id = box.getAttribute("data-krimi-hint");
    var path = KRIMI_SITE.paths[KRIMI_SITE.lang].shop;
    var detail = "";

    if (id) {
      var item = krimiCases().filter(function (entry) {
        return entry.id === id;
      })[0];

      if (!item) {
        box.remove();
        return;
      }

      var text = item[KRIMI_SITE.lang];
      path = text.path;
      detail =
        '<p class="krimi-hint__case">' +
        "<b>" + escapeHtml(text.title) + "</b> · " +
        escapeHtml(item.players) + " " + labels().players + " · " +
        escapeHtml(labels().duration(item.hours)) + " · " +
        krimiPrice(item.price) +
        "</p>";
    }

    box.innerHTML =
      '<aside class="panel panel--outline krimi-hint" aria-label="' +
      escapeHtml(labels().hintEyebrow) + '">' +
      '<span class="shop-section__icon">' + ICON_CASE + "</span>" +
      '<div class="krimi-hint__text">' +
      '<p class="eyebrow">' + escapeHtml(labels().hintEyebrow) + "</p>" +
      '<p class="krimi-hint__lead">' + escapeHtml(labels().hintText) + "</p>" +
      detail +
      "</div>" +
      '<a class="btn btn--secondary"' +
      externalAttrs(krimiUrl(path, KRIMI_SITE.recipeCampaign)) + ">" +
      escapeHtml(labels().toGame) + newTabHint() +
      "</a>" +
      "</aside>";
  }
})();
