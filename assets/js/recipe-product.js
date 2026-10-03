/**
 * PRODUKTKARTE AUF DER REZEPTSEITE
 *
 * Zeigt zwischen Zutaten und Zubereitung das Produkt, das zum Rezept passt –
 * statt überall dieselbe Schürze. Im HTML steht als Rückfall (ohne JavaScript)
 * die Erwachsenenschürze; dieses Skript ersetzt sie.
 *
 * WELCHES PRODUKT?
 *   1. Steht in assets/js/recipe-data.js beim Rezept ein featuredProduct,
 *      gilt das:   featuredProduct: "kids-apron"
 *      Erlaubt: "linen-apron" (Erwachsene), "kids-apron", "apron-set".
 *   2. Sonst entscheidet die Kategorie:
 *        süß und höchstens 15 Minuten  -> apron-set   (mit Kindern kochen)
 *        alles andere                  -> linen-apron (die aus den Videos)
 *
 * WELCHER SATZ?
 *   productNote beim Rezept überschreibt den Standardsatz:
 *      productNote: "My little cousin made this one all by herself."
 *
 * Preis, Titel und Bild kommen aus shop-data.js – hier steht keine Zahl.
 *
 * Voraussetzung: shop-data.js und recipe-data.js sind vorher geladen.
 */
(function () {
  "use strict";

  /** Bis zu dieser Zubereitungszeit gilt ein süßes Rezept als "mit Kindern". */
  var KIDS_MAX_MINUTES = 15;

  var HEADINGS = {
    "linen-apron": "What I use for this",
    "kids-apron": "Make it together",
    "apron-set": "Make it together"
  };

  var BLURBS = {
    "linen-apron": "The apron from the videos. Waffle piqué, big front pocket.",
    "kids-apron": "The same apron, cut small – three sizes from 4 years.",
    "apron-set": "One apron for you, one for your little helper."
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.SHOP_PRODUCTS) return;
    document.querySelectorAll("[data-recipe-product]").forEach(render);
  });

  function render(box) {
    var slug = box.getAttribute("data-slug");
    var category = box.getAttribute("data-category");
    var minutes = Number(box.getAttribute("data-minutes"));
    var recipe = (window.RECIPES || {})[slug] || {};

    var withKids = category === "backen" && minutes <= KIDS_MAX_MINUTES;
    var productSlug = recipe.featuredProduct || (withKids ? "apron-set" : "linen-apron");
    var product = SHOP_PRODUCTS[productSlug];

    // Tippfehler im Feld featuredProduct: lieber der Rückfall aus dem HTML.
    if (!product) return;

    var forKids = productSlug !== "linen-apron";
    var href = "../shop/" + productSlug + ".html";
    var note = recipe.productNote || defaultNote(forKids, category, minutes);

    var price = formatPrice(product.price);
    if (product.compareAtPrice) {
      price += ' <s class="price-was">' + formatPrice(product.compareAtPrice) + "</s>";
    }

    box.innerHTML =
      '<section class="panel panel--outline used-products" aria-label="' + esc(HEADINGS[productSlug]) + '">' +
      '<div class="section-head">' +
      '<h2 style="font-size:1.25rem">' + esc(HEADINGS[productSlug]) + "</h2>" +
      '<a class="link-brand" style="font-size:.875rem" href="../shop.html">All in the shop</a>' +
      "</div>" +
      '<p class="used-products__note">' + esc(note) + "</p>" +
      "<ul>" +
      '<li class="lift">' +
      '<a href="' + href + '" tabindex="-1" aria-hidden="true" data-track="product-click/recipe/' + productSlug + '">' +
      '<img src="../' + esc(product.image) + '" alt="" loading="lazy">' +
      "</a>" +
      '<div class="used-products__text">' +
      '<a class="used-products__title" href="' + href + '" data-track="product-click/recipe/' + productSlug + '">' + esc(product.title) + "</a>" +
      '<p class="product-card__text">' + esc(BLURBS[productSlug]) + "</p>" +
      '<div class="used-products__price"><span>' + price + "</span></div>" +
      '<div class="mt-3">' +
      '<a class="btn btn--secondary btn--block" href="' + href + '" data-track="product-click/recipe/' + productSlug + '">' +
      (product.options.length > 1 ? "Choose colour & size" : "Choose a colour") +
      "</a>" +
      "</div>" +
      "</div>" +
      "</li>" +
      "</ul>" +
      '<p class="trust-line">Designed by my mom · Sewn by hand in Germany · 14-day returns</p>' +
      '<p class="used-products__story"><a class="link-brand" href="../about.html#aprons-story">Why my mom designed these →</a></p>' +
      "</section>";
  }

  function defaultNote(forKids, category, minutes) {
    if (forKids) {
      var count = document.querySelectorAll(".ingredients li").length;
      return (
        "Perfect first recipe to make with your kids – " +
        minutes + " minutes" +
        (count ? ", " + count + " ingredients." : ".")
      );
    }
    if (category === "herzhaft") {
      return "This one splatters – that's why I always wear the apron.";
    }
    return "This one gets messy – that's why I always wear the apron.";
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
