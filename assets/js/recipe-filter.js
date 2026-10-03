/**
 * SUCHE & FILTER AUF DER REZEPTÜBERSICHT
 *
 * Alle Rezeptkarten stehen fertig in recipes.html. Dieses Skript blendet
 * nur aus, was nicht passt – deshalb ist die Liste auch ohne JavaScript
 * vollständig lesbar, und die Suchmaschine sieht jedes Rezept.
 *
 * Gefiltert wird über data-Attribute an den Karten:
 *   data-category    backen | herzhaft
 *   data-minutes     Zubereitungszeit in Minuten
 *   data-difficulty  einfach | mittel | anspruchsvoll
 *   data-search      Titel, Teaser, Tags und Zutaten in Kleinschreibung
 *
 * "Cook with kids" ist kein eigenes Attribut, sondern eine Regel: einfach und
 * höchstens KIDS_MAX_MINUTES Minuten.
 *
 * Die Shop-Karten im Raster ([data-shop-card], eingesetzt von
 * recipes-overview.js) verschwinden, sobald gesucht oder gefiltert wird.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var explorer = document.querySelector("[data-explorer]");
    if (!explorer) return;

    var input = explorer.querySelector("[data-search-input]");
    var categoryButtons = explorer.querySelectorAll("[data-category-filter]");
    var timeSelect = explorer.querySelector("[data-time-filter]");
    var difficultySelect = explorer.querySelector("[data-difficulty-filter]");
    var kidsButton = explorer.querySelector("[data-kids-filter]");
    var kidsHint = explorer.querySelector("[data-kids-hint]");
    var resetButton = explorer.querySelector("[data-reset]");
    var counter = explorer.querySelector("[data-count]");
    var empty = explorer.querySelector("[data-empty]");
    var results = explorer.querySelector("[data-results]");
    var cards = Array.prototype.slice.call(
      explorer.querySelectorAll("[data-recipe-card]")
    );

    var KIDS_MAX_MINUTES = 15;

    var category = "all";
    var kids = false;

    // Die Startseite verlinkt mit ?category=backen bzw. ?category=herzhaft
    // direkt in eine der beiden Welten.
    var requested = new URLSearchParams(window.location.search).get("category");
    if (requested === "backen" || requested === "herzhaft") category = requested;

    function matchesTime(minutes, filter) {
      if (filter === "30") return minutes <= 30;
      if (filter === "60") return minutes <= 60;
      if (filter === "60plus") return minutes > 60;
      return true;
    }

    function apply() {
      var query = (input ? input.value : "").trim().toLowerCase();
      var time = timeSelect ? timeSelect.value : "all";
      var difficulty = difficultySelect ? difficultySelect.value : "all";
      var visible = 0;

      cards.forEach(function (card) {
        var ok = true;

        if (category !== "all" && card.getAttribute("data-category") !== category) {
          ok = false;
        }
        if (ok && !matchesTime(Number(card.getAttribute("data-minutes")), time)) {
          ok = false;
        }
        if (
          ok &&
          kids &&
          (card.getAttribute("data-difficulty") !== "einfach" ||
            Number(card.getAttribute("data-minutes")) > KIDS_MAX_MINUTES)
        ) {
          ok = false;
        }
        if (
          ok &&
          difficulty !== "all" &&
          card.getAttribute("data-difficulty") !== difficulty
        ) {
          ok = false;
        }
        if (ok && query && card.getAttribute("data-search").indexOf(query) === -1) {
          ok = false;
        }

        card.classList.toggle("is-filtered-out", !ok);
        if (ok) visible++;
      });

      categoryButtons.forEach(function (button) {
        var active = button.getAttribute("data-category-filter") === category;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });

      var filtering =
        query !== "" ||
        category !== "all" ||
        kids ||
        time !== "all" ||
        difficulty !== "all";

      if (kidsButton) {
        kidsButton.classList.toggle("is-active", kids);
        kidsButton.setAttribute("aria-pressed", kids ? "true" : "false");
      }
      if (kidsHint) kidsHint.hidden = !kids || visible === 0;

      explorer.querySelectorAll("[data-shop-card]").forEach(function (card) {
        card.classList.toggle("is-filtered-out", filtering);
      });

      if (counter) {
        counter.textContent =
          visible === 1 ? "1 recipe found" : visible + " recipes found";
      }

      if (empty) empty.hidden = visible !== 0;
      if (results) results.hidden = visible === 0;

      if (resetButton) {
        resetButton.hidden = !filtering;
      }
    }

    function reset() {
      if (input) input.value = "";
      category = "all";
      kids = false;
      if (timeSelect) timeSelect.value = "all";
      if (difficultySelect) difficultySelect.value = "all";
      apply();
    }

    if (input) input.addEventListener("input", apply);
    if (timeSelect) timeSelect.addEventListener("change", apply);
    if (difficultySelect) difficultySelect.addEventListener("change", apply);
    if (resetButton) resetButton.addEventListener("click", reset);

    explorer.querySelectorAll("[data-reset-inline]").forEach(function (button) {
      button.addEventListener("click", reset);
    });

    categoryButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        category = button.getAttribute("data-category-filter");
        apply();
      });
    });

    if (kidsButton) {
      kidsButton.addEventListener("click", function () {
        kids = !kids;
        apply();
      });
    }

    apply();
  });
})();
