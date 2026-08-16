/**
 * VIDEOS ZU DEN REZEPTEN
 *
 * Hier – und nur hier – steht, welches Instagram-Video zu welchem Rezept
 * gehört. Eintragen heißt: die Adresse des Reels zwischen die Anführungszeichen
 * setzen, speichern, fertig. Die Rezeptseite selbst muss dafür nie angefasst
 * werden.
 *
 *   "peach-sorbet": "https://www.instagram.com/reel/DAbc123XyZ/",
 *
 * Die Adresse bekommst du in der Instagram-App über "Teilen -> Link kopieren"
 * oder im Browser aus der Adresszeile des Beitrags. Alles hinter dem Code darf
 * dranbleiben, der Rest wird ignoriert.
 *
 * Leerer Eintrag = das Rezeptfoto bleibt stehen, ohne Abspielknopf. Es geht
 * dann keine Anfrage an Instagram, und niemand klickt ins Leere.
 *
 * WICHTIG: Der Schlüssel links ist der Dateiname der Rezeptseite ohne ".html".
 * Wird ein Rezept umbenannt, gehört diese Zeile mit umbenannt.
 */
var RECIPE_VIDEOS = {
  "avocado-ice-cream"                      : "",  // Avocado Ice Cream
  "baba-ganoush"                           : "",  // Baba Ganoush
  "blueberry-sorbet"                       : "",  // Blueberry Sorbet
  "coconut-mango-sorbet"                   : "",  // Coconut Mango Sorbet
  "creamy-one-pan-salmon-pasta"            : "",  // Creamy One-Pan Salmon Pasta
  "creamy-roasted-red-pepper-tomato-pasta" : "",  // Creamy Roasted Red Pepper & Tomato Pasta
  "dragon-fruit-smoothie"                  : "",  // Dragon Fruit Smoothie
  "dragonfruit-mango-sorbet"               : "",  // Dragonfruit Mango Sorbet
  "fudgy-chocolate-raspberry-banana-bread" : "",  // Fudgy Chocolate Raspberry Banana Bread
  "grape-sorbet"                           : "",  // Grape Sorbet
  "healthy-raspberry-chocolate-nice-cream" : "",  // Healthy Raspberry Chocolate Nice Cream
  "kiwi-sorbet"                            : "",  // Kiwi Sorbet
  "lemon-sorbet"                           : "",  // Lemon Sorbet
  "mango-passionfruit-smoothie"            : "",  // Mango x Passionfruit Smoothie
  "mango-raspberry-sorbet"                 : "",  // Mango Raspberry Sorbet
  "peach-sorbet"                           : "",  // Peach Sorbet
  "pineapple-sorbet"                       : "",  // Pineapple Sorbet
  "strawberry-passion-fruit-smoothie"      : "",  // Strawberry Passion Fruit Smoothie
  "strawberry-pineapple-sorbet"            : "",  // Strawberry Pineapple Sorbet
  "strawberry-smoothie"                    : "",  // Strawberry Smoothie
  "strawberry-sorbet"                      : "",  // Strawberry Sorbet
  "thick-blueberry-chia-pudding"           : "",  // Thick Blueberry Chia Pudding
  "thick-mango-chia-pudding"               : "",  // Thick Mango Chia Pudding
  "thick-raspberry-chia-pudding"           : "",  // Thick Raspberry Chia Pudding
  "yellow-watermelon-sorbet"               : "",  // Yellow Watermelon Sorbet
};
