/**
 * ZENTRALE EINSTELLUNGEN
 *
 * Alles, was sich ändern lässt, ohne eine einzige Seite anzufassen. Die Datei
 * wird von jeder Seite geladen; assets/js/site.js setzt die Werte um.
 */
var SITE_CONFIG = {
  /**
   * ANKÜNDIGUNGSLEISTE – der dunkle Streifen ganz oben auf jeder Seite.
   *
   * Solange "enabled" false ist oder das heutige Datum außerhalb von
   * start/end liegt, steht dort der Text aus dem HTML (das Set-Angebot).
   * Eingeschaltet ersetzt dieser Eintrag Text und Link auf allen Seiten.
   *
   * text       Text ab Tablet-Breite. {orderBy} wird durch das Datum ersetzt.
   * textShort  Kurzfassung fürs Handy – muss in eine Zeile passen (ca. 40 Zeichen).
   * orderBy    Letzter Bestelltag, so wie er dastehen soll: "18 December".
   *            Kommt {orderBy} im Text vor und ist dieses Feld leer, bleibt
   *            die Leiste beim Standardtext – nie ein Versprechen ohne Datum.
   * href       Ziel des Links, ab dem Hauptordner.
   * start/end  Erster und letzter Tag (einschließlich), "JJJJ-MM-TT".
   *            Leer = keine Grenze.
   */
  banner: {
    enabled: false,
    text: "The gift for everyone who loves to cook – order by {orderBy} for delivery before Christmas",
    textShort: "The gift for cooks · order by {orderBy}",
    orderBy: "", // TODO: letzter Bestelltag vor Weihnachten, z. B. "18 December"
    href: "shop/apron-set.html",
    start: "2026-11-01",
    end: "2026-12-24"
  },

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
   *   banner-click                             Ankündigungsleiste (nur die aus dieser Datei)
   *   newsletter-signup                        abgeschicktes Newsletter-Formular
   *
   * VOR DEM EINTRAGEN: privacy.html ergänzen – dort steht heute, dass die
   * Seite keine Analysedienste einbindet.
   */
  tracking: {
    goatcounter: "" // TODO: GoatCounter-Code
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
