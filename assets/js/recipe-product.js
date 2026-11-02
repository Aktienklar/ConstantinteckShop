/**
 * PRODUKTKARTE AUF DER REZEPTSEITE
 *
 * Kompakte Karte direkt nach den Zutaten (unter der Krimi-Box): eine Zeile
 * "Cook this in the ‘Dough Love’ apron", Preis, Knopf zur Produktseite.
 * Bis 2.11.2026 stand eine große Karte unter der Zubereitung – dort hat sie
 * kaum jemand gesehen. Im HTML steht als Rückfall (ohne JavaScript) die
 * Erwachsenenschürze ohne Preis (tools/cases.py); dieses Skript ersetzt sie.
 *
 * WELCHES PRODUKT?
 *   1. Steht in assets/js/recipe-data.js beim Rezept ein featuredProduct,
 *      gilt das:   featuredProduct: "kids-apron"
 *      Erlaubt: "linen-apron" (Erwachsene), "kids-apron", "apron-set".
 *   2. Sonst entscheidet die Kategorie:
 *        süß und höchstens 15 Minuten  -> kids-apron  (mit Kindern kochen;
 *                                        das Set steht seit 29.10.2026 nur im Shop)
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

  /* Die eine Zeile der Karte, je Produkt. */
  var TITLES = {
    "linen-apron": "Cook this in the ‘Dough Love’ apron",
    "kids-apron": "Make it with your kids – in the ‘Little Dough Love’ apron",
    "apron-set": "Cook it together – the ‘Dough Love’ apron set"
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
    var productSlug = recipe.featuredProduct || (withKids ? "kids-apron" : "linen-apron");
    var product = SHOP_PRODUCTS[productSlug];

    // Tippfehler im Feld featuredProduct: lieber der Rückfall aus dem HTML.
    if (!product) return;

    var href = "../shop/" + productSlug + ".html";
    var track = ' data-track="product-click/recipe/' + productSlug + '"';
    var meta = recipe.productNote || "Designed by my mom · sewn by hand in Germany";

    var price = formatPrice(product.price);
    if (product.compareAtPrice) {
      price += ' <s class="price-was">' + formatPrice(product.compareAtPrice) + "</s>";
    }

    // Kleines Vorschaubild: die 480er AVIF neben dem JPEG (tools/images.py).
    var image = "../" + product.image;
    var avif = image.replace(/\.jpg$/, "-480.avif");
    // Alt-Text aus Produktname und Farbe; die Vorschaubilder der Produkte
    // sind alle in Grey (shop-data.js, image).
    var alt = product.title + " in Grey";

    box.innerHTML =
      '<section class="panel panel--outline apron-card" aria-label="' + esc(product.title) + '">' +
      '<a class="apron-card__img" href="' + href + '" tabindex="-1" aria-hidden="true"' + track + ">" +
      '<picture><source type="image/avif" srcset="' + esc(avif) + '">' +
      '<img src="' + esc(image) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"></picture></a>' +
      '<div class="apron-card__text">' +
      '<p class="apron-card__title"><a href="' + href + '"' + track + ">" + esc(TITLES[productSlug] || product.title) + "</a></p>" +
      '<p class="apron-card__meta">' + esc(meta) + "</p>" +
      '<div class="apron-card__foot">' +
      '<span class="apron-card__price">' + price + "</span>" +
      '<a class="btn btn--secondary btn--sm" href="' + href + '"' + track + ">See the apron</a>" +
      "</div>" +
      "</div>" +
      "</section>";
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
