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
    var quantityOutput = box.querySelector("[data-qty-value]");
    var addButton = box.querySelector("[data-add]");
    var added = box.querySelector("[data-added]");
    var addedText = box.querySelector("[data-added-text]");

    var quantity = 1;

    /* Eine Kaufbox kann mehrere Fragen stellen: die Kinderschürze Farbe und
       Größe, das Set beide Farben und die Größe. Jede Frage ist ein
       [data-variant-group] mit Chips darin; die Reihenfolge im HTML muss die
       der Optionen in shop-data.js sein, denn aus ihr wird die Kennung
       zusammengesetzt, die im Warenkorb und an der Kasse landet. */
    var groups = [].map.call(
      box.querySelectorAll("[data-variant-group]"),
      function (group) {
        var buttons = [].slice.call(
          group.querySelectorAll("[data-variant-value]")
        );
        return {
          buttons: buttons,
          /* Vorausgewählt ist, was im HTML als aktiv markiert ist – sonst der
             erste Chip. So steht die Auswahl auch ohne JavaScript richtig da. */
          value: (
            buttons.filter(function (button) {
              return button.classList.contains("is-active");
            })[0] || buttons[0]
          ).getAttribute("data-variant-value")
        };
      }
    );

    function variantId() {
      if (!groups.length) return undefined;
      return groups
        .map(function (group) {
          return group.value;
        })
        .join("__");
    }

    groups.forEach(function (group) {
      group.buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          group.value = button.getAttribute("data-variant-value");

          group.buttons.forEach(function (other) {
            var active = other === button;
            other.classList.toggle("is-active", active);
            other.setAttribute("aria-pressed", active ? "true" : "false");
          });

          // Die Bestätigung gehört zur vorherigen Auswahl – also weg damit.
          if (added) added.hidden = true;
        });
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
      window.Cart.add(slug, variantId(), quantity);

      if (added && addedText) {
        addedText.textContent = quantity + "× in your cart";
        added.hidden = false;
      }
    });
  }

  /* Kompakter Button in den Cross-Selling-Blöcken ------------------------- */

  function setupSimpleButton(button) {
    var slug = button.getAttribute("data-slug");
    var cartHref = button.getAttribute("data-cart-href") || "cart.html";
    var simpleProduct = SHOP_PRODUCTS[slug];

    if (simpleProduct && simpleProduct.available === false) {
      button.disabled = true;
      button.textContent = "Not on sale yet";
      return;
    }

    /* Seit es Farben und Größen gibt, kann dieser Knopf die Schürze nicht mehr
       selbst in den Warenkorb legen: Er müsste eine Farbe raten, und die Kasse
       weist eine Bestellung ohne gewählte Variante ohnehin ab. Er wird deshalb
       zum Weg auf die Produktseite, wo die Auswahl steht. Aus "../cart.html"
       wird "../shop/linen-apron.html" – der Verweis auf den Warenkorb trägt
       die einzige Ortsangabe, die diese Blöcke haben. */
    if (simpleProduct && simpleProduct.options) {
      var link = document.createElement("a");
      link.className = button.className;
      link.href = cartHref.replace(/cart\.html$/, "shop/" + slug + ".html");
      link.textContent =
        simpleProduct.options.length > 1
          ? "Choose colour & size"
          : "Choose a colour";
      button.replaceWith(link);
      return;
    }

    button.addEventListener("click", function () {
      var variantId = button.getAttribute("data-variant") || undefined;

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
