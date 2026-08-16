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
 * Welches Video wo liegt, steht in assets/js/recipe-videos.js. Diese Datei
 * hier muss dafür nie angefasst werden.
 *
 * Voraussetzung: recipe-videos.js ist vorher geladen.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-video-embed]").forEach(setup);
  });

  function setup(box) {
    var videos = window.RECIPE_VIDEOS || {};
    var slug = box.getAttribute("data-slug") || slugFromLocation();
    var url = (videos[slug] || "").trim();
    var code = url ? shortcode(url) : null;

    /* Kein Eintrag oder eine Adresse, aus der sich kein Beitrag lesen lässt:
       Das Foto bleibt stehen, wie es im HTML steht. Ein Abspielknopf, der
       nichts abspielt, wäre schlimmer als gar keiner. */
    if (!code) return;

    var poster = box.querySelector(".video-embed__poster");
    var note = box.querySelector(".video-embed__note");
    if (note) note.remove();

    /* Ein echter Link, kein Knopf: So funktioniert Mittelklick, "In neuem Tab
       öffnen" und der Fall, dass JavaScript aussteigt, nachdem die Seite
       aufgebaut ist. Den normalen Klick fangen wir unten ab. */
    var trigger = document.createElement("a");
    trigger.className = "video-embed__trigger";
    trigger.href = url;
    trigger.target = "_blank";
    trigger.rel = "noreferrer";
    trigger.setAttribute("aria-label", "Play the video – it loads from Instagram");

    if (poster) trigger.appendChild(poster);
    trigger.insertAdjacentHTML(
      "beforeend",
      '<span class="video-embed__play" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        "</span>" +
        '<span class="video-embed__hint">Play video · loads from Instagram</span>'
    );

    box.appendChild(trigger);

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

  /** "…/recipes/peach-sorbet.html" -> "peach-sorbet" */
  function slugFromLocation() {
    var last = window.location.pathname.split("/").pop() || "";
    return last.replace(/\.html$/, "");
  }

  function escapeAttr(value) {
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }
})();
