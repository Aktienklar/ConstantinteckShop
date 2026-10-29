/**
 * WIDERRUFSFUNKTION (withdraw.html)
 *
 * Schickt das Formular an den Worker (POST /api/withdraw, siehe
 * worker/src/withdraw.js). Der verschickt die Eingangsbestätigung per E-Mail –
 * erst danach meldet die Seite Erfolg. Scheitert der Versand, zeigt sie den
 * Weg per E-Mail mit vorausgefülltem Text, denn ein Widerruf darf nie an
 * unserer Technik hängen bleiben.
 *
 * Voraussetzung: shop-data.js ist geladen (SHOP_CHECKOUT.endpoint).
 */
(function () {
  "use strict";

  var SHOP_EMAIL = "info@constantinteck.com";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector("[data-withdraw]");
    if (!form) return;
    var status = form.querySelector("[data-withdraw-status]");
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = {
        name: form.name.value.trim(),
        orderNumber: form.orderNumber.value.trim(),
        email: form.email.value.trim(),
        items: form.items.value.trim(),
        message: form.message.value.trim(),
        website: form.website.value,
        confirmed: true
      };

      if (!data.name || !data.orderNumber || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        show(
          "Bitte Name, Bestellnummer und eine gültige E-Mail-Adresse angeben. · " +
            "Please enter your name, order number and a valid email address.",
          true
        );
        return;
      }

      button.disabled = true;
      show("Wird gesendet … · Sending …", false);

      fetch(SHOP_CHECKOUT.endpoint.replace(/\/$/, "") + "/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (response) {
          return response.json().then(function (body) {
            if (!response.ok) throw new Error(body.error || "failed");
            return body;
          });
        })
        .then(function (body) {
          var when = new Date(body.receivedAt || Date.now()).toLocaleString("de-DE", {
            dateStyle: "long",
            timeStyle: "medium"
          });
          form.innerHTML =
            '<p class="withdraw__done"><strong>Dein Widerruf ist eingegangen</strong> (' + escapeHtml(when) + "). " +
            "Die Bestätigung ist per E-Mail an " + escapeHtml(data.email) + " unterwegs.</p>" +
            '<p class="withdraw__done" lang="en"><strong>Your withdrawal has been received</strong> (' + escapeHtml(when) + "). " +
            "The confirmation is on its way to " + escapeHtml(data.email) + ".</p>";
        })
        .catch(function () {
          button.disabled = false;
          var mailto =
            "mailto:" + SHOP_EMAIL +
            "?subject=" + encodeURIComponent("Widerruf / Withdrawal " + data.orderNumber) +
            "&body=" + encodeURIComponent(
              "Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf der folgenden Waren:\n" +
                (data.items || "die ganze Bestellung") + "\n\nBestellnummer: " + data.orderNumber +
                "\nName: " + data.name + "\n\n" + data.message
            );
          status.innerHTML =
            "Der Widerruf konnte gerade nicht übermittelt werden. Bitte schick ihn per E-Mail – das ist genauso wirksam: " +
            '<a class="link-brand" href="' + mailto + '">E-Mail an ' + SHOP_EMAIL + "</a>. · " +
            '<span lang="en">Your withdrawal could not be sent right now. Please send it by email instead – that is just as valid.</span>';
          status.classList.add("is-error");
          status.hidden = false;
        });
    });

    function show(text, isError) {
      status.textContent = text;
      status.classList.toggle("is-error", isError);
      status.hidden = false;
    }
  });

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
