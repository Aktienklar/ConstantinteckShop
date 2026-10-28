/**
 * PRODUKTGALERIE
 *
 * Zwei Handgriffe, die eine Produktseite braucht:
 *   1. Ein Vorschaubild antippen holt es nach oben ins große Feld.
 *   2. Das große Feld antippen zeigt die Aufnahme bildschirmfüllend, mit
 *      Pfeilen durch alle Bilder.
 *
 * Ohne dieses Skript bleibt die Seite vollständig benutzbar: Oben steht das
 * erste Bild, darunter stehen alle Aufnahmen als Vorschau – sie bewegen sich
 * nur nicht. Deshalb steht im HTML das Hauptbild fertig da und wird hier nicht
 * erst erzeugt.
 */
(function () {
  "use strict";

  /* Die Großansicht wird einmal gebaut und von jeder Galerie der Seite
     benutzt. Zwei Galerien auf einer Seite gibt es heute nicht, aber ein
     zweites Overlay im DOM wäre trotzdem falsch. */
  var lightbox = null;

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-gallery]").forEach(setupGallery);
  });

  function setupGallery(root) {
    var main = root.querySelector("[data-gallery-main]");
    var zoom = root.querySelector("[data-gallery-zoom]");
    var allThumbs = Array.prototype.slice.call(
      root.querySelectorAll("[data-gallery-thumb]")
    );

    if (!main || allThumbs.length === 0) return;

    /* Die Liste der Bilder kommt aus den Vorschaubildern – sie stehen im
       HTML in der Reihenfolge, in der sie gezeigt werden sollen, und das
       erste ist zugleich das Bild, das schon oben steht.

       Vorschaubilder mit data-colour="sand" gehören zu einer Farbe. Nennt
       die Galerie mit data-gallery-colour="colour" eine Farbauswahl der
       Kaufbox, stehen nur die Bilder der gewählten Farbe (und alle ohne
       data-colour) in der Leiste. Ohne JavaScript sind alle zu sehen. */
    var gallery = { images: [], thumbs: [], index: 0, show: show };

    function show(index) {
      var thumbs = gallery.thumbs;
      gallery.index = (index + thumbs.length) % thumbs.length;

      main.setAttribute("src", gallery.images[gallery.index].src);
      main.setAttribute("alt", gallery.images[gallery.index].alt);

      thumbs.forEach(function (thumb, i) {
        var active = i === gallery.index;
        thumb.classList.toggle("is-active", active);
        thumb.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function filter(colour) {
      gallery.thumbs = allThumbs.filter(function (thumb) {
        var own = thumb.getAttribute("data-colour");
        return !own || !colour || own === colour;
      });
      allThumbs.forEach(function (thumb) {
        thumb.hidden = gallery.thumbs.indexOf(thumb) === -1;
      });
      gallery.images = gallery.thumbs.map(function (thumb) {
        var img = thumb.querySelector("img");
        return {
          src: img.getAttribute("src"),
          alt: img.getAttribute("alt") || ""
        };
      });
      show(0);
    }

    allThumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        show(gallery.thumbs.indexOf(thumb));
      });
    });

    if (zoom && supportsDialog()) {
      zoom.addEventListener("click", function () {
        openLightbox(gallery, zoom);
      });
    } else if (zoom) {
      /* Ohne <dialog> gäbe es nichts zu öffnen. Dann soll der Knopf auch
         nicht so aussehen, als ließe sich etwas vergrößern. */
      zoom.classList.add("is-plain");
    }

    var groupId = root.getAttribute("data-gallery-colour");
    var group = groupId
      ? document.querySelector('[data-variant-group="' + groupId + '"]')
      : null;

    if (group) {
      group.addEventListener("click", function (event) {
        var chip = event.target.closest("[data-variant-value]");
        if (chip) filter(chip.getAttribute("data-variant-value"));
      });
      var active = group.querySelector('[data-variant-value][aria-pressed="true"]');
      filter(active ? active.getAttribute("data-variant-value") : "");
    } else {
      filter("");
    }
  }

  /* Großansicht ---------------------------------------------------------- */

  function supportsDialog() {
    return typeof document.createElement("dialog").showModal === "function";
  }

  function openLightbox(gallery, opener) {
    if (!lightbox) lightbox = buildLightbox();

    /* Ein zweites showModal() auf einem offenen Dialog wirft – und würde die
       Zeile darunter überspringen, die das Scrollen wieder freigibt. */
    if (lightbox.element.open) return;

    lightbox.gallery = gallery;
    lightbox.opener = opener;
    lightbox.setIndex(gallery.index);

    /* Hinter einem offenen Overlay weiterzuscrollen fühlt sich kaputt an.
       <dialog> macht den Rest der Seite unbedienbar, das Scrollen aber
       nicht – das bleibt Handarbeit. */
    document.documentElement.style.overflow = "hidden";
    lightbox.element.showModal();
  }

  function buildLightbox() {
    var element = document.createElement("dialog");
    element.className = "lightbox";
    element.setAttribute("aria-label", "Product pictures");

    element.innerHTML =
      '<div class="lightbox__frame">' +
      '<img class="lightbox__img" alt="">' +
      '<button type="button" class="lightbox__button lightbox__close" data-close>' +
      icon('<path d="m6 6 12 12"/><path d="m18 6-12 12"/>') +
      '<span class="sr-only">Close</span></button>' +
      '<button type="button" class="lightbox__button lightbox__prev" data-step="-1">' +
      icon('<path d="m14.5 5-7 7 7 7"/>') +
      '<span class="sr-only">Previous picture</span></button>' +
      '<button type="button" class="lightbox__button lightbox__next" data-step="1">' +
      icon('<path d="m9.5 5 7 7-7 7"/>') +
      '<span class="sr-only">Next picture</span></button>' +
      '<p class="lightbox__count" data-count></p>' +
      "</div>";

    var image = element.querySelector(".lightbox__img");
    var count = element.querySelector("[data-count]");

    var box = {
      element: element,
      gallery: null,
      opener: null,
      close: function () {
        if (element.open) element.close();
        document.documentElement.style.overflow = "";
        if (box.opener) box.opener.focus();
      },
      setIndex: function (index) {
        var gallery = box.gallery;
        gallery.show(index);

        image.setAttribute("src", gallery.images[gallery.index].src);
        image.setAttribute("alt", gallery.images[gallery.index].alt);
        count.textContent = gallery.index + 1 + " / " + gallery.images.length;

        /* Bei einem einzigen Bild gibt es nichts zu blättern. */
        var many = gallery.images.length > 1;
        element.querySelectorAll("[data-step]").forEach(function (button) {
          button.hidden = !many;
        });
        count.hidden = !many;
      }
    };

    element.querySelectorAll("[data-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        box.setIndex(box.gallery.index + Number(button.getAttribute("data-step")));
      });
    });

    element.querySelector("[data-close]").addEventListener("click", box.close);

    /* Klick neben das Bild schließt. Das <dialog> selbst füllt den ganzen
       Platz über dem Hintergrund – getroffen ist der Rand also immer dann,
       wenn das Ereignis am Dialog und nicht am Rahmen hängen bleibt. */
    element.addEventListener("click", function (event) {
      if (event.target === element) box.close();
    });

    element.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        box.setIndex(box.gallery.index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        box.setIndex(box.gallery.index + 1);
      } else if (event.key === "Escape") {
        /* Escape schließt das <dialog> von selbst. Das Aufräumen hängt hier
           trotzdem an der Taste und nicht am "close"-Ereignis: Es gibt
           Browser, die dieses Ereignis nicht auslösen, und dann bliebe die
           Seite dahinter für immer unscrollbar. */
        box.close();
      }
    });

    /* Wo "close" ausgelöst wird, schadet der zweite Durchgang nicht – beide
       Wege setzen dieselben zwei Werte. */
    element.addEventListener("close", box.close);

    document.body.appendChild(element);
    return box;
  }

  function icon(paths) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' +
      paths +
      "</svg>"
    );
  }
})();
