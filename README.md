# Constantinteck – website prototype

> **Seit 29.10.2026:** Hauptprodukt sind die 9 Murder-Mystery-Dinner
> (je €8.99, PDF, Kauf über murdernight.store). Rezepte bleiben kostenlos und
> sind der Weg dorthin, die Schürzen stehen nachrangig im Shop.
> Positionierung: „Cook the menu. Solve the case.“ Alles zu den Fällen steht
> in **`data/cases.json`** – siehe „Murder mystery dinners“ unten.

> **Stand seit 28.10.2026:** Schürzen und Krimi-Dinner sind wieder beide auf
> der Seite. Die Schürzen-Fotos sind die finalen (Sand, Grey, Mauve); die
> Galerie einer Produktseite zeigt die Fotos der gewählten Farbe
> (`data-colour` an den Vorschaubildern, siehe `assets/js/gallery.js`).
> Vom 27. bis 28.10.2026 gab es kurz nur Krimi-Dinner (Commit `80f6334`);
> der Stand davor liegt im Git-Tag `schuerzen-stand-2026-10-27`.

Plain HTML, CSS and JavaScript. No framework, no build step, no `node_modules`:
every file in this repository is exactly what the browser receives.

To look at the site, double-click `index.html`. To edit a page, open its `.html`
file in any editor, save, reload the browser.

The whole site is in English – interface and recipes. Comments in the code are
German.

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
recipes/<slug>.html      One file per recipe (30)
shop.html                Shop overview
shop/<slug>.html         One file per product (3)
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

**One thing to watch:** a product's price and title appear in three places – in
its `shop/<slug>.html`, in `assets/js/shop-data.js` (what the cart adds up) and
in `worker/src/catalog.js` (what the customer is actually charged, in cents).
Change all three, otherwise the shop shows one price and bills another.

### Adding the video to a recipe

Open `assets/js/recipe-data.js`, find the recipe's line and paste the link
between the quotation marks of `video`:

```js
"peach-sorbet": { order: 12, video: "https://www.instagram.com/reel/DAbc123XyZ/" },
```

That is the whole job – the recipe page itself is never touched. Get the link
from the app via *Share → Copy link*, or from the address bar. Anything after
the code (`?igsh=…`) may stay.

- **Instagram** links play on the page after one click.
- **TikTok / YouTube** links turn the photo into a plain link that opens the
  video there in a new tab. Nothing from those providers is embedded – embedding
  them would need sections 2 and 7 of `privacy.html` extended first.
- Empty = the recipe photo stays put without a play button, and nothing is
  requested from anyone.

**Why the player only loads on click.** Until someone presses play, the page
shows nothing but our own photo. A permanently embedded player would load Meta
code and set cookies for every visitor, including those who never watch – in
Germany that needs consent before it loads, which means a banner. The click is
the consent, so there is none. Section 2 and section 7 of `privacy.html`
describe exactly this behaviour; if the player is ever wired to load on page
load, both sections become false and a consent banner has to come first.

### Settings in one place

Two files hold everything that can be changed without touching a page:

| File | What it controls |
| --- | --- |
| `assets/js/recipe-data.js` | Per recipe: `order` (the three highest appear under "From the latest videos"), `video`, and optionally `featuredProduct` / `productNote` for the product card on the recipe page |
| `assets/js/site-config.js` | Newsletter box, GoatCounter code, customer photos (the announcement bar now comes from `data/cases.json`) |

Everything in `site-config.js` ships switched off or empty; the comments in the
file say what each field does and what has to happen in `privacy.html` before
switching it on.

**Product card on a recipe page.** Without `featuredProduct`, sweet recipes of
15 minutes or less show the kids' apron ("make it together"), everything
else the adult apron. The rule lives in `assets/js/recipe-product.js`.

**Shop cards in the recipe list.** `assets/js/recipes-overview.js` inserts one
after every sixth recipe (murder mystery and apron in turn) and hides them
while a search or filter is active. The row *From the latest videos* on
`recipes.html` is written by `tools/cases.py` (highest `order`).

**Product card on a recipe page** now sits below the method; directly after
the ingredients comes the murder mystery box (see below).

**Customer photos.** Put the image into `assets/img/customers/` and add its file
name to `customerPhotos` in `site-config.js`. Empty list = no section.

### Adding a recipe

