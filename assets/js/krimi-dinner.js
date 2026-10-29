/**
 * KRIMI-DINNER – ANZEIGE
 *
 * Baut aus assets/js/krimi-dinner-data.js alles, was auf dieser Website zu den
 * Krimi-Dinnern zu sehen ist. Im HTML stehen dafür nur Markierungen:
 *
 *   <div data-krimi-cases></div>
 *       Die Karten aller Fälle (krimi-dinner.html), Fälle mit Saison vorn.
 *       Mit data-krimi-limit="3" nur die ersten drei. data-krimi-context
 *       ("cases" ohne Angabe) steht im Klick-Event: krimi-click/<context>/<id>.
 *
 *   <a data-krimi-link="shop">…</a>      oder  data-krimi-link="home"
 *       Bekommt die Adresse bei Murdernight samt UTM-Parametern.
 *       data-krimi-content="closing-cta" setzt utm_content (welcher Knopf).
 *
 *   <span data-krimi-from-price></span>   <span data-krimi-count></span>
 *       Niedrigster Preis bzw. Anzahl der Fälle – für Teaser-Texte.
 *
 *   <div data-krimi-filters hidden></div>
 *       Filter-Chips (Spielerzahl, Stimmung, Anlass) für das Raster
 *       data-krimi-cases auf derselben Seite. Nur im Browser, ohne Adresse.
 *       data-krimi-empty / data-krimi-reset: Hinweis, wenn nichts passt.
 *
 *   <a data-krimi-banner>…</a>
 *       Ankündigungsleiste: Hat ein Fall Saison, wirbt sie für ihn.
 *
 *   <div data-krimi-menus hidden></div>    <div data-krimi-previews hidden></div>
 *   <div data-krimi-social hidden></div>
 *       Rezepte je Fall, Vorschauseiten und Kundenstimmen. Bleiben
 *       unsichtbar, solange die Daten dazu leer sind.
 *
 *   <div data-krimi-teaser></div>
 *       Teaser für die Startseite: ein Fall (der mit Saison, sonst
 *       KRIMI_SITE.featured) mit Cover, dazu Mini-Cover der übrigen.
 *
 *   <div data-krimi-hint="the-teatime-caper"></div>
 *       Der Hinweis-Block für eine Rezeptseite. Der Wert ist die id des Falls
 *       aus KRIMI_CASES; ohne Wert wirbt der Block allgemein und führt zur
 *       Shop-Übersicht.
 *
 * Hier wird nichts verkauft und nichts in den Warenkorb gelegt – jeder Knopf
 * ist ein Link nach Murdernight. Die Datei kennt cart.js nicht, und das
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
  var ICON_LENS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>';
  var DIFFICULTY_STEPS = { easy: 1, medium: 2, tricky: 3 };
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
    document.querySelectorAll("[data-krimi-filters]").forEach(renderFilters);
    document.querySelectorAll("[data-krimi-banner]").forEach(seasonalBanner);
    document.querySelectorAll("[data-krimi-menus]").forEach(renderMenus);
    document.querySelectorAll("[data-krimi-previews]").forEach(renderPreviews);
    document.querySelectorAll("[data-krimi-social]").forEach(renderSocial);
    document.querySelectorAll("[data-krimi-teaser]").forEach(renderTeaser);

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
     "noopener" ohne "noreferrer": Murdernight darf sehen, woher der
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

  /* Schwierigkeit als Skala: ein bis drei Lupen, dazu das Wort. Die
     Erklärung steht in einem Tooltip, der bei Hover und Fokus erscheint –
     auf dem Handy also beim Antippen. aria-describedby liest sie auch
     Screenreadern vor. */
  function difficultyScale(item) {
    var level = DIFFICULTY_STEPS[item.difficulty];
    var name = labels().difficulty[item.difficulty];
    if (!level || !name) return "";

    var id = "krimi-diff-" + item.id;
    var icons = "";
    for (var i = 1; i <= 3; i++) {
      icons += '<span class="krimi-diff__step' + (i <= level ? " is-on" : "") + '">' + ICON_LENS + "</span>";
    }
    return (
      '<button type="button" class="krimi-diff" aria-describedby="' + id + '">' +
      '<span class="krimi-diff__icons" aria-hidden="true">' + icons + "</span>" +
      '<span class="sr-only">' + escapeHtml(labels().difficultyLevel) + ": </span>" +
      escapeHtml(name) +
      "</button>" +
      '<span class="krimi-diff__tip" role="tooltip" id="' + id + '">' +
      escapeHtml(labels().difficultyHelp[item.difficulty] || "") +
      "</span>"
    );
  }

  function perfectFor(item) {
    var names = (item.occasions || [])
      .map(function (key) { return labels().occasions[key]; })
      .filter(Boolean);
    if (!names.length) return "";
    return (
      '<p class="krimi-card__for"><b>' + escapeHtml(labels().perfectFor) + "</b> " +
      names.map(function (name) {
        return '<span class="tag">' + escapeHtml(name) + "</span>";
      }).join(" ") +
      "</p>"
    );
  }

  /* Wie breit ein Cover ungefähr angezeigt wird – der Browser wählt damit
     zwischen der 240er, 400er und 675er WebP-Fassung. Muss zu .grid--cases und
     .krimi-card in styles.css passen: mobil steht das Cover links neben dem
     Text (rund 40 % der Breite), ab 640 px zwei, ab 1024 px drei Spalten. */
  var SIZES_CARD = "(min-width: 1024px) 330px, (min-width: 640px) 45vw, 40vw";

  /* Das Cover als <picture>: WebP in drei Breiten (erzeugt von
     tools/krimi-images.py), das JPEG als Rückfall. width/height halten den
     Platz frei, bevor das Bild geladen ist. Die ersten Karten laden sofort
     (eager), alle weiteren erst, wenn sie in die Nähe kommen. */
  function cover(item, options) {
    var text = item[KRIMI_SITE.lang];
    var src = root + item.image;
    var base = src.replace(/\.jpg$/, "");
    var alt = labels().coverAlt(text.title, text.setting);

    return (
      "<picture>" +
      (base !== src
        ? '<source type="image/webp" srcset="' +
          escapeHtml(base + "-240.webp") + " 240w, " +
          escapeHtml(base + "-400.webp") + " 400w, " +
          escapeHtml(base + "-675.webp") + ' 675w" sizes="' + escapeHtml(options.sizes) + '">'
        : "") +
      '<img src="' + escapeHtml(src) + '" width="675" height="900" alt="' + escapeHtml(alt) + '"' +
      (options.eager ? ' loading="eager"' : ' loading="lazy"') +
      ' decoding="async">' +
      "</picture>"
    );
  }

  /* Ohne eingetragenes Cover steht eine neutrale Fläche in den Farben der
     Seite – nie ein Bild direkt von Murdernight. */
  function media(item, index) {
    if (item.image) {
      return cover(item, { sizes: SIZES_CARD, eager: index < 2 });
    }
    return '<div class="krimi-placeholder" aria-hidden="true">' + ICON_CASE + "</div>";
  }

  /* Eine Fallkarte. context landet in data-track ("krimi-click/<context>/<id>"),
     damit GoatCounter zeigt, wo geklickt wurde; utm_content=<id> sagt es
     Murdernight. */
  function caseCard(item, index, context) {
    var text = item[KRIMI_SITE.lang];
    var href = krimiUrl(text.path, null, item.id);
    var track = ' data-track="krimi-click/' + context + "/" + escapeHtml(item.id) + '"';
    var seasonal = krimiInSeason(item);

    return (
      '<article class="card krimi-card' + (seasonal ? " is-seasonal" : "") + '">' +
      '<a class="krimi-card__media" tabindex="-1"' + externalAttrs(href) + track + ">" +
      media(item, index) +
      (seasonal ? '<span class="krimi-card__badge">' + escapeHtml(labels().seasonal) + "</span>" : "") +
      "</a>" +
      '<div class="krimi-card__head">' +
      '<span class="tag krimi-card__genre">' + escapeHtml(text.genre) + "</span>" +
      "<h3><a" + externalAttrs(href) + track + ">" + escapeHtml(text.title) + "</a></h3>" +
      (text.setting ? '<p class="krimi-card__setting">' + escapeHtml(text.setting) + "</p>" : "") +
      '<div class="recipe-card__meta">' + metaLine(item) + "</div>" +
      '<div class="krimi-card__diff">' + difficultyScale(item) + "</div>" +
      "</div>" +
      '<div class="krimi-card__body">' +
      (text.teaser ? '<p class="krimi-card__teaser">' + escapeHtml(text.teaser) + "</p>" : "") +
      perfectFor(item) +
      '<div class="krimi-card__foot">' +
      '<a class="btn btn--primary"' + externalAttrs(href) + track + ">" +
      escapeHtml(labels().getCase(krimiPrice(item.price))) + newTabHint() +
      "</a>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderCases(box) {
    var limit = Number(box.getAttribute("data-krimi-limit")) || undefined;
    var context = box.getAttribute("data-krimi-context") || "cases";
    var html = krimiCasesBySeason()
      .slice(0, limit)
      .map(function (item, index) {
        return (
          '<div class="krimi-cases__item rise" data-krimi-case="' + escapeHtml(item.id) + '"' +
          ' style="animation-delay:' + Math.min(index, 5) * 70 + 'ms">' +
          caseCard(item, index, context) +
          "</div>"
        );
      })
      .join("");

    box.innerHTML = html;
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

  /* --- Ankündigungsleiste ---------------------------------------------------
     Ohne Fall mit Saison bleibt der Text aus dem HTML stehen. */
  function seasonalBanner(link) {
    var item = krimiCases().filter(function (entry) {
      return krimiInSeason(entry);
    })[0];
    if (!item) return;

    var text = item[KRIMI_SITE.lang];
    var occasion = labels().occasions[(item.occasions || [])[0]] || "";
    var copy = labels().seasonalBanner(text.title, occasion || labels().seasonal);
    var narrow = link.querySelector(".only-narrow");
    var wide = link.querySelector(".only-wide");
    if (narrow) narrow.textContent = copy.short;
    if (wide) wide.textContent = copy.long;
    link.href = krimiUrl(text.path, null, "banner-" + item.id);
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("data-track", "krimi-click/banner/" + item.id);
  }

  /* --- Rezepte je Fall ------------------------------------------------------ */
  function renderMenus(box) {
    var withRecipes = krimiCases().filter(function (item) {
      return item.recipes && item.recipes.length;
    });
    if (!withRecipes.length) return;

    box.innerHTML = withRecipes
      .map(function (item) {
        var text = item[KRIMI_SITE.lang];
        return (
          '<div class="krimi-menu">' +
          (item.image
            ? '<div class="krimi-menu__cover">' + cover(item, { sizes: "96px", eager: false }) + "</div>"
            : "") +
          "<div>" +
          '<p class="krimi-menu__for">' + escapeHtml(labels().menuFor) + "</p>" +
          "<h3>" + escapeHtml(text.title) + "</h3>" +
          "<ul>" +
          item.recipes
            .map(function (recipe) {
              return (
                '<li><a class="link-brand" href="' + escapeHtml(root + "recipes/" + recipe.slug + ".html") + '">' +
                escapeHtml(recipe.title) + "</a></li>"
              );
            })
            .join("") +
          "</ul>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
    box.hidden = false;
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

  /* --- Teaser auf der Startseite --------------------------------------------
     Ein Fall groß (der mit Saison, sonst KRIMI_SITE.featured, sonst der
     erste), daneben drei weitere als Mini-Cover. Die Seite selbst nennt den
     Weg zu allen Fällen (krimi-dinner.html). */
  function renderTeaser(box) {
    var cases = krimiCasesBySeason();
    if (!cases.length) return;

    var main =
      cases.filter(function (item) { return krimiInSeason(item); })[0] ||
      cases.filter(function (item) { return item.id === KRIMI_SITE.featured; })[0] ||
      cases[0];
    var others = cases.filter(function (item) { return item !== main && item.image; }).slice(0, 3);
    var text = main[KRIMI_SITE.lang];
    var href = krimiUrl(text.path, null, "home-" + main.id);
    var track = ' data-track="krimi-click/home-teaser/' + escapeHtml(main.id) + '"';
    var seasonal = krimiInSeason(main);

    box.innerHTML =
      '<article class="krimi-feature">' +
      '<a class="krimi-feature__cover" tabindex="-1"' + externalAttrs(href) + track + ">" +
      cover(main, { sizes: "(min-width: 640px) 224px, 40vw", eager: false }) +
      (seasonal ? '<span class="krimi-card__badge">' + escapeHtml(labels().seasonal) + "</span>" : "") +
      "</a>" +
      '<div class="krimi-feature__head">' +
      '<span class="tag krimi-card__genre">' + escapeHtml(text.genre) + "</span>" +
      '<h3 class="krimi-feature__title"><a' + externalAttrs(href) + track + ">" + escapeHtml(text.title) + "</a></h3>" +
      (text.setting ? '<p class="krimi-card__setting">' + escapeHtml(text.setting) + "</p>" : "") +
      '<div class="recipe-card__meta">' + metaLine(main) + "</div>" +
      "</div>" +
      '<div class="krimi-feature__foot">' +
      (text.teaser ? '<p class="krimi-card__teaser">' + escapeHtml(text.teaser) + "</p>" : "") +
      perfectFor(main) +
      '<a class="btn btn--primary krimi-feature__btn"' + externalAttrs(href) + track + ">" +
      escapeHtml(labels().getCase(krimiPrice(main.price))) + newTabHint() +
      "</a>" +
      "</div>" +
      "</article>" +
      (others.length
        ? '<a class="krimi-minis" href="' + escapeHtml(root + "krimi-dinner.html") + '" data-track="krimi-click/home-teaser/all-cases">' +
          '<span class="krimi-minis__covers" aria-hidden="true">' +
          others
            .map(function (item) {
              return '<span class="krimi-mini">' + cover(item, { sizes: "120px", eager: false }).replace(/alt="[^"]*"/, 'alt=""') + "</span>";
            })
            .join("") +
          "</span>" +
          '<span class="krimi-minis__text">' + escapeHtml(labels().allCases(cases.length)) + " →</span>" +
          "</a>"
        : "");
  }

  function setLink(link) {
    var target = link.getAttribute("data-krimi-link") || "shop";
    var paths = KRIMI_SITE.paths[KRIMI_SITE.lang];

    link.href = krimiUrl(
      paths[target] || paths.shop,
      link.getAttribute("data-krimi-campaign") || undefined,
      link.getAttribute("data-krimi-content") || undefined
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
    var lead = labels().hintTextGeneric;
    var prices = krimiCases().map(function (entry) {
      return entry.price;
    });
    var detail = prices.length
      ? '<p class="krimi-hint__case">' +
        escapeHtml(labels().hintDetailGeneric(prices.length, krimiPrice(Math.min.apply(null, prices)))) +
        "</p>"
      : "";
    var button = labels().toCases;

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
      lead = labels().hintText;
      button = labels().toGame;
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
      '<p class="krimi-hint__lead">' + escapeHtml(lead) + "</p>" +
      detail +
      "</div>" +
      '<a class="btn btn--secondary"' +
      externalAttrs(krimiUrl(path, KRIMI_SITE.recipeCampaign, id || "all-cases")) + ">" +
      escapeHtml(button) + newTabHint() +
      "</a>" +
      "</aside>";
  }
})();
