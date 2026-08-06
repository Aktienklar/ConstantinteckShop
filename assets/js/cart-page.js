/**
 * WARENKORB-SEITE
 *
 * Baut die Zeilen und die Summe aus dem lokalen Warenkorb auf. Als einzige
 * Seite der Website entsteht ihr Inhalt vollständig in JavaScript – sie
 * zeigt ja, was dieser eine Besucher gerade ausgewählt hat, und das kann in
 * keiner HTML-Datei stehen.
 *
 * Voraussetzung: shop-data.js und cart.js sind geladen.
 */
(function () {
  "use strict";

  var root;
  var ordered = false;

  document.addEventListener("DOMContentLoaded", function () {
    root = document.querySelector("[data-cart-root]");
    if (!root) return;
    render();
    window.Cart.subscribe(function () {
      if (!ordered) render();
    });
  });

  function render() {
    var lines = window.Cart.lines().filter(function (line) {
      // Ein Artikel, den es nicht mehr gibt, darf die Seite nicht sprengen.
      return Boolean(SHOP_PRODUCTS[line.productSlug]);
    });

    if (lines.length === 0) {
      root.innerHTML =
        '<div class="empty-state">' +
        "<p>Your cart is empty</p>" +
        '<p class="muted">An apron, dough scrapers or a recipe collection as a PDF – have a look around the shop.</p>' +
        '<a class="btn btn--primary" href="shop.html" style="margin-top:1.5rem">Go to shop</a>' +
        "</div>";
      return;
    }

    var total = window.Cart.total();
    var itemCount = window.Cart.count();

    var hasPhysical = lines.some(function (line) {
      return SHOP_PRODUCTS[line.productSlug].type === "physical";
    });

    /* Reine PDF-Bestellungen werden nie versandt, und die Freigrenze gilt
       auf den Warenwert – beides genau so, wie es dem Kunden an anderer
       Stelle versprochen wird. */
    var qualifiesForFreeShipping =
      SHOP_TERMS.freeShippingFrom !== null && total >= SHOP_TERMS.freeShippingFrom;
    var shipping =
      hasPhysical && !qualifiesForFreeShipping ? SHOP_TERMS.shippingFlatRate : 0;
    var missingForFreeShipping =
      SHOP_TERMS.freeShippingFrom !== null && hasPhysical && !qualifiesForFreeShipping
        ? SHOP_TERMS.freeShippingFrom - total
        : 0;

    var shippingLabel;
    if (shipping === 0) {
      shippingLabel = hasPhysical ? "Free" : "none (PDF only)";
    } else {
      shippingLabel = formatPrice(shipping);
    }

    root.innerHTML =
      '<div class="cart-layout">' +
      '<ul class="cart-lines">' +
      lines.map(lineMarkup).join("") +
      "</ul>" +
      '<aside class="cart-summary">' +
      '<div class="panel">' +
      "<h2>Summary</h2>" +
      "<dl>" +
      row(
        "Subtotal (" + itemCount + (itemCount === 1 ? " item" : " items") + ")",
        formatPrice(total)
      ) +
      row("Shipping", shippingLabel) +
      "</dl>" +
      (missingForFreeShipping > 0
        ? '<p class="cart-summary__hint">' +
          formatPrice(missingForFreeShipping) +
          " more and shipping is free.</p>"
        : "") +
      '<div class="cart-summary__total"><b>Total</b><b>' +
      formatPrice(total + shipping) +
      "</b></div>" +
      '<button type="button" class="btn btn--primary btn--block" data-checkout style="margin-top:1.25rem">Checkout (mockup)</button>' +
      '<ul class="cart-summary__terms">' +
      term(
        "truck",
        "Delivery in " + SHOP_TERMS.deliveryTime + " to " + SHOP_TERMS.shipsTo
      ) +
      term("return", SHOP_TERMS.returnDays + " days to return") +
      term("shield", SHOP_TERMS.paymentMethods.join(" · ")) +
      "</ul>" +
      (SHOP_TERMS.isPrototype
        ? '<p class="notice" style="margin-top:.75rem">Prototype: this button charges nothing and ships nothing.</p>'
        : "") +
      '<button type="button" class="cart-summary__clear" data-clear>Empty cart</button>' +
      "</div>" +
      "</aside>" +
      "</div>";

    wire();
  }

  function lineMarkup(line) {
    var product = SHOP_PRODUCTS[line.productSlug];
    var variant = null;

    for (var i = 0; i < product.variants.length; i++) {
      if (product.variants[i].id === line.variantId) variant = product.variants[i];
    }

    var attrs =
      'data-slug="' +
      product.slug +
      '" data-variant="' +
      (line.variantId || "") +
      '"';

    return (
      '<li class="cart-line">' +
      '<img src="' +
      product.image +
      '" alt="" loading="lazy">' +
      '<div class="cart-line__text">' +
      '<a class="cart-line__title" href="shop/' +
      product.slug +
      '.html">' +
      escapeHtml(product.title) +
      "</a>" +
      '<p class="cart-line__variant">' +
      (variant ? "Colour: " + escapeHtml(variant.label) + " · " : "") +
      (product.type === "digital" ? "PDF download" : "Shipped") +
      "</p>" +
      '<div class="cart-line__foot">' +
      '<div class="qty">' +
      '<button type="button" aria-label="Decrease quantity" data-step="-1" ' +
      attrs +
      ">−</button>" +
      '<output>' +
      line.quantity +
      "</output>" +
      '<button type="button" aria-label="Increase quantity" data-step="1" ' +
      attrs +
      ">+</button>" +
      "</div>" +
      '<div class="cart-line__actions">' +
      "<b>" +
      formatPrice(product.price * line.quantity) +
      "</b>" +
      '<button type="button" class="cart-line__remove" data-remove ' +
      attrs +
      ">Remove</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</li>"
    );
  }

  function row(label, value) {
    return "<div><dt>" + label + "</dt><dd>" + value + "</dd></div>";
  }

  function term(icon, text) {
    return "<li>" + iconMarkup(icon) + "<span>" + escapeHtml(text) + "</span></li>";
  }

  function iconMarkup(name) {
    var paths = {
      truck:
        '<path d="M2.6 6h10v10.4h-10z"/><path d="M12.6 9.6h3.9l3.1 3.1v3.7h-7z"/><circle cx="6.4" cy="18" r="1.9"/><circle cx="16.6" cy="18" r="1.9"/>',
      return:
        '<path d="M20 12a8 8 0 1 1-2.7-6"/><path d="M20.2 3.8v4.6h-4.6"/>',
      shield:
        '<path d="M12 2.9 4.6 6.1v5.8c0 4.3 3 7.5 7.4 9.2 4.4-1.7 7.4-4.9 7.4-9.2V6.1L12 2.9Z"/><path d="m9 12.1 2.2 2.2 4.2-4.4"/>'
    };

    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      paths[name] +
      "</svg>"
    );
  }

  function wire() {
    root.querySelectorAll("[data-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        var slug = button.getAttribute("data-slug");
        var variantId = button.getAttribute("data-variant") || undefined;
        var step = Number(button.getAttribute("data-step"));
        var current = 0;

        window.Cart.lines().forEach(function (line) {
          if (
            line.productSlug === slug &&
            (line.variantId || "") === (variantId || "")
          ) {
            current = line.quantity;
          }
        });

        window.Cart.setQuantity(slug, variantId, current + step);
      });
    });

    root.querySelectorAll("[data-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        window.Cart.remove(
          button.getAttribute("data-slug"),
          button.getAttribute("data-variant") || undefined
        );
      });
    });

    var clear = root.querySelector("[data-clear]");
    if (clear) {
      clear.addEventListener("click", function () {
        window.Cart.clear();
      });
    }

    var checkout = root.querySelector("[data-checkout]");
    if (checkout) {
      checkout.addEventListener("click", function () {
        ordered = true;
        window.Cart.clear();
        showConfirmation();
      });
    }
  }

  function showConfirmation() {
    root.innerHTML =
      '<div class="cart-done">' +
      '<span class="cart-done__icon">' +
      iconMarkup("shield") +
      "</span>" +
      "<h2>That was the mockup checkout</h2>" +
      "<p>In this prototype nothing is charged and nothing is shipped. Stripe or Shopify will take over here later on.</p>" +
      '<a class="btn btn--primary" href="recipes.html" style="margin-top:1.5rem">On to the recipes</a>' +
      "</div>";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
