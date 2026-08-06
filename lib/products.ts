import type { Product } from "./types";

/**
 * SHOP CONTENT
 * A new product = a new object in this array. `slug` must be unique.
 * Images: either a placehold.co URL or a local path like "/products/apron.jpg".
 */
export const products: Product[] = [
  {
    slug: "linen-apron",
    title: "Linen apron »Dough Love«",
    type: "physical",
    price: 44.9,
    image: "https://placehold.co/800x800/E4CFB2/3B2A20?text=Linen+Apron",
    gallery: [
      "https://placehold.co/800x800/E4CFB2/3B2A20?text=Apron+Natural",
      "https://placehold.co/800x800/D4517A/FFFFFF?text=Apron+Berry",
      "https://placehold.co/800x800/F6ECDD/3B2A20?text=Pocket+Detail",
    ],
    shortDescription:
      "The apron from my videos – heavy linen, a big pocket, softer with every wash.",
    description:
      "Exactly the apron I wear in almost every video. Made from washed linen (240 gsm), with an adjustable neck strap and a large front pocket for a dough scraper, your phone or a kitchen towel. Unisex cut, one size. Machine washable at 40 °C – chocolate and tomato sauce stains build character.",
    highlights: [
      "100 % washed linen, 240 gsm",
      "Adjustable neck strap, one size",
      "Large front pocket with a slot for the dough scraper",
      "Machine washable at 40 °C",
    ],
    variants: [
      { id: "natural", label: "Natural", colorHex: "#E4CFB2" },
      { id: "berry", label: "Berry red", colorHex: "#D4517A" },
    ],
    linkedRecipeSlugs: [
      "schoko-babka",
      "zimtschnecken-ueber-nacht",
      "kaesespaetzle",
    ],
  },
  {
    slug: "dough-scraper-set",
    title: "Dough scraper set (3 pieces)",
    type: "physical",
    price: 14.9,
    image: "https://placehold.co/800x800/F6ECDD/3B2A20?text=Scraper+Set",
    gallery: [
      "https://placehold.co/800x800/F6ECDD/3B2A20?text=Set+of+3",
      "https://placehold.co/800x800/E4CFB2/3B2A20?text=In+Use",
    ],
    shortDescription:
      "Three scrapers in different stiffnesses – for yeast dough, scraping bowls and a clean work surface.",
    description:
      "The tool people ask about most in the comments. A flexible one for scraping out bowls, a medium one for portioning yeast dough, and a stiff one with a straight edge that clears your work surface in two passes. Dishwasher safe.",
    highlights: [
      "3 stiffness levels: flexible, medium, firm",
      "Food-safe plastic, dishwasher safe",
      "One straight edge + one rounded edge",
    ],
    linkedRecipeSlugs: [
      "schoko-babka",
      "zimtschnecken-ueber-nacht",
      "bananenbrot-saftig",
    ],
  },
  {
    slug: "baking-book-pdf",
    title: "Sweet & Simple – The Baking Book (PDF)",
    type: "digital",
    price: 19.9,
    image: "https://placehold.co/800x1000/D4517A/FFFFFF?text=Baking+Book+PDF",
    gallery: [
      "https://placehold.co/800x1000/D4517A/FFFFFF?text=Cover",
      "https://placehold.co/800x1000/FBE7EE/3B2A20?text=Sample+Pages",
    ],
    shortDescription:
      "42 baking recipes as a PDF – every video recipe plus 20 you'll only find here.",
    description:
      "My complete baking repertoire in one PDF: 42 recipes, each with a photo, gram measurements, a timeline and the pitfalls I ran into myself. Optimised for a tablet in the kitchen (large type, ingredients and steps side by side) and cleanly printable on A4.",
    highlights: [
      "42 recipes, 20 of them exclusive",
      "Timelines for overnight yeast doughs",
      "Tablet-friendly + print-ready (A4)",
      "Free updates for every future edition",
    ],
    linkedRecipeSlugs: [
      "schoko-babka",
      "zimtschnecken-ueber-nacht",
      "new-york-cheesecake",
      "zitronen-blechkuchen",
      "bananenbrot-saftig",
    ],
  },
  {
    slug: "weeknight-pdf",
    title: "Weeknight Kitchen – 30 everyday dishes (PDF)",
    type: "digital",
    price: 12.9,
    image: "https://placehold.co/800x1000/4F7C4A/FFFFFF?text=Weeknight+PDF",
    gallery: [
      "https://placehold.co/800x1000/4F7C4A/FFFFFF?text=Cover",
      "https://placehold.co/800x1000/E7F1E4/3B2A20?text=Weekly+Plan",
    ],
    shortDescription:
      "30 savoury dishes under 30 minutes – with a shopping list for four weeks.",
    description:
      "For the days when cooking just has to be quick: 30 dishes that are all done in under 30 minutes, with ten ingredients at most. Plus four ready-made weekly plans including shopping lists you can simply work through at the supermarket.",
    highlights: [
      "30 recipes, all under 30 minutes",
      "10 ingredients per dish, maximum",
      "4 weekly plans with shopping lists",
      "A vegetarian alternative for every recipe",
    ],
    linkedRecipeSlugs: [
      "cremige-tomaten-pasta",
      "ofen-gnocchi-gemuese",
      "haehnchen-teriyaki-bowl",
      "linsen-dal-30-min",
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProducts(slugs: string[]): Product[] {
  return slugs
    .map((slug) => getProduct(slug))
    .filter((p): p is Product => Boolean(p));
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
