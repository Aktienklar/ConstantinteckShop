/**
 * KAUFBOX & "IN DEN WARENKORB"-BUTTONS
 *
 * Zwei Dinge:
 *   1. Die große Kaufbox auf der Produktseite (Farbe, Menge, Warenkorb).
 *   2. Die kleinen Buttons in den Cross-Selling-Blöcken auf den Rezeptseiten.
 *
 * Beide Male füllt der Klick nur den lokalen Warenkorb – bestellt wird
 * nichts. Voraussetzung: cart.js ist geladen.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-buybox]").forEach(setupBuyBox);
    document.querySelectorAll("[data-add-simple]").forEach(setupSimpleButton);
  });

  /* Große Kaufbox auf der Produktseite ----------------------------------- */

  function setupBuyBox(box) {
    var slug = box.getAttribute("data-slug");
    var variantButtons = box.querySelectorAll("[data-variant]");
    var quantityOutput = box.querySelector("[data-qty-value]");
    var addButton = box.querySelector("[data-add]");
    var added = box.querySelector("[data-added]");
    var addedText = box.querySelector("[data-added-text]");

    var quantity = 1;
    var variantId = variantButtons.length
      ? variantButtons[0].getAttribute("data-variant")
      : undefined;

    variantButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        variantId = button.getAttribute("data-variant");

        variantButtons.forEach(function (other) {
          var active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });

        // Die Bestätigung gehört zur vorherigen Auswahl – also weg damit.
        if (added) added.hidden = true;
      });
    });

    box.querySelectorAll("[data-qty]").forEach(function (button) {
      button.addEventListener("click", function () {
        var step = Number(button.getAttribute("data-qty"));
        quantity = Math.min(99, Math.max(1, quantity + step));
        if (quantityOutput) quantityOutput.textContent = String(quantity);
      });
    });

    if (!addButton) return;

    /* Noch nicht verkäuflich: Der Button bleibt sichtbar, aber tot – sonst
       landet etwas im Warenkorb, das an der Kasse abgewiesen wird. */
    var product = SHOP_PRODUCTS[slug];
    if (product && product.available === false) {
      addButton.disabled = true;
      addButton.textContent = "Not on sale yet";
      return;
    }

    addButton.addEventListener("click", function () {
      window.Cart.add(slug, variantId, quantity);

      if (added && addedText) {
        addedText.textContent = quantity + "× in your cart";
        added.hidden = false;
      }
    });
  }

  /* Kompakter Button in den Cross-Selling-Blöcken ------------------------- */

  function setupSimpleButton(button) {
    var simpleProduct = SHOP_PRODUCTS[button.getAttribute("data-slug")];
    if (simpleProduct && simpleProduct.available === false) {
      button.disabled = true;
      button.textContent = "Not on sale yet";
      return;
    }

    button.addEventListener("click", function () {
      var slug = button.getAttribute("data-slug");
      var variantId = button.getAttribute("data-variant") || undefined;
      var cartHref = button.getAttribute("data-cart-href") || "cart.html";

      window.Cart.add(slug, variantId);

      // Der Button wird zur Bestätigung und bietet den Weg zur Kasse an –
      // ein zweites Mal denselben Artikel hinzufügen will hier niemand.
      var confirmation = document.createElement("div");
      confirmation.className = "buybox__added notice--success";
      confirmation.setAttribute("role", "status");
      confirmation.innerHTML =
        '<p>Added ✓</p><a href="' + cartHref + '">Go to cart →</a>';

      button.replaceWith(confirmation);
    });
  }
})();
