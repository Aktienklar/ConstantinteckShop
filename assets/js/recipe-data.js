/**
 * REZEPT-DATEN
 *
 * Alles, was sich pro Rezept einstellen lässt, ohne die Rezeptseite selbst
 * anzufassen. Eine Zeile je Rezept:
 *
 *   "peach-sorbet": { order: 12, video: "https://www.instagram.com/reel/DAbc123XyZ/" },
 *
 * order   Reihenfolge für "From the latest videos" auf recipes.html: Die drei
 *         höchsten Zahlen stehen dort oben. Ein neues Rezept bekommt einfach
 *         die nächsthöhere Zahl.
 *
 * video   Adresse des Videos. Die Adresse bekommst du in der App über
 *         "Teilen -> Link kopieren"; alles hinter dem Code darf dranbleiben.
 *           Instagram  – wird nach einem Klick direkt auf der Seite abgespielt.
 *           TikTok / YouTube – der Abspielknopf öffnet das Video dort in einem
 *                        neuen Tab (ein gewöhnlicher Link, siehe privacy.html
 *                        Abschnitt 7; eingebettet wird nur Instagram).
 *         Leer = das Rezeptfoto bleibt stehen, ohne Abspielknopf.
 *
 * WICHTIG: Der Schlüssel links ist der Dateiname der Rezeptseite ohne ".html".
 * Wird ein Rezept umbenannt, gehört diese Zeile mit umbenannt.
 */
var RECIPES = {
  "creamy-sucuk-carbonara"                : { order: 30, video: "" },  // Creamy Sucuk Carbonara
  "cheesy-roasted-chicken-wrap"           : { order: 29, video: "" },  // Cheesy Roasted Chicken Wrap
  "peanut-spicy-udon"                     : { order: 28, video: "" },  // Peanut Spicy Udon
  "chocolate-banana-ice-cream"            : { order: 27, video: "" },  // Chocolate Banana Ice Cream
  "granola-berry-smoothie-bowl"           : { order: 26, video: "" },  // Granola Berry Smoothie Bowl
  "creamy-one-pan-salmon-pasta"           : { order: 25, video: "" },  // Creamy One-Pan Salmon Pasta
  "thick-blueberry-chia-pudding"          : { order: 24, video: "" },  // Thick Blueberry Chia Pudding
  "avocado-ice-cream"                     : { order: 23, video: "" },  // Avocado Ice Cream
  "dragonfruit-mango-sorbet"              : { order: 22, video: "" },  // Dragonfruit Mango Sorbet
  "thick-raspberry-chia-pudding"          : { order: 21, video: "" },  // Thick Raspberry Chia Pudding
  "thick-mango-chia-pudding"              : { order: 20, video: "" },  // Thick Mango Chia Pudding
  "fudgy-chocolate-raspberry-banana-bread": { order: 19, video: "" },  // Fudgy Chocolate Raspberry Banana Bread
  "strawberry-pineapple-sorbet"           : { order: 18, video: "" },  // Strawberry Pineapple Sorbet
  "dragon-fruit-smoothie"                 : { order: 17, video: "" },  // Dragon Fruit Smoothie
  "mango-raspberry-sorbet"                : { order: 16, video: "" },  // Mango Raspberry Sorbet
  "healthy-raspberry-chocolate-nice-cream": { order: 15, video: "" },  // Healthy Raspberry Chocolate Nice Cream
  "baba-ganoush"                          : { order: 14, video: "" },  // Baba Ganoush
  "strawberry-passion-fruit-smoothie"     : { order: 13, video: "" },  // Strawberry Passion Fruit Smoothie
  "yellow-watermelon-sorbet"              : { order: 12, video: "" },  // Yellow Watermelon Sorbet
  "grape-sorbet"                          : { order: 11, video: "" },  // Grape Sorbet
  "lemon-sorbet"                          : { order: 10, video: "" },  // Lemon Sorbet
  "coconut-mango-sorbet"                  : { order:  9, video: "" },  // Coconut Mango Sorbet
  "strawberry-smoothie"                   : { order:  8, video: "" },  // Strawberry Smoothie
  "strawberry-sorbet"                     : { order:  7, video: "" },  // Strawberry Sorbet
  "blueberry-sorbet"                      : { order:  6, video: "" },  // Blueberry Sorbet
  "pineapple-sorbet"                      : { order:  5, video: "" },  // Pineapple Sorbet
  "creamy-roasted-red-pepper-tomato-pasta": { order:  4, video: "" },  // Creamy Roasted Red Pepper & Tomato Pasta
  "kiwi-sorbet"                           : { order:  3, video: "" },  // Kiwi Sorbet
  "peach-sorbet"                          : { order:  2, video: "" },  // Peach Sorbet
  "mango-passionfruit-smoothie"           : { order:  1, video: "" },  // Mango x Passionfruit Smoothie
};
