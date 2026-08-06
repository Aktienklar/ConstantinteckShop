# Constantinteck – website prototype

Next.js (App Router) + TypeScript + Tailwind. All content lives as TypeScript
files in the code – no CMS, no backend, no database.

The interface is in English. The **recipes themselves stay in German**, exactly
as they are written and measured in the videos – see "Language" below.

## Getting started

```bash
npm run dev
```

Then open http://localhost:3000.

Check the production build:

```bash
npm run build
```

## Pages

| URL | File |
| --- | --- |
| `/` | `app/page.tsx` |
| `/recipes` | `app/recipes/page.tsx` |
| `/recipes/[slug]` | `app/recipes/[slug]/page.tsx` |
| `/shop` | `app/shop/page.tsx` |
| `/shop/[slug]` | `app/shop/[slug]/page.tsx` |
| `/cart` | `app/cart/page.tsx` |
| `/about` | `app/about/page.tsx` |

The navigation tabs (including **Home**) are defined in one place:
`navigation` in `lib/site.ts`. `isActive()` in the same file decides which tab
is highlighted – `/` matches exactly, every other tab matches its whole section.

## Language

The UI is English; recipe data is German. Concretely:

- `lib/recipes.ts` keeps German titles, ingredients and steps. Blocks that
  render this content carry `lang="de"` so screen readers pronounce it
  correctly.
- The German keys in the data (`category: "backen" | "herzhaft"`,
  `difficulty: "einfach" | "mittel" | "anspruchsvoll"`) are **not** shown
  directly. They are translated for display by `difficultyLabel` in
  `lib/recipes.ts` and `categoryMeta` in `components/CategoryBadge.tsx`.
  Change the label there, not in the data.
- Prices are formatted with `en-IE` in `lib/products.ts` (→ `€44.90`).

## Maintaining content

Three files cover normal operation:

### 1. Recipes – `lib/recipes.ts`

One object per recipe in the `recipes` array. Fields:

- `slug` – defines the URL (`/recipes/schoko-babka`). The link you put under
  your reels/TikToks.
- `category` – `"backen"` or `"herzhaft"` (drives colour and icon)
- `image` – image URL or local path (`/recipes/babka.jpg`)
- `videoUrl` – the **embed** URL of the video. While empty, the page shows a
  placeholder box. `videoPlatform` only controls the caption.
- `prepTimeMinutes`, `difficulty`, `servings` – used in the header and in the
  filters on the overview page
- `ingredients` – `{ amount, name }`; `amount` may be omitted (e.g. "Salz")
- `steps` – one string per step, numbering happens automatically
- `linkedProductSlugs` – slugs from `lib/products.ts`; produces the
  **"What I use for this"** block on the recipe page
- `publishedAt` – ISO date, sorts "New from the videos"
- `popularity` – number, sorts "Cooked the most"

### 2. Products – `lib/products.ts`

One object per product in the `products` array. Fields:

- `type` – `"physical"` (shipping note) or `"digital"` (note "instant download
  after purchase", no shipping in the cart)
- `price` – number in euros, formatting happens automatically
- `variants` – optional, e.g. apron colours (`colorHex` tints the dot)
- `linkedRecipeSlugs` – slugs from `lib/recipes.ts`; produces the way back,
  **"Used in these recipes"**, on the product page

The recipe ↔ product link is maintained in **both files** so you can steer each
direction independently.

### 3. Brand, bio and social links – `lib/site.ts`

Name, claim, intro text, email and the social profiles. Read by header, footer,
home page and "About". The body copy of the bio sits directly in
`app/about/page.tsx`.

The same file holds `shop` – the terms shown to buyers:

| Field | Used by |
| --- | --- |
| `shippingFlatRate` | product page, cart, footer, shipping page |
| `freeShippingFrom` | announcement bar, cart nudge, footer (`null` disables it) |
| `deliveryTime`, `shipsTo` | product page, cart, terms |
| `returnDays` | trust row, cart, terms (EU minimum is 14 days) |
| `paymentMethods` | product page, cart, terms |
| `isPrototype` | shows the "not live yet" notices – set to `false` once checkout is real |

These are promises to a paying customer. Change them in `lib/site.ts` only, and
make sure each one is something you can actually honour.

## Legal pages

`/imprint`, `/privacy`, `/terms` and `/shipping-returns` exist and are linked
from the footer of every page. In Germany a shop selling to consumers needs all
four, and buyers look for them before they pay.

They are **scaffolding, not finished legal text.** Each page lists what only you
can supply (real address, VAT ID, payment and hosting providers, the statutory
withdrawal instruction) in an orange box that is visible to visitors. Fill those
in – and have the withdrawal policy and terms checked by someone qualified –
before taking real orders. The orange box disappears once you remove the
`missing` prop from the page.

## Swapping images

Right now everything points at `https://placehold.co/...` URLs. For real
photos:

1. Put files in `public/`, e.g. `public/recipes/babka.jpg`
2. Enter the path in `lib/recipes.ts` / `lib/products.ts`:
   `image: "/recipes/babka.jpg"`
3. Optionally remove the `remotePatterns` entry in `next.config.mjs`

## Colours and look

`tailwind.config.ts` holds the palette: `cream`/`dough`/`crust`/`cocoa`/`mocha`
(warm base), `sweet` (baking), `savory` (savoury) and `brand` (buttons, shop).
The mapping of colour and icon to category lives in
`components/CategoryBadge.tsx`.

## Shop on the home page

The shop is teased in four places – the order is set in `app/page.tsx`:

1. **Hero** – "Go to shop" button, a shop tile next to the two recipe worlds
   and a product card inside the image (`heroProduct`)
2. **"Straight from my kitchen"** – all products right below the hero, still
   **before** the recipes
3. **Banner at the end of the page** – one product, large (`featuredProduct`)
4. **"About"** – the product row "What I work with"

Which products appear in the hero and the banner is controlled by the two
constants at the top of `app/page.tsx` (`heroProduct`, `featuredProduct`) via
their slug.

## What the prototype deliberately leaves out

- **No payment.** The cart lives in `localStorage` (`lib/cart.tsx`), "Checkout"
  only shows a confirmation. For Stripe or Shopify, swap the click handler in
  `components/CartView.tsx` for a real checkout call, then set
  `shop.isPrototype` to `false`.
- **No real photos.** Every product and recipe image is still a
  `placehold.co` colour block. This is the biggest thing standing between the
  current site and one that looks trustworthy – see "Swapping images".
- **No login/account system.**
- **No newsletter and no mail sending.** All recipes are freely visible, no
  addresses are collected.
- **No CMS** – content stays in the code.