1. Copy an existing recipe file, e.g.
   `cp recipes/bananenbrot-saftig.html recipes/mein-rezept.html`
2. Edit the text in the new file: the `<h1>`, teaser, time, servings,
   ingredients, steps. The search-engine title and description go into
   `tools/seo-pages.json` (one entry per page, title 50–60 characters,
   description 140–160); `deploy.sh` writes them into the page head, together
   with canonical and share preview, and adds the page to `sitemap.xml`.
3. Add a card for it in `recipes.html`. Copy an existing
   `<a class="card recipe-card …>` block and adjust it. The four `data-`
   attributes on that card drive the search and the filters:

   | Attribute | Meaning |
   | --- | --- |
   | `data-category` | `backen` or `herzhaft` – decides colour and icon |
   | `data-minutes` | preparation time, used by the time filter |
   | `data-difficulty` | `einfach`, `mittel` or `anspruchsvoll` |
   | `data-search` | everything the search should find, in lower case |

4. Add a line for it in `assets/js/recipe-data.js` with the next higher
   `order`, and set `data-slug`, `data-category` and `data-minutes` on the
   `data-recipe-product` block in the new recipe file.
5. Add its slug to the `recipes` list of one case in `data/cases.json` (the
   box after the ingredients points there), optionally use it in a `menu`.
   The start page picks it up under *New from the videos* by its `order`.

### Adding a product

1. Copy an existing product file in `shop/` and edit it.
2. Add an entry to `SHOP_PRODUCTS` in `assets/js/shop-data.js` – without it the
   cart cannot price the product.
3. Add the same product to `PRODUCTS` in `worker/src/catalog.js`, with the price
   **in cents**. Without it the checkout rejects the product; if the amount
   disagrees with step 2, the customer is charged something other than what the
   cart showed them.
4. Add a card for it in `shop.html`, and wherever else it should appear.

### Bundles

A bundle is an ordinary product with its own price, not a discount rule – see
`apron-set`. Nothing in the cart or the checkout adds two items together, so a
bundle can never cost something different depending on the order things were
added in. The trade-off: the price of the bundle does **not** follow the prices
of its parts. Change €44.90 or €34.90 and you have to decide what €74.90
becomes – in `shop-data.js`, `worker/src/catalog.js` and the pages that print
it (`shop/apron-set.html`, `shop.html`, `index.html`, `about.html`, and the
announcement bar on every page).

Because one product has only one list of variants, the set asks for the two
colours as one combined choice (`natural-berry` = adult Natural, kids Berry).
Four combinations still fit on a phone; with a third colour there would be
nine, and the buy box would need two separate choices instead of one list.

## Murder mystery dinners (Krimi-Dinner)

The main product since 29 October 2026. The games are sold at Murdernight,
**not here** – this site advertises them and links out. No cart, no checkout,
nothing in `shop-data.js` or `worker/`.

```
data/cases.json                      THE source: cases, prices, URLs, UTM, menus, recipe → case
tools/cases.py                       Writes everything below from it (deploy.sh runs it first)
murder-mystery/<id>.html             One page per case (generated – do not edit)
krimi-dinner.html                    Overview; the case cards between <!-- Fallkarten --> markers
assets/js/krimi-dinner-data.js       Data block for the filters (generated) + labels
assets/js/krimi-dinner.js            Filters, preview pages, reviews (browser only)
tools/krimi-images.py                Cover WebPs and share images (og) – run once per new cover
```

**Change a case, a price, a teaser or a menu:** edit `data/cases.json`, then
`python3 tools/cases.py` (or just `./deploy.sh`). It rewrites, on every page:
navigation (Murder Mystery first), the announcement bar, the footer column
with all cases; plus the cards on `krimi-dinner.html`, the start page blocks
(hero covers, *Pick your evening*, example menu, *New from the videos*,
reviews), the box *Hosting a dinner?* on every recipe page, the case pages
and the strips on `recipes.html` / `shop.html`. Anything between
`<!-- … (geschrieben von tools/cases.py …) -->` markers is overwritten.

Teasers (shortened) and characters come from the case pages on murdernight.store
(29 Oct 2026). Fields per case are explained in `_fields` at the top of the JSON. Empty
`teaser`, `roles` or `menu` courses don't show on the page; they appear as
`<!-- TODO … -->` in the HTML and the script lists them.

