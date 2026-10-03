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
    renderCustomerPhotos();
  });
})();
