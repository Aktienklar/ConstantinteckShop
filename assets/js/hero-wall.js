/**
 * REZEPTWAND IM HERO
 *
 * Die Bahnen der Wand laufen endlos. Dafür braucht jede Bahn ihren Inhalt
 * zweimal hintereinander: Die Animation schiebt sie um genau die Hälfte
 * weiter und springt dann unsichtbar zurück. Die zweite Hälfte wird hier
 * erzeugt, damit im HTML jedes Rezept nur einmal steht.
 *
 * Ohne dieses Skript bleibt die Wand stehen und zeigt die ersten Karten jeder
 * Bahn – die Links funktionieren trotzdem.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var wall = document.querySelector("[data-hero-wall]");
    if (!wall) return;

    function fill(track) {
      if (track.dataset.filled) return;
      track.dataset.filled = "true";
      Array.prototype.slice.call(track.children).forEach(function (card) {
        var copy = card.cloneNode(true);
        /* Die Kopie ist nur fürs Auge: Screenreader und Tab-Taste sollen
           jedes Rezept einmal antreffen, nicht zweimal. */
        copy.setAttribute("aria-hidden", "true");
        copy.tabIndex = -1;
        track.appendChild(copy);
      });
    }

    wall.querySelectorAll(".hero__track").forEach(fill);

    wall.classList.add("is-live");

    /* Zurück-Taste: Der Browser holt die Seite eingefroren aus dem Speicher,
       statt sie neu zu laden. Safari am iPhone zeichnet die Wand danach aus
       alten Ebenen zusammen – der untere Rand der Karten sitzt versetzt und
       liegt über dem Verlauf. Die Wand einmal aus der Seite nehmen und
       wieder einsetzen: Dann baut der Browser sie so auf wie beim ersten
       Laden. */
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      if (wall.contains(document.activeElement)) document.activeElement.blur();
      var parent = wall.parentNode;
      var next = wall.nextSibling;
      parent.removeChild(wall);
      void parent.offsetWidth;
      parent.insertBefore(wall, next);
    });
  });
})();
