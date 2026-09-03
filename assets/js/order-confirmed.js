/**
 * BESTELLBESTÄTIGUNG
 *
 * Fragt den Worker, was aus der Bestellung geworden ist, statt es zu
 * behaupten. Die Adresse dieser Seite enthält nur die Session-ID und lässt
 * sich auch ohne Bezahlung aufrufen – geglaubt wird deshalb nur, was Stripe
 * auf Nachfrage bestätigt.
 *
 * Ausgeliefert wird hier nichts: Das macht der Webhook, auch wenn der Käufer
 * diese Seite nie zu Gesicht bekommt.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-order-root]");
    if (!root) return;

    var sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      show(root, "Nothing to see here", "This page shows an order once you've placed one.");
      return;
    }

    fetch(
      SHOP_CHECKOUT.endpoint.replace(/\/$/, "") +
        "/api/session?session_id=" +
        encodeURIComponent(sessionId)
    )
      .then(function (response) {
        if (!response.ok) throw new Error("lookup failed");
        return response.json();
      })
      .then(function (order) {
        if (order.paid) {
          // Erst jetzt leeren. Wer bei Stripe abbricht, kommt auf cart.html
          // zurück und soll seine Auswahl wiederfinden.
          window.Cart.clear();
          showPaid(root, order);
        } else if (order.pending) {
          window.Cart.clear();
          showPending(root, order);
        } else {
          show(
            root,
            "This order wasn't completed",
            "No payment was taken. Your cart is still there if you'd like to try again."
          );
        }
      })
      .catch(function () {
        /* Wenn die Nachfrage scheitert, ist trotzdem womöglich bezahlt worden.
           Also weder Erfolg noch Misserfolg behaupten. */
        show(
          root,
          "We couldn't reach the order status",
          "If your payment went through, your confirmation email is on its way. " +
            "Write to us if nothing arrives within the hour."
        );
      });
  });

  function showPaid(root, order) {
    var lines = ["<p>Thank you! Your payment went through."];

    if (order.hasDigital) {
      lines.push(
        "</p><p>Your download link is on its way to " +
          (order.email ? "<b>" + escapeHtml(order.email) + "</b>" : "your inbox") +
          ". It can take a minute or two – do check the spam folder."
      );
    }
    if (order.hasPhysical) {
      lines.push(
        "</p><p>Your parcel goes out to " +
          escapeHtml(SHOP_TERMS.shipsTo) +
          " as quickly as I can pack it."
      );
    }
    lines.push("</p>");

    show(root, "Order confirmed", lines.join(""), true);
  }

  function showPending(root, order) {
    show(
      root,
      "Your order is on its way",
      "<p>Thanks! Your payment method (SEPA Direct Debit or Klarna, for instance) " +
        "takes a little longer to confirm – sometimes a couple of days.</p>" +
        (order.hasDigital
          ? "<p>Your download link goes out as soon as the payment clears.</p>"
          : ""),
      true
    );
  }

  function show(root, heading, body, isHtml) {
    root.innerHTML =
      '<div class="cart-done">' +
      '<span class="cart-done__icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 2.9 4.6 6.1v5.8c0 4.3 3 7.5 7.4 9.2 4.4-1.7 7.4-4.9 7.4-9.2V6.1L12 2.9Z"/>' +
      '<path d="m9 12.1 2.2 2.2 4.2-4.4"/>' +
      "</svg></span>" +
      "<h1>" +
      escapeHtml(heading) +
      "</h1>" +
      (isHtml ? body : "<p>" + escapeHtml(body) + "</p>") +
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
