/**
 * ZENTRALE EINSTELLUNGEN
 *
 * Alles, was sich ändern lässt, ohne eine einzige Seite anzufassen. Die Datei
 * wird von jeder Seite geladen; assets/js/site.js setzt die Werte um.
 */
var SITE_CONFIG = {
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
