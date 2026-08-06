/**
 * TEILEN-BUTTONS AUF DEN REZEPTSEITEN
 *
 * Nutzt den Teilen-Dialog des Systems, wo es ihn gibt (Handy), und fällt
 * sonst auf "Link kopieren" zurück. Die Adresse kommt aus window.location –
 * damit stimmt sie automatisch, egal ob die Seite lokal, auf GitHub Pages
 * oder unter einer eigenen Domain läuft.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // Der Seitentitel trägt den Websitenamen als Zusatz ("Rezept | Constantinteck").
    // Geteilt wird nur der Rezepttitel – der Rest steht ohnehin im Link.
    var title = document.title.split(" | ")[0];

    function currentUrl() {
      return window.location.href.split("#")[0];
    }

    function copy(button) {
      var original = button.textContent;

      navigator.clipboard.writeText(currentUrl()).then(
        function () {
          button.textContent = "Link copied ✓";
          setTimeout(function () {
            button.textContent = original;
          }, 2000);
        },
        function () {
          // Zwischenablage nicht verfügbar (z. B. ohne HTTPS) – dann
          // passiert schlicht nichts, statt eine Fehlermeldung zu zeigen.
        }
      );
    }

    document.querySelectorAll("[data-share]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (navigator.share) {
          navigator.share({ title: title, url: currentUrl() }).catch(function () {
            // Abgebrochen – dann einfach nichts tun.
          });
          return;
        }
        copy(button);
      });
    });

    document.querySelectorAll("[data-copy]").forEach(function (button) {
      button.addEventListener("click", function () {
        copy(button);
      });
    });

    // Der WhatsApp-Link braucht die volle Adresse, die es erst im Browser gibt.
    document.querySelectorAll("[data-whatsapp]").forEach(function (link) {
      link.href =
        "https://wa.me/?text=" + encodeURIComponent(title + " " + currentUrl());
    });
  });
})();
