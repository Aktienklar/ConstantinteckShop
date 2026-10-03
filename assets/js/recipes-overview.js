/**
 * REZEPTÜBERSICHT: NEUESTE VIDEOS UND SHOP-KARTEN
 *
 * Zwei Dinge auf recipes.html, beide aus Daten statt von Hand:
 *
 *   1. "From the latest videos" – die drei Rezepte mit dem höchsten "order"
 *      aus assets/js/recipe-data.js, daneben die Schürze. Die Karten werden
 *      aus dem Raster darunter kopiert; Titel und Bild stehen also weiter nur
 *      an einer Stelle.
 *
 *   2. Nach jeder 6. Rezeptkarte eine Shop-Karte (Set, Schürze, Krimi-Dinner
 *      im Wechsel). recipe-filter.js blendet sie aus, sobald gesucht oder
 *      gefiltert wird – dann soll nur stehen, was zur Suche passt.
 *
 * Preise kommen aus shop-data.js bzw. krimi-dinner-data.js. Ohne JavaScript
 * fehlt beides, und die Rezeptliste steht vollständig da.
 *
 * Voraussetzung: shop-data.js, krimi-dinner-data.js und recipe-data.js sind
 * vorher geladen; recipe-filter.js kommt NACH dieser Datei.
 */
(function () {
  "use strict";

  /** So viele Rezepte stehen oben. */
  var LATEST_COUNT = 3;
  /** Nach so vielen Rezeptkarten kommt eine Shop-Karte. */
  var SHOP_CARD_EVERY = 6;

  var ICON_CASE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.6" cy="10.6" r="6.4"/><path d="m15.4 15.4 5.2 5.2"/><path d="M8.2 10.6a2.4 2.4 0 0 1 2.4-2.4"/></svg>';

  /* Die Shop-Karten in der Reihenfolge, in der sie im Raster auftauchen. Nach
     der letzten geht es wieder von vorn los. */
  var SHOP_CARDS = [
    {
      id: "apron-set",
      href: "shop/apron-set.html",
      title: "One apron for you, one for your little helper",
      text: "Both aprons in one parcel – designed by my mom, sewn by hand in Germany."
    },
    {
      id: "linen-apron",
      href: "shop/linen-apron.html",
      title: "The apron from the videos",
      text: "Waffle piqué, big front pocket – designed by my mom, sewn by hand in Germany."
    },
    {
      id: "krimi-dinner",
      href: "krimi-dinner.html",
      title: "Dinner's sorted. Now: who did it?",
      text: "Murder mystery games as a PDF to print at home – for an evening of cooking together."
    }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.querySelector("[data-results]");
    if (!grid) return;

    fillPrices();
    renderLatest(grid);
    insertShopCards(grid);
  });

  /** <span data-price-for="linen-apron"></span> -> "€49.90" */
  function fillPrices() {
    document.querySelectorAll("[data-price-for]").forEach(function (el) {
      el.innerHTML = priceHtml(el.getAttribute("data-price-for"));
    });
  }

  function priceHtml(id) {
    if (id === "krimi-dinner") {
      if (!window.KRIMI_CASES) return "";
      var prices = krimiCases().map(function (item) {
        return item.price;
      });
      return prices.length ? "from " + krimiPrice(Math.min.apply(null, prices)) : "";
    }

    var product = (window.SHOP_PRODUCTS || {})[id];
    if (!product) return "";
    return (
      formatPrice(product.price) +
      (product.compareAtPrice
        ? ' <s class="price-was">' + formatPrice(product.compareAtPrice) + "</s>"
        : "")
    );
  }

  function slugOf(card) {
    return (card.getAttribute("href") || "").replace(/^.*\//, "").replace(/\.html$/, "");
  }

  function renderLatest(grid) {
    var section = document.querySelector("[data-latest]");
    var row = document.querySelector("[data-latest-row]");
    var recipes = window.RECIPES;
    if (!section || !row || !recipes) return;

    var cards = [].slice
      .call(grid.querySelectorAll("[data-recipe-card]"))
      .filter(function (card) {
        return recipes[slugOf(card)] && recipes[slugOf(card)].order;
      })
      .sort(function (a, b) {
        return recipes[slugOf(b)].order - recipes[slugOf(a)].order;
      })
      .slice(0, LATEST_COUNT);

    if (!cards.length) return;

    var first = row.firstChild;
    cards.forEach(function (card) {
      var copy = card.cloneNode(true);
      /* Die Kopie ist keine Karte der Suche: ohne diese Attribute zählt und
         filtert recipe-filter.js sie nicht mit. */
      ["data-recipe-card", "data-category", "data-minutes", "data-difficulty", "data-search"].forEach(
        function (name) {
          copy.removeAttribute(name);
        }
      );
      var image = copy.querySelector("img");
      if (image) image.removeAttribute("loading");
      row.insertBefore(copy, first);
    });

    section.hidden = false;
  }

  function insertShopCards(grid) {
    var cards = [].slice.call(grid.querySelectorAll("[data-recipe-card]"));
    var used = 0;

    for (var i = SHOP_CARD_EVERY - 1; i < cards.length - 1; i += SHOP_CARD_EVERY) {
      var card = shopCard(SHOP_CARDS[used % SHOP_CARDS.length]);
      if (!card) continue;
      cards[i].insertAdjacentElement("afterend", card);
      used++;
    }
  }

  function shopCard(entry) {
    var price = priceHtml(entry.id);
    var product = (window.SHOP_PRODUCTS || {})[entry.id];
    // Krimi-Daten nicht geladen oder Produkt entfernt: dann lieber keine Karte.
    if (!price) return null;

    var link = document.createElement("a");
    link.className = "card recipe-card shop-card lift-3d";
    link.href = entry.href;
    link.setAttribute("data-shop-card", "");
    link.setAttribute("data-track", "product-click/overview-grid/" + entry.id);
    link.innerHTML =
      '<div class="recipe-card__media">' +
      (product
        ? '<img src="' + product.image + '" alt="" loading="lazy">'
        : '<div class="krimi-placeholder" aria-hidden="true">' + ICON_CASE + "</div>") +
      '<span class="shop-card__badge">From the shop</span>' +
      "</div>" +
      '<div class="recipe-card__stripe shop-card__stripe" aria-hidden="true"></div>' +
      '<div class="recipe-card__body">' +
      "<h3>" + entry.title + "</h3>" +
      '<p class="product-card__text">' + entry.text + "</p>" +
      '<div class="product-card__foot">' +
      '<span class="product-card__price">' + price + "</span>" +
      '<span class="shop-card__more">Have a look →</span>' +
      "</div>" +
      "</div>";
    return link;
  }
})();