- **Recipe → case:** every recipe slug sits in exactly one case's `recipes`
  list – that case is shown in the box after the ingredients. The script
  stops with an error if a recipe is listed twice or does not exist, and
  warns about recipes that aren't assigned.
- **Seasonal:** `seasonal: [11, 12]` – in those months (visitor's date,
  `assets/js/site.js`) the announcement bar advertises that case, it moves to
  the front on `krimi-dinner.html` and joins *Pick your evening*.
- **Start page:** `home.picks`, `home.exampleMenu`, `home.heroCovers`.
- **Reviews / photos:** `social` – only real ones, with consent. Empty = no
  section.

### Links to Murdernight and utm_content

Every link to Murdernight is built by `mn_url()` in `tools/cases.py`:
`utm_source=constantinteck` (must never be missing – agreed with
Murdernight), `utm_medium=website`, `utm_campaign=krimi-dinner`
(`krimi-dinner-rezept` from recipe pages) and **`utm_content` = where the
button sits**:

| utm_content | Button |
| --- | --- |
| `home-pick` | *Pick your evening* on the start page |
| `home-menu` | Example menu on the start page |
| `krimi-card` | Case card on `krimi-dinner.html` |
| `closing-cta` | *All cases at Murdernight* on `krimi-dinner.html` |
| `case-page-hero` / `case-page-bottom` | Case page, top / bottom |
| `recipe-box` | *Hosting a dinner?* box on a recipe page |
| `schema` | Offer URL in the Product schema |

Navigation, announcement bar, footer, strips and the recipe grid card lead to
the site's own pages first. They carry `data-via="nav"` (`banner`, `footer`,
`recipes-strip`, `shop-strip`, `recipes-grid`, `home-hero`, …); `site.js`
remembers the last one for this tab and appends it to the buy buttons on the
overview and case pages: `utm_content=case-page-hero--from-footer`. So
Murdernight's stats show both the button and the way in.

### Share images

`python3 tools/krimi-images.py` writes the WebP sizes for every cover, the
collage `og-krimi-dinner.jpg` (start page and overview) and one
`assets/img/krimi/og/<id>.jpg` per case (1200 × 630, cover uncropped on a
blurred version of itself). Needs Pillow; only needed for new covers.

## Language

UI and recipes are English. The German keys used in the filter attributes
(`backen`/`herzhaft`, `einfach`/`mittel`/`anspruchsvoll`) are never shown to
visitors – the visible labels next to them are English.

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
Leave it `true` while the worker runs on `sk_test_` keys: a real Stripe checkout
opens, but no money moves. Set it to `false` – and remove the matching sentences
from the footer and the product pages – only once live keys are in place and the
legal pages below are finished.

The `paymentMethods` list must match what is actually switched on in the Stripe
Dashboard. It previously advertised "Instant bank transfer" (Sofort), which
Stripe has since retired.

## Payment (Stripe)

The website itself stays static. Payment needs one thing a static site cannot
have: a **secret Stripe key**, which must never reach the browser. GitHub Pages
serves every file in this repository, so a key in the page source would be
public. That is the only reason `worker/` exists.

```
worker/src/catalog.js    Prices the checkout actually trusts
worker/src/checkout.js   Cart  ->  Stripe Checkout Session
worker/src/webhook.js    Payment confirmed  ->  email with the download link
worker/src/download.js   Signed, expiring PDF links
```

**The browser never sends a price.** It sends only slug, variant and quantity;
`catalog.js` looks up what those cost. Otherwise anyone could order the apron
for one cent by editing the cart in their developer tools. This means a price
now lives in **three** places – the product's HTML, `assets/js/shop-data.js`
and `worker/src/catalog.js`. All three must agree.

### One-time setup

```bash
cd worker
npm install
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put DOWNLOAD_SECRET          # openssl rand -base64 32
wrangler secret put RESEND_API_KEY           # optional
wrangler deploy
```

Only the two aprons and the set are on sale, so R2 and KV are not needed. Should a recipe
collection as a PDF come back, add these before it goes live – and uncomment
the matching blocks in `worker/wrangler.toml`:

```bash
wrangler r2 bucket create constantinteck-pdfs
wrangler kv namespace create ORDERS          # ID in wrangler.toml eintragen
wrangler r2 object put constantinteck-pdfs/<file>.pdf --file=...
```

