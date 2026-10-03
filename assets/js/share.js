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
      function done() {
        if (button.getAttribute("data-label")) return;
        button.setAttribute("data-label", button.innerHTML);
        button.textContent = "Link copied ✓";
        setTimeout(function () {
          button.innerHTML = button.getAttribute("data-label");
          button.removeAttribute("data-label");
        }, 2000);
      }

      /* Manche In-App-Browser (Instagram, TikTok) kennen navigator.clipboard
         nicht oder verweigern es – dann der alte Weg über ein Textfeld. */
      function legacy() {
        var field = document.createElement("textarea");
        field.value = currentUrl();
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        try {
          if (document.execCommand("copy")) done();
        } catch (error) {
          // Auch das geht nicht – dann passiert schlicht nichts.
        }
        field.remove();
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentUrl()).then(done, legacy);
      } else {
        legacy();
      }
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

    // Im HTML steht der Link schon mit Titel und veröffentlichter Adresse; hier
    // wird er auf die Adresse gesetzt, unter der die Seite gerade wirklich läuft.
    document.querySelectorAll("[data-whatsapp]").forEach(function (link) {
      link.href =
        "https://wa.me/?text=" + encodeURIComponent(title + " " + currentUrl());
    });
  });
})();
