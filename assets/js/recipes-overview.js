/**
 * REZEPTÜBERSICHT: NEUESTE VIDEOS UND SHOP-KARTEN
 *
 * Zwei Dinge auf recipes.html, beide aus Daten statt von Hand:
 *
 *   1. "From the latest videos" schreibt seit 29.10.2026 tools/cases.py fest
 *      ins HTML (die drei Rezepte mit dem höchsten "order" aus
 *      assets/js/recipe-data.js) – per Skript eingesetzt, schob die Reihe die
 *      Suche nach unten (Layout-Sprung). Hier wird nur noch der Preis der
 *      Schürzen-Karte daneben eingesetzt.
 *
 *   2. Nach jeder 6. Rezeptkarte eine Shop-Karte (Krimi-Dinner und Schürze
 *      im Wechsel, Krimi zuerst). recipe-filter.js blendet sie aus, sobald gesucht oder
 *      gefiltert wird – dann soll nur stehen, was zur Suche passt.
 *
 * Preise kommen aus shop-data.js bzw. krimi-dinner-data.js. Ohne JavaScript
 * fehlt beides, und die Rezeptliste steht vollständig da.
 *
 * Voraussetzung: shop-data.js und krimi-dinner-data.js sind
 * vorher geladen; recipe-filter.js kommt NACH dieser Datei.
 */
(function () {
  "use strict";

  /** Nach so vielen Rezeptkarten kommt eine Shop-Karte. */
  var SHOP_CARD_EVERY = 6;

  var ICON_CASE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.6" cy="10.6" r="6.4"/><path d="m15.4 15.4 5.2 5.2"/><path d="M8.2 10.6a2.4 2.4 0 0 1 2.4-2.4"/></svg>';

  /* Die Shop-Karten in der Reihenfolge, in der sie im Raster auftauchen. Nach
     der letzten geht es wieder von vorn los. */
  var SHOP_CARDS = [
    {
      id: "krimi-dinner",
      href: "krimi-dinner.html",
      via: "recipes-grid",
      covers: 3,
      title: "Turn dinner into a mystery",
      text: "Murder mystery dinners as a PDF – each with a menu from these recipes."
    },
    {
      id: "linen-apron",
      href: "shop/linen-apron.html",
      title: "The apron from the videos",
      text: "Waffle piqué, big front pocket – designed by my mom, sewn by hand in Germany."
    }
  ];
  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.querySelector("[data-results]");
    if (!grid) return;

    fillPrices();
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

  /* Die Krimi-Karte zeigt drei Cover im Hochformat nebeneinander statt
     eines beschnittenen Fotos – Fälle mit Saison zuerst. */
  function miniCovers(count) {
    if (!window.KRIMI_CASES) return "";
    var items = krimiCasesBySeason()
      .filter(function (item) { return item.image; })
      .slice(0, count);
    if (!items.length) return "";
    // Die Mitte ist die größte: der erste Fall dorthin.
    if (items.length === 3) items = [items[1], items[0], items[2]];
    return (
      '<div class="shop-card__covers">' +
      items
        .map(function (item) {
          var base = item.image.replace(/\.jpg$/, "");
          return (
            '<img src="' + base + '-240.webp" srcset="' + base + "-240.webp 240w, " + base + '-400.webp 400w"' +
            ' sizes="(min-width: 1024px) 110px, (min-width: 640px) 15vw, 34vw" width="240" height="320" alt="" loading="lazy" decoding="async">'
          );
        })
        .join("") +
      "</div>"
    );
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
    if (entry.via) link.setAttribute("data-via", entry.via);
    var media =
      (entry.covers && miniCovers(entry.covers)) ||
      (product || entry.image
        ? '<img src="' + (product ? product.image : entry.image) + '" alt="" loading="lazy">'
        : '<div class="krimi-placeholder" aria-hidden="true">' + ICON_CASE + "</div>");

    link.innerHTML =
      '<div class="recipe-card__media">' +
      media +
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
