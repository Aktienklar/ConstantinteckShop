/**
 * KRIMI-DINNER – FILTER, VORSCHAUSEITEN, KUNDENSTIMMEN
 *
 * Karten, Fallseiten, Menüs und Rezept-Boxen stehen fertig im HTML –
 * geschrieben von tools/cases.py aus data/cases.json. Was nur im Browser
 * gehen kann, steht hier:
 *
 *   <div data-krimi-filters hidden></div>
 *       Filter-Chips (Spielerzahl, Stimmung, Anlass) für das Raster
 *       [data-krimi-cases] auf derselben Seite. Jede Karte steckt in
 *       .krimi-cases__item[data-krimi-case="<id>"]. Nur im Browser, ohne Adresse.
 *       data-krimi-empty / data-krimi-reset: Hinweis, wenn nichts passt.
 *
 *   <div data-krimi-previews hidden></div>    <div data-krimi-social hidden></div>
 *       Vorschauseiten und Kundenstimmen. Bleiben unsichtbar, solange die
 *       Listen in data/cases.json leer sind.
 *
 * Saison (Fall nach vorn, Abzeichen) und die Herkunft für utm_content
 * erledigt assets/js/site.js.
 *
 * Hier wird nichts verkauft und nichts in den Warenkorb gelegt.
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

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.KRIMI_CASES) return;

    document.querySelectorAll("[data-krimi-filters]").forEach(renderFilters);
    document.querySelectorAll("[data-krimi-previews]").forEach(renderPreviews);
    document.querySelectorAll("[data-krimi-social]").forEach(renderSocial);

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

  /* --- Filter ------------------------------------------------------------
     Drei Gruppen, je höchstens ein Chip aktiv; ein zweiter Klick auf den
     aktiven Chip hebt ihn wieder auf. Gefiltert wird nur das Raster auf
     dieser Seite – die Adresse bleibt, wie sie ist. */
  function renderFilters(box) {
    var grid = document.querySelector("[data-krimi-cases]");
    if (!grid) return;

    var cases = krimiCases();
    var f = labels().filters;
    var state = { players: null, mood: null, occasion: null };

    function used(field) {
      var keys = [];
      cases.forEach(function (item) {
        (item[field] || []).forEach(function (key) {
          if (keys.indexOf(key) === -1) keys.push(key);
        });
      });
      return keys;
    }

    var groups = [
      {
        name: "players",
        label: f.players,
        options: labels().playerBuckets.map(function (range) {
          return { value: range.join("-"), text: range[0] + "–" + range[1] };
        })
      },
      {
        name: "mood",
        label: f.mood,
        options: Object.keys(labels().moods)
          .filter(function (key) { return used("moods").indexOf(key) !== -1; })
          .map(function (key) { return { value: key, text: labels().moods[key] }; })
      },
      {
        name: "occasion",
        label: f.occasion,
        options: Object.keys(labels().occasions)
          .filter(function (key) { return used("occasions").indexOf(key) !== -1; })
          .map(function (key) { return { value: key, text: labels().occasions[key] }; })
      }
    ];

    box.innerHTML =
      groups
        .map(function (group) {
          var id = "krimi-filter-" + group.name;
          return (
            '<div class="krimi-filters__group" role="group" aria-labelledby="' + id + '">' +
            '<span class="krimi-filters__label" id="' + id + '">' + escapeHtml(group.label) + "</span>" +
            '<div class="krimi-filters__chips">' +
            group.options
              .map(function (option) {
                return (
                  '<button type="button" class="chip" aria-pressed="false" data-group="' + group.name +
                  '" data-value="' + escapeHtml(option.value) + '">' + escapeHtml(option.text) + "</button>"
                );
              })
              .join("") +
            "</div>" +
            "</div>"
          );
        })
        .join("") +
      '<div class="krimi-filters__status">' +
      '<p role="status" data-krimi-count></p>' +
      '<button type="button" class="krimi-filters__reset" data-krimi-reset hidden>' + escapeHtml(f.reset) + "</button>" +
      "</div>";
    box.hidden = false;

    function matches(item) {
      if (state.players) {
        var bucket = state.players.split("-").map(Number);
        var range = krimiPlayerRange(item);
        if (range[1] < bucket[0] || range[0] > bucket[1]) return false;
      }
      if (state.mood && (item.moods || []).indexOf(state.mood) === -1) return false;
      if (state.occasion && (item.occasions || []).indexOf(state.occasion) === -1) return false;
      return true;
    }

    function apply() {
      var shown = 0;
      grid.querySelectorAll("[data-krimi-case]").forEach(function (cell) {
        var item = cases.filter(function (entry) {
          return entry.id === cell.getAttribute("data-krimi-case");
        })[0];
        var visible = Boolean(item) && matches(item);
        cell.hidden = !visible;
        if (visible) shown++;
      });

      box.querySelectorAll("[data-group]").forEach(function (chip) {
        var active = state[chip.getAttribute("data-group")] === chip.getAttribute("data-value");
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });

      var filtered = Boolean(state.players || state.mood || state.occasion);
      box.querySelector("[data-krimi-count]").textContent = f.count(shown, cases.length);
      box.querySelector("[data-krimi-reset]").hidden = !filtered;
      var empty = document.querySelector("[data-krimi-empty]");
      if (empty) empty.hidden = shown > 0;
    }

    box.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-group]");
      if (!chip) return;
      var group = chip.getAttribute("data-group");
      var value = chip.getAttribute("data-value");
      state[group] = state[group] === value ? null : value;
      apply();
    });

    document.querySelectorAll("[data-krimi-reset]").forEach(function (button) {
      button.addEventListener("click", function () {
        state = { players: null, mood: null, occasion: null };
        apply();
      });
    });

    apply();
  }

  /* --- Vorschauseiten (unscharf) ------------------------------------------- */
  function renderPreviews(box) {
    var pages = (window.KRIMI_PREVIEWS || []).filter(function (page) {
      return page && page.image;
    });
    if (!pages.length) return;

    box.innerHTML = pages
      .slice(0, 2)
      .map(function (page) {
        return (
          '<figure class="krimi-preview">' +
          '<img src="' + escapeHtml(root + page.image) + '" alt="' + escapeHtml(page.alt || "") + '" loading="lazy">' +
          (page.caption ? "<figcaption>" + escapeHtml(page.caption) + "</figcaption>" : "") +
          "</figure>"
        );
      })
      .join("");
    box.hidden = false;
  }

  /* --- Kundenstimmen und Fotos --------------------------------------------- */
  function renderSocial(box) {
    var social = window.KRIMI_SOCIAL || {};
    var reviews = (social.reviews || []).filter(function (entry) {
      return entry && entry.quote;
    });
    var photos = (social.photos || []).filter(function (entry) {
      return entry && entry.image;
    });
    if (!reviews.length && !photos.length) return;

    box.innerHTML =
      '<h3 class="krimi-social__title">' + escapeHtml(labels().reviewsHeading) + "</h3>" +
      (reviews.length
        ? '<div class="grid grid--3 mt-6">' +
          reviews
            .map(function (entry) {
              var item = krimiCases().filter(function (c) { return c.id === entry.caseId; })[0];
              return (
                '<figure class="panel krimi-review">' +
                "<blockquote>" + escapeHtml(entry.quote) + "</blockquote>" +
                "<figcaption>" + escapeHtml(entry.by || "") +
                (item ? " · " + escapeHtml(item[KRIMI_SITE.lang].title) : "") +
                "</figcaption>" +
                "</figure>"
              );
            })
            .join("") +
          "</div>"
        : "") +
      (photos.length
        ? '<ul class="customer-photos no-scrollbar mt-6">' +
          photos
            .map(function (photo) {
              return (
                "<li><figure>" +
                '<img src="' + escapeHtml(root + photo.image) + '" alt="' + escapeHtml(photo.alt || "") + '" loading="lazy">' +
                (photo.by ? "<figcaption>" + escapeHtml(photo.by) + "</figcaption>" : "") +
                "</figure></li>"
              );
            })
            .join("") +
          "</ul>"
        : "");
    box.hidden = false;
  }

})();
