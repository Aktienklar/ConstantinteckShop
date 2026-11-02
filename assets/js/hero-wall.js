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

    /* Eine Bahn hat nur sechs Karten – schmaler als ein breites Fenster.
       Deshalb kommt der Satz so oft hinter sich, bis die Hälfte der Bahn
       breiter ist als die Wand; die Gesamtzahl bleibt gerade, damit die
       Hälfte genau eine Runde ist. Die Dauer wächst mit, damit das Tempo
       gleich bleibt (die Zeiten in styles.css gelten für eine Hälfte aus
       BASE_CARDS Karten). */
    var BASE_CARDS = 13;

    function fill(track) {
      if (track.dataset.filled) return;
      track.dataset.filled = "true";
      var set = Array.prototype.slice.call(track.children);
      var setWidth = track.scrollWidth || 1;
      var half = Math.max(1, Math.ceil((wall.offsetWidth * 1.1) / setWidth));
      for (var i = 1; i < half * 2; i++) {
        set.forEach(function (card) {
          var copy = card.cloneNode(true);
          /* Die Kopie ist nur fürs Auge. */
          copy.setAttribute("aria-hidden", "true");
          copy.tabIndex = -1;
          track.appendChild(copy);
        });
      }
      var base = parseFloat(getComputedStyle(track).animationDuration) || 0;
      if (base) track.style.animationDuration = (base * half * set.length) / BASE_CARDS + "s";
    }

    /* Erst is-live, damit fill() die Dauer aus styles.css lesen kann –
       beides im selben Durchlauf, der Browser zeichnet dazwischen nicht. */
    wall.classList.add("is-live");
    wall.querySelectorAll(".hero__track").forEach(fill);

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