Then put the deployed address into `WORKER_BASE` in `worker/wrangler.toml` and
into `SHOP_CHECKOUT.endpoint` in `assets/js/shop-data.js`, and register
`<address>/api/webhook` in the Stripe Dashboard for the events
`checkout.session.completed` and `checkout.session.async_payment_succeeded`.

### Testing locally

`npx wrangler dev` in `worker/` and `python3 -m http.server 4000` in the root.
The storefront notices `localhost` and talks to port 8787 instead of the
deployed worker. Forward the webhook with
`stripe listen --forward-to localhost:8787/api/webhook`. Card `4242 4242 4242
4242` completes a test payment. Without a `RESEND_API_KEY` no mail is sent –
the download link appears in the `wrangler dev` log instead.

### Things that are easy to get wrong

- **Fulfilment happens in the webhook, never on the success page.** That page
  can be opened without paying, and a buyer may close the tab before reaching
  it.
- **`.dev.vars` must never be committed.** It is in `.gitignore`; `deploy.sh`
  runs `git add -A`, so a slip would publish your secret key.
- **`AUTOMATIC_TAX` stays `"false"`** until a tax registration and a head
  office address exist in the Stripe Dashboard. Before that, every session
  errors out.
- The PDFs use tax code `txcd_10302000` (digital books), which is what gets
  them Germany's reduced 7 % VAT rate instead of 19 %.

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

## Search engines (generated, not hand-edited)

`deploy.sh` runs two scripts before it checks the links:

- `tools/seo.py` rewrites the block from `<title>` to `<!-- /Vorschau -->` in
  every page (title and description from `tools/seo-pages.json`, canonical,
  Open Graph) and regenerates `sitemap.xml`, with `lastmod` taken from Git.
  Edit the JSON, not the page head – the next deploy would overwrite it.
- `tools/images.py` creates an `.avif` next to every JPEG in `assets/img/`
  (plus a `-480.avif` for photos 800 px and wider), wraps the `<img>` tags in
  `<picture>` and adds `width`/`height`. The JPEG stays the original and the
  fallback. The product gallery is left alone because `gallery.js` swaps its
  `src`. Needs macOS (`sips`).

- `tools/blocks.py` runs first. It writes the author box onto every recipe
  page, builds the recipe collections `collections/<slug>.html` from
  `tools/collections.json` (a recipe joins a collection when the `match`
  pattern fits its name or one of its tags in `recipes.html`), puts the row
  of collection links on `recipes.html` and writes `llms.txt`.

All three can be run by hand (`python3 tools/seo.py`) and change nothing when run twice.

## Swapping images

Right now everything points at `https://placehold.co/...` URLs. For real photos:

1. Put the file in `assets/img/`, e.g. `assets/img/babka.jpg`
2. Replace the URL in the `src` attribute with the relative path –
   `assets/img/babka.jpg` from a root page, `../assets/img/babka.jpg` from a
   page inside `recipes/` or `shop/`

The hero on the start page shows three murder mystery covers
(`home.heroCovers` in `data/cases.json`). The former recipe wall
(`assets/img/wall/`, `assets/js/hero-wall.js`) is no longer used.

## Colours and look

The whole design lives in `assets/css/styles.css`. The palette sits at the top
of that file as CSS variables – `--cream`, `--dough`, `--crust`, `--cocoa`,
`--mocha` (warm base), `--sweet` (baking), `--savory` (savoury) and `--brand`
(buttons, shop). Change a value there and it applies across the whole site.

## Publishing

```bash
./deploy.sh "Neues Rezept ergänzt"
```

The script checks that no link points at a missing file, then commits and pushes
to `main`. GitHub Pages serves `main` directly – what is in the repository is
what visitors get, so there is no build and no second branch involved.

One known limit: GitHub Pages serves `404.html` for any unknown address. At a
deep address (e.g. `/shop/typo`) the relative paths in that file no longer find
the stylesheet, so the page appears unstyled but still readable.

## What the prototype deliberately leaves out

- **No real photos.** Every product and recipe image is still a `placehold.co`
  colour block. This is the biggest thing standing between the current site and
  one that looks trustworthy – see "Swapping images".
- **No videos yet.** Each recipe page shows a placeholder box with the right
  aspect ratio. Replace it with the platform's `<iframe>` embed code and the
  layout will not shift.
- **No login/account system.**
- **No newsletter and no mail sending.** All recipes are freely visible, no
  addresses are collected.
