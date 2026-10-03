/**
 * HINWEIS-KARTE AUF DER STARTSEITE
 *
 * Blendet die Karte [data-promo] ein, sobald jemand ein Stück gescrollt hat –
 * spätestens nach ein paar Sekunden – und schließt sie auf Klick oder mit
 * Escape. Nicht sofort: Auf dem Handy läge sie sonst über der Überschrift und
 * den beiden Knöpfen, bevor jemand sie gelesen hat.
 *
 * Bewusst OHNE Speicher: Ob jemand die Karte geschlossen hat, wird nirgends
 * abgelegt – kein Cookie, kein localStorage. Die Datenschutzerklärung sagt,
 * im Browser liege nur der Warenkorb; das bleibt so wahr. Der Preis dafür:
 * Wer die Startseite neu lädt, sieht die Karte wieder. Deshalb ist sie klein,
 * sperrt nichts und nimmt den Fokus nicht an sich.
 */
(function () {
  "use strict";

  var DELAY = 6000;
  var SCROLLED = 300;

  document.addEventListener("DOMContentLoaded", function () {
    var card = document.querySelector("[data-promo]");
    if (!card) return;

    var shown = false;

    function close() {
      shown = true;
      card.hidden = true;
      document.removeEventListener("keydown", onKey);
    }

    function onKey(event) {
      if (event.key === "Escape") close();
    }

    card.querySelector("[data-promo-close]").addEventListener("click", close);

    function show() {
      if (shown) return;
      shown = true;
      window.removeEventListener("scroll", onScroll);
      card.hidden = false;
      document.addEventListener("keydown", onKey);
    }

    function onScroll() {
      if (window.scrollY > SCROLLED) show();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.setTimeout(show, DELAY);
  });
})();
