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

  document.addEventListener("DOMContentLoaded", function () {
    root = document.querySelector("[data-cart-root]");
    if (!root) return;
    render();
    window.Cart.subscribe(render);
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
        '<p class="muted">The waffle piqué aprons from the videos are waiting in the shop – in two sizes, or as a set.</p>' +
        '<a class="btn btn--primary" href="shop.html" style="margin-top:1.5rem">Go to shop</a>' +
        "</div>";
      return;
    }

    var total = window.Cart.total();
    var itemCount = window.Cart.count();

    var hasPhysical = lines.some(function (line) {
      return SHOP_PRODUCTS[line.productSlug].type === "physical";
    });

    var hasDigital = lines.some(function (line) {
      return SHOP_PRODUCTS[line.productSlug].type === "digital";
    });

    /* Kann im Warenkorb liegen, wenn jemand ihn vor der Umstellung gefüllt
       hat. Die Kasse würde es abweisen – das soll er hier schon erfahren. */
    var blocked = lines.filter(function (line) {
      return SHOP_PRODUCTS[line.productSlug].available === false;
    });

    /* Reine PDF-Bestellungen werden nie versandt. Eine Freigrenze gibt es
       nicht mehr (freeShippingFrom ist null), der Zweig bleibt aber stehen,
       falls je wieder eine eingeführt wird. */
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
      (blocked.length > 0
        ? '<p class="notice" style="margin-top:1rem">' +
          escapeHtml(
            blocked
              .map(function (line) {
                return SHOP_PRODUCTS[line.productSlug].title;
              })
              .join(", ")
          ) +
          (blocked.length === 1 ? " is" : " are") +
          " not on sale yet. Please remove " +
          (blocked.length === 1 ? "it" : "them") +
          " to continue.</p>"
        : "") +
      (hasDigital && blocked.length === 0 ? waiverMarkup() : "") +
      '<button type="button" class="btn btn--primary btn--block" data-checkout' +
      (blocked.length > 0 ? " disabled" : "") +
      ' style="margin-top:1.25rem">Pay securely</button>' +
      '<p class="cart-summary__error" data-checkout-error hidden></p>' +
      '<ul class="cart-summary__terms">' +
      term(
        "truck",
        SHOP_TERMS.deliveryPromise + " to " + SHOP_TERMS.shipsTo
      ) +
      term("return", SHOP_TERMS.returnDays + " days to return") +
      term("shield", SHOP_TERMS.paymentMethods.join(" · ")) +
      "</ul>" +
      (SHOP_TERMS.isPrototype
        ? '<p class="notice" style="margin-top:.75rem">Test mode: a real Stripe checkout opens, but no money moves and nothing ships.</p>'
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
      /* Beim Set stehen zwei Farben in einer Variante – dort heißt die Zeile
         deshalb "Colours", überall sonst "Colour". */
      (variant
        ? (product.variantLegend || "Colour") +
          ": " +
          escapeHtml(variant.label) +
          " · "
        : "") +
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

  /**
   * Verzicht auf das Widerrufsrecht.
   *
   * Bei einer Datei, die sofort heruntergeladen werden kann, muss der Käufer
   * vor dem Kauf ausdrücklich zustimmen, dass die Ausführung sofort beginnt –
   * sonst darf er 14 Tage lang widerrufen und die PDF trotzdem behalten. Ein
   * vorangekreuztes Kästchen zählt nicht, deshalb ist es leer und die Kasse
   * bleibt bis zum Anhaken gesperrt.
   *
   * Der Wortlaut ist noch nicht anwaltlich geprüft.
   */
  function waiverMarkup() {
    return (
      '<label class="cart-summary__waiver">' +
      '<input type="checkbox" data-waiver>' +
      "<span>I agree that the download starts immediately and that I " +
      "therefore lose my 14-day right of withdrawal for the PDF." +
      "</span>" +
      "</label>"
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
        startCheckout(checkout);
      });
    }
  }

  /**
   * Schickt den Warenkorb an den Worker und folgt der Adresse, die Stripe
   * zurückgibt. Geschickt werden nur Slug, Variante und Menge – die Preise
   * holt sich der Worker aus seinem eigenen Katalog. Was hier im Browser
   * steht, könnte jeder verändern.
   */
  function startCheckout(button) {
    var errorBox = root.querySelector("[data-checkout-error]");
    var waiver = root.querySelector("[data-waiver]");

    function fail(message) {
      if (!errorBox) return;
      errorBox.textContent = message;
      errorBox.hidden = false;
    }

    if (errorBox) errorBox.hidden = true;

    if (waiver && !waiver.checked) {
      fail("Please confirm the note about the download before paying.");
      waiver.focus();
      return;
    }

    button.disabled = true;
    button.textContent = "One moment …";

    var lines = window.Cart.lines().filter(function (line) {
      return Boolean(SHOP_PRODUCTS[line.productSlug]);
    });

    fetch(SHOP_CHECKOUT.endpoint.replace(/\/$/, "") + "/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map(function (line) {
          return {
            productSlug: line.productSlug,
            variantId: line.variantId || null,
            quantity: line.quantity
          };
        }),
        waivesWithdrawal: Boolean(waiver && waiver.checked),
        // Ein Doppelklick soll keine zweite Bestellung anlegen.
        idempotencyKey: checkoutKey(lines)
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.error || "Checkout failed.");
          return data;
        });
      })
      .then(function (data) {
        /* Der Warenkorb wird hier absichtlich NICHT geleert. Wer bei Stripe
           abbricht, landet wieder auf dieser Seite und soll seine Auswahl
           vorfinden. Geleert wird erst auf der Bestätigungsseite, nachdem
           die Zahlung bestätigt ist. */
        window.location.href = data.url;
      })
      .catch(function (error) {
        button.disabled = false;
        button.textContent = "Pay securely";
        fail(error.message || "The checkout could not be opened. Please try again.");
      });
  }

  /** Gleicher Warenkorb in derselben Minute = gleiche Bestellung. */
  function checkoutKey(lines) {
    var fingerprint = lines
      .map(function (line) {
        return line.productSlug + ":" + (line.variantId || "") + ":" + line.quantity;
      })
      .sort()
      .join("|");
    return "ct-" + Math.floor(Date.now() / 60000) + "-" + hash(fingerprint);
  }

  function hash(value) {
    var out = 5381;
    for (var i = 0; i < value.length; i++) out = ((out * 33) ^ value.charCodeAt(i)) >>> 0;
    return out.toString(36);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
