# Constantinteck – website prototype

Plain HTML, CSS and JavaScript. No framework, no build step, no `node_modules`:
every file in this repository is exactly what the browser receives.

To look at the site, double-click `index.html`. To edit a page, open its `.html`
file in any editor, save, reload the browser.

The interface is in English. The **recipes themselves stay in German**, exactly
as they are written and measured in the videos – see "Language" below.

## Local preview

Double-clicking the files works for everything except the recipe search, which
reads `?category=` from the URL. To see the site the way a visitor does, start a
tiny web server in this folder:

```bash
python3 -m http.server 4000
```

Then open http://localhost:4000. `python3` is already installed on macOS.

## Structure

```
index.html               Start page
recipes.html             Recipe overview with search and filters
recipes/<slug>.html      One file per recipe (10)
shop.html                Shop overview
shop/<slug>.html         One file per product (4)
cart.html                Cart
about.html               About
imprint.html  privacy.html  terms.html  shipping-returns.html
404.html                 Shown by GitHub Pages for unknown addresses

assets/css/styles.css    The entire design, one file
assets/js/               Cart, filters, buy box, share buttons
assets/img/              Images stored in this repository
```

All links are **relative** (`shop/linen-apron.html`, `../index.html`). That is
why the same files work when opened locally, on GitHub Pages in a subfolder and
later under your own domain – without changing anything.

## Editing content

There is no database and no CMS. The text you see is the text in the file.

### Changing a recipe or a product

Open the file (e.g. `recipes/schoko-babka.html`), change the text, save. Titles,
ingredients, steps and prices are plain HTML.

**One thing to watch:** a product's price and title appear in two places – in
its `shop/<slug>.html` **and** in `assets/js/shop-data.js`, which is what the
cart uses to add things up. Change both, otherwise the cart shows a different
price than the product page.

### Adding a recipe

1. Copy an existing recipe file, e.g.
   `cp recipes/bananenbrot-saftig.html recipes/mein-rezept.html`
2. Edit the text in the new file: title (three places – `<title>`, the
   `og:title` meta tag and the `<h1>`), teaser, time, servings, ingredients,
   steps.
3. Add a card for it in `recipes.html`. Copy an existing
   `<a class="card recipe-card …>` block and adjust it. The four `data-`
   attributes on that card drive the search and the filters:

   | Attribute | Meaning |
   | --- | --- |
   | `data-category` | `backen` or `herzhaft` – decides colour and icon |
   | `data-minutes` | preparation time, used by the time filter |
   | `data-difficulty` | `einfach`, `mittel` or `anspruchsvoll` |
   | `data-search` | everything the search should find, in lower case |

4. Optionally link it from the start page (`index.html`) and update the recipe
   counts on the two tiles there.

### Adding a product

1. Copy an existing product file in `shop/` and edit it.
2. Add an entry to `SHOP_PRODUCTS` in `assets/js/shop-data.js` – without it the
   cart cannot price the product.
3. Add a card for it in `shop.html`, and wherever else it should appear.

## Language

The UI is English; recipe content is German. Blocks holding German text carry
`lang="de"` so screen readers pronounce it correctly. The German keys used in
the filter attributes (`backen`/`herzhaft`, `einfach`/`mittel`/`anspruchsvoll`)
are never shown to visitors – the visible labels next to them are English.

Prices are written as `€44.90`. The cart formats the same way, via
`formatPrice()` in `assets/js/shop-data.js`.

## Shop terms

`SHOP_TERMS` in `assets/js/shop-data.js` holds shipping cost, free-shipping
threshold, delivery time, return window, payment methods and the `isPrototype`
switch. The cart reads these values; the same statements are also written out in
the HTML of the product pages, the trust row and the legal pages.

These are promises to a paying customer. Make sure each one is something you can
actually honour, and keep the JavaScript values and the HTML text in agreement.

`isPrototype: true` is what produces the "this shop is not live yet" notices.
Set it to `false` – and remove the matching sentences from the footer and the
product pages – once a real checkout is connected.

## Legal pages

`imprint.html`, `privacy.html`, `terms.html` and `shipping-returns.html` exist
and are linked from the footer of every page. In Germany a shop selling to
consumers needs all four, and buyers look for them before they pay.

They are **scaffolding, not finished legal text.** Each page lists what only you
can supply (real address, VAT ID, payment and hosting providers, the statutory
withdrawal instruction) in an orange box that is visible to visitors. Fill those
in – and have the withdrawal policy and terms checked by someone qualified –
before taking real orders. Delete the `<aside class="legal__missing">` block to
remove the box.

## Swapping images

Right now everything points at `https://placehold.co/...` URLs. For real photos:

1. Put the file in `assets/img/`, e.g. `assets/img/babka.jpg`
2. Replace the URL in the `src` attribute with the relative path –
   `assets/img/babka.jpg` from a root page, `../assets/img/babka.jpg` from a
   page inside `recipes/` or `shop/`

The hero photo on the start page is already a local file
(`assets/img/hero-kitchen.jpg`).

## Colours and look

The whole design lives in `assets/css/styles.css`. The palette sits at the top
of that file as CSS variables – `--cream`, `--dough`, `--crust`, `--cocoa`,
`--mocha` (warm base), `--sweet` (baking), `--savory` (savoury) and `--brand`
(buttons, shop). Change a value there and it applies across the whole site.

## Publishing

```bash
./deploy.sh "Neues Rezept ergänzt"
```

The script checks that no link points at a missing file, then commits and
pushes. A GitHub Action copies the site to the `gh-pages` branch, which is what
GitHub Pages serves.

One known limit: GitHub Pages serves `404.html` for any unknown address. At a
deep address (e.g. `/shop/typo`) the relative paths in that file no longer find
the stylesheet, so the page appears unstyled but still readable.

## What the prototype deliberately leaves out

- **No payment.** The cart lives in `localStorage` (`assets/js/cart.js`),
  "Checkout" only shows a confirmation. For Stripe or Shopify, replace the
  `data-checkout` click handler in `assets/js/cart-page.js` with a real checkout
  call, then set `isPrototype` to `false`.
- **No real photos.** Every product and recipe image is still a `placehold.co`
  colour block. This is the biggest thing standing between the current site and
  one that looks trustworthy – see "Swapping images".
- **No videos yet.** Each recipe page shows a placeholder box with the right
  aspect ratio. Replace it with the platform's `<iframe>` embed code and the
  layout will not shift.
- **No login/account system.**
- **No newsletter and no mail sending.** All recipes are freely visible, no
  addresses are collected.
