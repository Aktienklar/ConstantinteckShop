/**
 * WAS AUF JEDER SEITE LÄUFT
 *
 * Setzt die Werte aus assets/js/site-config.js um. Jeder Teil tut nichts,
 * solange sein Eintrag dort leer oder ausgeschaltet ist – die Seiten sehen
 * dann genau so aus, wie sie im HTML stehen.
 *
 * Voraussetzung: site-config.js ist vorher geladen.
 */
(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};

  /* Diese Datei wird von Seiten im Hauptordner und aus recipes/ und shop/
     geladen. Der Weg zurück zum Hauptordner ("" oder "../") steckt in ihrer
     eigenen Adresse. */
  var script = document.currentScript;
  var root = script
    ? script.getAttribute("src").replace(/assets\/js\/site\.js.*$/, "")
    : "";

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* --- Saison (Krimi-Dinner) ----------------------------------------------
     Eine statische Seite kennt das heutige Datum nicht – deshalb entscheidet
     hier der Browser des Besuchers. Alle Werte schreibt tools/cases.py aus
     data/cases.json in die Seite (Feld "seasonal" eines Falls):

       Leiste      data-season-months="11,12" + data-season-href/-short/-long:
                   im Zeitraum wirbt sie für diesen Fall statt für alle.
       Karten      .krimi-cases__item[data-seasonal="11,12"]: rückt nach vorn,
                   bekommt das Abzeichen "Seasonal pick".
       Startseite  [data-season-only] erscheint nur im Zeitraum,
                   [data-off-season-only] nur außerhalb. */

  function inSeason(list) {
    var month = new Date().getMonth() + 1;
    return String(list || "").split(",").map(Number).indexOf(month) !== -1;
  }

  function applySeason() {
    document.querySelectorAll(".announcement__deal[data-season-months]").forEach(function (link) {
      if (!inSeason(link.getAttribute("data-season-months"))) return;
      var narrow = link.querySelector(".only-narrow");
      var wide = link.querySelector(".only-wide");
      if (narrow) narrow.textContent = link.getAttribute("data-season-short");
      if (wide) wide.textContent = link.getAttribute("data-season-long");
      link.setAttribute("href", link.getAttribute("data-season-href"));
      link.setAttribute("data-track", link.getAttribute("data-season-track"));
    });

    document.querySelectorAll(".krimi-cases__item[data-seasonal]").forEach(function (cell) {
      if (!inSeason(cell.getAttribute("data-seasonal"))) return;
      var card = cell.querySelector(".krimi-card");
      var badge = cell.querySelector("[data-season-badge]");
      if (card) card.classList.add("is-seasonal");
      if (badge) badge.hidden = false;
      cell.parentNode.insertBefore(cell, cell.parentNode.firstElementChild);
    });

    document.querySelectorAll("[data-season-only]").forEach(function (el) {
      if (!inSeason(el.getAttribute("data-season-only"))) return;
      el.hidden = false;
      var badge = el.querySelector("[data-season-badge]");
      var card = el.querySelector(".krimi-card");
      if (badge) badge.hidden = false;
      if (card) card.classList.add("is-seasonal");
    });
    document.querySelectorAll("[data-off-season-only]").forEach(function (el) {
      if (inSeason(el.getAttribute("data-off-season-only"))) el.hidden = true;
    });
  }

  /* --- Herkunft eines Kaufs (utm_content) -----------------------------------
     Kaufknöpfe tragen utm_content = ihre Stelle (z. B. "krimi-card"). Kam der
     Besucher über einen Link mit data-via="nav" (Navigation, Leiste, Fuß,
     Rezept-Box …) auf die Krimi- oder Fallseite, hängt diese Stelle sich an:
     utm_content=krimi-card--from-nav. Gemerkt wird nur der letzte Weg, nur
     für diesen Tab (sessionStorage) und ohne die Adresse zu verändern. */

  var VIA_KEY = "ct-via";

  function setupVia() {
    document.addEventListener(
      "click",
      function (event) {
        var link = event.target.closest ? event.target.closest("a") : null;
        if (!link) return;

        var via = link.getAttribute("data-via");
        if (via) {
          try { sessionStorage.setItem(VIA_KEY, via); } catch (e) { /* privat: dann eben ohne */ }
          return;
        }

        if (!link.hasAttribute("data-mn-funnel")) return;
        var from = "";
        try { from = sessionStorage.getItem(VIA_KEY) || ""; } catch (e) { /* ohne */ }
        if (!/^[a-z0-9-]+$/.test(from)) return;
        link.href = link.href.replace(/([?&]utm_content=)([^&#]*)/, function (all, key, value) {
          return key + value.replace(/--from-[a-z0-9-]+$/, "") + "--from-" + from;
        });
      },
      true
    );
  }

  /* --- Newsletter ----------------------------------------------------------- */

  function renderNewsletter() {
    var news = config.newsletter;
    if (!news || !news.enabled || !news.formAction) return;

    document.querySelectorAll("[data-newsletter]").forEach(function (box, index) {
      var id = "newsletter-email-" + index;

      box.innerHTML =
        '<section class="panel panel--outline newsletter" aria-label="Newsletter">' +
        '<h2 class="newsletter__title">' + esc(news.heading) + "</h2>" +
        (news.text ? '<p class="newsletter__text">' + esc(news.text) + "</p>" : "") +
        /* target="_blank": Die Bestätigungsseite des Anbieters öffnet sich
           daneben, das Rezept bleibt offen. */
        '<form class="newsletter__form" method="post" target="_blank" action="' + esc(news.formAction) + '" data-track-submit="newsletter-signup">' +
        '<label class="sr-only" for="' + id + '">Email address</label>' +
        '<input id="' + id + '" type="email" required autocomplete="email" inputmode="email"' +
        ' name="' + esc(news.emailField || "EMAIL") + '" placeholder="you@example.com">' +
        '<button type="submit" class="btn btn--primary">' + esc(news.button || "Sign up") + "</button>" +
        "</form>" +
        '<p class="newsletter__note">' + esc(news.note || "") +
        ' <a href="' + root + 'privacy.html">Privacy</a></p>' +
        "</section>";
      box.hidden = false;
    });
  }

  /* --- Besucherzählung ------------------------------------------------------ */

  function setupTracking() {
    var code = ((config.tracking || {}).goatcounter || "").trim();
    // Nur Buchstaben, Ziffern, Bindestrich – der Wert landet in einer Adresse.
    var withGoatcounter = /^[a-z0-9-]+$/i.test(code);
    if (withGoatcounter) loadGoatcounter(code);
    // Auch ohne GoatCounter: PostHog kann jederzeit per Banner dazukommen.
    if (withGoatcounter || posthogConfig()) listenForClicks();
  }

  function loadGoatcounter(code) {
    var tag = document.createElement("script");
    tag.async = true;
    // Von unserem eigenen Server statt von gc.zgo.at, neben site.js (die
    // Seiten liegen in verschiedenen Ordnern). Kopie des offiziellen
    // count.js (ISC-Lizenz), Stand 30.10.2026; nur bei Bedarf neu holen.
    var self = document.querySelector('script[src$="site.js"]');
    tag.src = new URL("goatcounter-count.js", self ? self.src : location.href).href;
    tag.setAttribute("data-goatcounter", "https://" + code + ".goatcounter.com/count");
    document.head.appendChild(tag);
  }

  function listenForClicks() {
    function count(name) {
      if (!name) return;
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: name, title: location.pathname, event: true });
      }
      // PostHog nur, wenn eingewilligt wurde – sonst existiert es gar nicht.
      // Aus "krimi-click/hero/the-comet-vintage" wird das Ereignis
      // "krimi-click" mit Stelle und Ziel als Eigenschaften.
      if (posthogStarted && window.posthog) {
        var parts = name.split("/");
        window.posthog.capture(parts[0], { target: name, placement: parts[1] || null, item: parts[2] || null });
      }
    }

    /* Ein Zuhörer für die ganze Seite: Er erfasst auch Karten, die erst ein
       Skript eingesetzt hat. Der Klick selbst läuft ungestört weiter. */
    document.addEventListener(
      "click",
      function (event) {
        var target = event.target.closest ? event.target.closest("[data-track]") : null;
        if (target) count(target.getAttribute("data-track"));
      },
      true
    );

    document.addEventListener(
      "submit",
      function (event) {
        count(event.target.getAttribute && event.target.getAttribute("data-track-submit"));
      },
      true
    );
  }

  /* --- Einwilligung und PostHog ----------------------------------------------
     PostHog setzt Cookies und zeichnet Sitzungen auf – das braucht vorher eine
     Einwilligung (§ 25 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Bis zum Klick auf
     "Accept" wird von PostHog nichts geladen. Die Entscheidung liegt in
     localStorage ("ct-consent"); das ist selbst einwilligungsfrei, weil der
     Banner sonst bei jedem Seitenwechsel wiederkäme.

     Beide Knöpfe sehen gleich aus und sind gleich groß: Ein hervorgehobenes
     "Accept" neben einem blassen "Decline" kippt die Einwilligung. */

  var CONSENT_KEY = "ct-consent";
  var posthogStarted = false;

  function posthogConfig() {
    var ph = (config.tracking || {}).posthog || {};
    return /^phc_[A-Za-z0-9]+$/.test(ph.key || "") ? ph : null;
  }

  function readConsent(ph) {
    try {
      var saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      return saved && saved.v === (ph.consentVersion || 1) ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(ph, granted) {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ v: ph.consentVersion || 1, analytics: granted, date: new Date().toISOString().slice(0, 10) })
      );
    } catch (e) {
      /* privat: Der Banner kommt dann beim nächsten Mal wieder. */
    }
  }

  function setupConsent() {
    var ph = posthogConfig();
    if (!ph) return;

    addConsentLink(ph);
    var saved = readConsent(ph);
    if (!saved) showBanner(ph);
    else if (saved.analytics) startPosthog(ph);
  }

  function startPosthog(ph) {
    if (posthogStarted) return;
    posthogStarted = true;

    /* Offizieller Lade-Schnipsel von PostHog: legt sofort einen Platzhalter
       an, der Aufrufe sammelt, bis array.js geladen ist. */
    /* eslint-disable */
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    /* eslint-enable */

    window.posthog.init(ph.key, {
      api_host: ph.host,
      ui_host: "https://eu.posthog.com",
      // Keine Personenprofile für anonyme Besucher – Wege und Funnels
      // funktionieren trotzdem, es entsteht nur keine "Person" in PostHog.
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      // Eingaben in Formularen erscheinen in Aufzeichnungen nur als ***.
      session_recording: { maskAllInputs: true }
    });
  }

  /* Widerruf: PostHog abschalten und alles löschen, was es hinterlassen hat
     (Cookie ph_<key>_posthog, Einträge in localStorage/sessionStorage). */
  function stopPosthog() {
    if (window.posthog && window.posthog.opt_out_capturing) {
      try { window.posthog.opt_out_capturing(); } catch (e) { /* weiter */ }
    }
    document.cookie.split(";").forEach(function (entry) {
      var name = entry.split("=")[0].trim();
      if (name.indexOf("ph_") !== 0) return;
      var host = location.hostname.replace(/^www\./, "");
      ["", "; domain=" + host, "; domain=." + host].forEach(function (domain) {
        document.cookie = name + "=; Max-Age=0; path=/" + domain;
      });
    });
    [localStorage, sessionStorage].forEach(function (store) {
      try {
        Object.keys(store).forEach(function (key) {
          if (key.indexOf("ph_") === 0 || key.indexOf("__ph") === 0) store.removeItem(key);
        });
      } catch (e) {
        /* ohne Speicherzugriff gibt es auch nichts zu löschen */
      }
    });
  }

  function showBanner(ph) {
    if (document.querySelector(".consent")) return;
    var saved = readConsent(ph);

    var banner = document.createElement("section");
    banner.className = "consent";
    banner.setAttribute("aria-label", "Cookie settings");
    banner.innerHTML =
      '<p class="consent__title">May I see how you use this site?</p>' +
      '<p class="consent__text">With your consent, PostHog (servers in Frankfurt) records which pages you view, ' +
      "what you click and a replay of your visit – anything you type is hidden. " +
      "It sets cookies for this. I use it only to improve the site. Without consent, visits are only " +
      'counted in total, without cookies. <a href="' + root + 'privacy.html">Privacy policy</a></p>' +
      (saved ? '<p class="consent__text consent__state">Current choice: ' + (saved.analytics ? "accepted" : "declined") + ".</p>" : "") +
      '<div class="consent__actions">' +
      '<button type="button" class="btn btn--secondary" data-consent="no">Decline</button>' +
      '<button type="button" class="btn btn--secondary" data-consent="yes">Accept</button>' +
      "</div>";

    banner.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest("[data-consent]") : null;
      if (!button) return;
      var granted = button.getAttribute("data-consent") === "yes";
      var wasGranted = posthogStarted;

      saveConsent(ph, granted);
      banner.remove();

      if (granted) {
        startPosthog(ph);
      } else if (wasGranted) {
        stopPosthog();
        // Neu laden, damit der bereits geladene PostHog-Code verschwindet.
        location.reload();
      }
    });

    document.body.appendChild(banner);
  }

  /* "Cookie settings" im Fuß, direkt unter "Privacy": öffnet den Banner
     erneut. Widerrufen muss so einfach sein wie Zustimmen. */
  function addConsentLink(ph) {
    document.querySelectorAll('.site-footer a[href$="privacy.html"]').forEach(function (link) {
      var item = link.closest("li");
      if (!item) return;
      var entry = document.createElement("li");
      entry.innerHTML = '<button type="button" class="site-footer__consent">Cookie settings</button>';
      entry.firstChild.addEventListener("click", function () {
        showBanner(ph);
      });
      item.parentNode.insertBefore(entry, item.nextSibling);
    });
  }

  /* --- Kundenfotos ------------------------------------------------------- */

  function renderCustomerPhotos() {
    var photos = (config.customerPhotos || []).filter(function (photo) {
      return photo && photo.file;
    });
    if (!photos.length) return;

    document.querySelectorAll("[data-customer-photos]").forEach(function (box) {
      box.innerHTML =
        '<section aria-labelledby="in-your-kitchens">' +
        '<h2 id="in-your-kitchens" style="font-size:1.25rem">In your kitchens</h2>' +
        '<p class="muted" style="margin-top:.25rem;font-size:.875rem">Photos you sent me – thank you!</p>' +
        '<ul class="customer-photos no-scrollbar">' +
        photos
          .map(function (photo) {
            return (
              "<li><figure>" +
              '<img src="' + esc(root + "assets/img/customers/" + photo.file) + '" alt="' + esc(photo.alt || "") + '" loading="lazy">' +
              (photo.by ? "<figcaption>" + esc(photo.by) + "</figcaption>" : "") +
              "</figure></li>"
            );
          })
          .join("") +
        "</ul>" +
        "</section>";
      box.hidden = false;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applySeason();
    setupVia();
    renderNewsletter();
    renderCustomerPhotos();
    setupConsent();
    setupTracking();
  });
})();
