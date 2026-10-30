/**
 * ZENTRALE EINSTELLUNGEN
 *
 * Alles, was sich ändern lässt, ohne eine einzige Seite anzufassen. Die Datei
 * wird von jeder Seite geladen; assets/js/site.js setzt die Werte um.
 */
var SITE_CONFIG = {
  /*
   * ANKÜNDIGUNGSLEISTE: steht seit 29.10.2026 nicht mehr hier. Sie wirbt auf
   * allen Seiten für die Krimi-Dinner und kommt aus data/cases.json
   * (tools/cases.py; im Zeitraum "seasonal" eines Falls wirbt sie für ihn).
   * Schürzen werden in der Leiste nicht mehr beworben.
   */

  /**
   * NEWSLETTER-BOX – auf den Rezeptseiten (nach der Zubereitung) und auf
   * recipes.html. Erscheint erst, wenn "enabled" true ist UND eine
   * Formular-Adresse eingetragen ist.
   *
   * formAction  Die Adresse, an die das Anmeldeformular des Anbieters sendet.
   *             Brevo: Formular anlegen -> "Teilen" -> HTML-Code; dort steht
   *             sie im <form action="…">. MailerLite und Buttondown ebenso.
   * emailField  Name des E-Mail-Feldes im Formular des Anbieters:
   *             Brevo "EMAIL", MailerLite "fields[email]", Buttondown "email".
   *
   * VOR DEM EINSCHALTEN: Im Anbieter Double-Opt-in aktivieren, die PDF
   * bereitlegen, die der Text verspricht, und privacy.html ergänzen – dort
   * steht heute, dass die Seite keinen Newsletter verschickt.
   */
  newsletter: {
    enabled: false,
    formAction: "", // TODO: Formular-Adresse des Anbieters
    emailField: "EMAIL",
    heading: "Get all sorbet recipes as a printable PDF – free.",
    text: "One email with the PDF, and a note from me when a new recipe goes up.",
    button: "Send me the PDF",
    note: "You'll get an email to confirm first. Unsubscribe any time."
  },

  /**
   * BESUCHERZÄHLUNG (GoatCounter) – ohne Cookies, ohne Profile.
   *
   * goatcounter  Der Code deines GoatCounter-Kontos, also der Teil vor
   *              ".goatcounter.com" (aus "constantinteck.goatcounter.com"
   *              wird "constantinteck"). Leer = es wird nichts geladen und
   *              nichts gezählt.
   *
   * Gezählt werden Seitenaufrufe und Klicks auf alles mit data-track="…":
   *   product-click/recipe/<produkt>           Produktkarte auf einer Rezeptseite
   *   product-click/overview-latest/<produkt>  Karte neben "From the latest videos"
   *   product-click/overview-grid/<produkt>    Shop-Karte im Rezept-Raster
   *   product-click/overview-kids/<produkt>    Hinweis bei "Cook with kids"
   *   product-click/home-showcase/<produkt>    Schaufenster auf der Startseite
   *   product-click/home-grid/<produkt>        Shop-Karte in "New from the videos"
   *   krimi-click/<stelle>/<fall>              Kaufknopf (Murdernight-Link), Stelle = utm_content
   *   krimi-menu/<stelle>/<rezept>             Rezept aus einem Fall-Menü
   *   banner-click/<fall|all-cases>            Ankündigungsleiste
   *   newsletter-signup                        abgeschicktes Newsletter-Formular
   *
   * Die Zahlen stehen auf admin.html (Login über den Worker, siehe
   * worker/src/admin.js) und im GoatCounter-Dashboard. privacy.html
   * beschreibt den Dienst in Abschnitt 9 – wer hier etwas ändert, prüft dort.
   */
  tracking: {
    goatcounter: "constantinteck",

    /*
     * POSTHOG – Klickwege, Funnels, Sitzungsaufzeichnungen. Setzt Cookies und
     * lädt deshalb ERST nach "Accept" im Cookie-Banner (site.js). Leerer
     * Key = kein Banner, kein PostHog. privacy.html beschreibt es in
     * Abschnitt 9 – wer hier etwas ändert, prüft dort.
     *
     * consentVersion hochzählen, wenn sich ändert, wozu eingewilligt wird
     * (neuer Dienst, neuer Zweck): Dann fragt der Banner alle erneut.
     */
    posthog: {
      key: "phc_s4xZB9gxfa2Z9xNb9eN8nMN35tRkqDKArzZueZiziB9B",
      host: "https://eu.i.posthog.com",
      consentVersion: 1
    }
  },

  /**
   * KUNDENFOTOS – "In your kitchens" auf den Produktseiten.
   *
   * Dateinamen aus assets/img/customers/, in der Reihenfolge der Anzeige.
   * Leere Liste = der Bereich erscheint nicht. "alt" beschreibt das Bild für
   * Screenreader; "by" ist optional und steht klein unter dem Foto.
   *
   *   { file: "anna-kitchen.jpg", alt: "Anna and her son in matching aprons", by: "Anna, Hamburg" },
   *
   * Nur Fotos zeigen, deren Absender dem ausdrücklich zugestimmt hat.
   */
  customerPhotos: [
  ]
};
