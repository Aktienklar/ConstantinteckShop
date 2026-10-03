/**
 * VIDEO AUF DER REZEPTSEITE (ZWEI-KLICK-EINBETTUNG)
 *
 * Solange niemand auf Abspielen drückt, liegt hier nur das eigene Rezeptfoto.
 * Erst der Klick lädt den Player von Instagram nach. Das ist Absicht und keine
 * Bequemlichkeit:
 *
 *   1. Ein fest eingebauter Instagram-Player lädt bei jedem Seitenaufruf Code
 *      von Meta und setzt Cookies – auch bei Besuchern, die das Video nie
 *      ansehen. In Deutschland braucht das eine Einwilligung.
 *   2. Unsere Datenschutzerklärung sagt: "Zu den jeweiligen Anbietern werden
 *      Daten erst übertragen, wenn du sie anklickst." Mit dieser Bauart bleibt
 *      der Satz wahr.
 *   3. Der Player wiegt mehr als die ganze übrige Seite. Ihn nur zu laden,
 *      wenn er gebraucht wird, ist auch ohne Recht die bessere Idee.
 *
 * Eingebettet wird nur Instagram – genau das beschreibt privacy.html. Steht
 * bei einem Rezept eine TikTok- oder YouTube-Adresse, ist der Abspielknopf
 * ein gewöhnlicher Link dorthin (neuer Tab). Wer diese Player ebenfalls
 * einbetten will, muss vorher Abschnitt 2 und 7 der Datenschutzerklärung
 * ergänzen.
 *
 * Welches Video wo liegt, steht in assets/js/recipe-data.js (Feld "video").
 * Diese Datei hier muss dafür nie angefasst werden.
 *
 * Voraussetzung: recipe-data.js ist vorher geladen.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-video-embed]").forEach(setup);
  });

  function setup(box) {
    var recipes = window.RECIPES || {};
    var slug = box.getAttribute("data-slug") || slugFromLocation();
    var url = ((recipes[slug] || {}).video || "").trim();
    var code = url ? shortcode(url) : null;
    var outside = code ? null : platform(url);

    /* Kein Eintrag oder eine Adresse, die zu keinem der drei Anbieter gehört:
       Das Foto bleibt stehen, wie es im HTML steht. Ein Abspielknopf, der
       nichts abspielt, wäre schlimmer als gar keiner. */
    if (!code && !outside) return;

    var poster = box.querySelector(".video-embed__poster");

    /* Ein echter Link, kein Knopf: So funktioniert Mittelklick, "In neuem Tab
       öffnen" und der Fall, dass JavaScript aussteigt, nachdem die Seite
       aufgebaut ist. Den normalen Klick fangen wir unten ab. */
    var trigger = document.createElement("a");
    trigger.className = "video-embed__trigger";
    trigger.href = url;
    trigger.target = "_blank";
    trigger.rel = "noreferrer";
    trigger.setAttribute(
      "aria-label",
      code
        ? "Play the video – it loads from Instagram"
        : "Watch the video on " + outside + " (opens in a new tab)"
    );

    if (poster) trigger.appendChild(poster);
    trigger.insertAdjacentHTML(
      "beforeend",
      '<span class="video-embed__play" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        "</span>" +
        '<span class="video-embed__hint">' +
        (code ? "Play video · loads from Instagram" : "Watch on " + outside + " ↗") +
        "</span>"
    );

    box.appendChild(trigger);

    // TikTok / YouTube: Der Link oben ist schon alles – nichts wird eingebettet.
    if (!code) return;

    trigger.addEventListener("click", function (event) {
      // Mittelklick, Cmd/Strg-Klick: der Besucher will Instagram im neuen Tab.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      play(box, code, url);
    });
  }

  function play(box, code, url) {
    var frame = document.createElement("iframe");
    frame.className = "video-embed__frame";
    frame.src = "https://www.instagram.com/reel/" + code + "/embed";
    frame.title = "Instagram video";
    frame.loading = "lazy";
    frame.allow = "encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("frameborder", "0");

    box.classList.add("is-playing");
    box.innerHTML = "";
    box.appendChild(frame);

    /* Instagram zeigt eingebettete Beiträge nicht überall – gesperrte Länder,
       ein gelöschtes Reel, ein Blocker im Browser. Dann steht der Besucher vor
       einem leeren Kasten, also liegt der Weg zu Instagram immer daneben. */
    box.insertAdjacentHTML(
      "beforeend",
      '<p class="video-embed__fallback">Video not loading? ' +
        '<a href="' +
        escapeAttr(url) +
        '" target="_blank" rel="noreferrer">Watch it on Instagram</a></p>'
    );

    frame.focus();
  }

  /**
   * Zieht die Kennung des Beitrags aus einer Instagram-Adresse. Erlaubt sind
   * die drei Formen, die Instagram beim Teilen ausgibt:
   *   instagram.com/reel/<code>/     (Reels – der Normalfall)
   *   instagram.com/p/<code>/        (Beiträge im Feed)
   *   instagram.com/tv/<code>/       (alte IGTV-Links)
   * Alles dahinter – ?igsh=…, Zeilenumbrüche, fehlender Schrägstrich – ist
   * egal. Wer versehentlich einen TikTok-Link einträgt, bekommt null zurück
   * und damit das Foto ohne Abspielknopf.
   */
  function shortcode(url) {
    var match = String(url).match(
      /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i
    );
    return match ? match[1] : null;
  }

  /** "TikTok" oder "YouTube", wenn die Adresse dorthin führt – sonst null. */
  function platform(url) {
    if (/^https:\/\/([a-z]+\.)?tiktok\.com\//i.test(url)) return "TikTok";
    if (/^https:\/\/(([a-z]+\.)?youtube\.com|youtu\.be)\//i.test(url)) return "YouTube";
    return null;
  }

  /** "…/recipes/peach-sorbet.html" -> "peach-sorbet" */
  function slugFromLocation() {
    var last = window.location.pathname.split("/").pop() || "";
    return last.replace(/\.html$/, "");
  }

  function escapeAttr(value) {
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }
})();
