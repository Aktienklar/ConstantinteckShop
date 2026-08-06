/**
 * WARENKORB
 *
 * Der Warenkorb liegt ausschließlich im Browser des Besuchers
 * (localStorage) und wird nie an einen Server geschickt. Prototyp: keine
 * Zahlungsanbindung. Kommt später Stripe oder Shopify dazu, wird nur die
 * Kasse ersetzt – dieser Speicher kann bleiben.
 *
 * Diese Datei läuft auf jeder Seite, weil das Zähler-Abzeichen im Header
 * überall stimmen muss. Sie stellt `window.Cart` bereit; cart-page.js und
 * product.js bauen darauf auf.
 *
 * Voraussetzung: shop-data.js muss vorher geladen sein (wegen der Preise).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "ct-cart-v1";
  var listeners = [];

  function read() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      // Kaputter oder blockierter Speicher (z. B. privater Modus) –
      // dann startet der Besuch eben mit einem leeren Warenkorb.
      return [];
    }
  }

  function write(lines) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch (error) {
      // Ignorieren: der Warenkorb funktioniert dann nur bis zum Neuladen.
    }
    listeners.forEach(function (fn) {
      fn(lines);
    });
  }

  function sameLine(line, slug, variantId) {
    return (
      line.productSlug === slug && (line.variantId || "") === (variantId || "")
    );
  }

  var Cart = {
    lines: read,

    add: function (slug, variantId, quantity) {
      var qty = quantity || 1;
      var lines = read();
      var existing = null;

      for (var i = 0; i < lines.length; i++) {
        if (sameLine(lines[i], slug, variantId)) {
          existing = lines[i];
          break;
        }
      }

      if (existing) {
        existing.quantity += qty;
      } else {
        lines.push({
          productSlug: slug,
          variantId: variantId || undefined,
          quantity: qty
        });
      }

      write(lines);
    },

    setQuantity: function (slug, variantId, quantity) {
      var lines = read();

      if (quantity <= 0) {
        lines = lines.filter(function (line) {
          return !sameLine(line, slug, variantId);
        });
      } else {
        lines.forEach(function (line) {
          if (sameLine(line, slug, variantId)) line.quantity = quantity;
        });
      }

      write(lines);
    },

    remove: function (slug, variantId) {
      write(
        read().filter(function (line) {
          return !sameLine(line, slug, variantId);
        })
      );
    },

    clear: function () {
      write([]);
    },

    /** Gesamtzahl der Artikel – das, was im Header steht. */
    count: function () {
      return read().reduce(function (sum, line) {
        return sum + line.quantity;
      }, 0);
    },

    /** Warenwert ohne Versand. */
    total: function () {
      return read().reduce(function (sum, line) {
        var product = SHOP_PRODUCTS[line.productSlug];
        return sum + (product ? product.price * line.quantity : 0);
      }, 0);
    },

    /** Wird bei jeder Änderung aufgerufen und einmal sofort beim Anmelden. */
    subscribe: function (fn) {
      listeners.push(fn);
      fn(read());
    }
  };

  window.Cart = Cart;

  /* Zähler-Abzeichen im Header ------------------------------------------- */

  function updateBadge() {
    var badge = document.querySelector("[data-cart-count]");
    var link = document.querySelector("[data-cart-link]");
    if (!badge || !link) return;

    var count = Cart.count();
    badge.textContent = String(count);
    badge.hidden = count === 0;
    link.setAttribute(
      "aria-label",
      "Cart, " + count + (count === 1 ? " item" : " items")
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateBadge();
    Cart.subscribe(updateBadge);
  });

  // Zweiter Tab derselben Seite: dort geänderter Warenkorb schlägt hier durch.
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) updateBadge();
  });
})();
