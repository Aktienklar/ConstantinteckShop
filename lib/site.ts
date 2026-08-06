/**
 * Brand / persona in one place.
 * Name, claim and social links live here – read by header, footer,
 * home page and "About".
 */
export const site = {
  name: "Constantinteck",
  shortName: "Constantin",
  claim: "The recipes from my videos – without the endless scrolling.",
  intro:
    "Every recipe from my reels and TikToks: ingredients up top, steps below, no life story in between. Sweet bakes on the weekend, uncomplicated everyday food during the week.",
  /** Used for share links and metadata. Swap for the real domain later. */
  url: "https://constantinteck.example",
  email: "hello@constantinteck.example",
  socials: [
    { label: "Instagram", handle: "@constantinteck", href: "https://instagram.com" },
    { label: "TikTok", handle: "@constantinteck", href: "https://tiktok.com" },
    { label: "YouTube", handle: "Constantinteck", href: "https://youtube.com" },
  ],
} as const;

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/recipes", label: "Recipes" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
] as const;

/**
 * SHOP TERMS – shown on the product page, in the cart and in the footer.
 *
 * These are promises to a paying customer, so every value here has to match
 * what you can actually deliver. Check each one before going live; they are
 * deliberately in one place so you only change them once.
 */
export const shop = {
  /** Flat shipping rate within Germany, in euros. Also used by the cart. */
  shippingFlatRate: 4.9,
  /** Order value from which shipping is free. `null` = no free-shipping tier. */
  freeShippingFrom: 60,
  deliveryTime: "2–4 working days",
  shipsTo: "Germany and Austria",
  /** Statutory minimum in the EU is 14 days. Do not go below it. */
  returnDays: 14,
  /** Adjust to the methods your payment provider actually offers. */
  paymentMethods: ["PayPal", "Credit card", "Instant bank transfer"],
  /**
   * Turn to `false` as soon as a real checkout is connected. While `true`,
   * the site says everywhere that no real order is placed – without that
   * notice the shop would take orders it cannot fulfil.
   */
  isPrototype: true,
} as const;

/**
 * Legal pages. In Germany a shop selling to consumers must carry an imprint,
 * a privacy policy, terms and a withdrawal policy – missing pages are both a
 * legal risk and the first thing a cautious buyer checks.
 */
export const legalNavigation = [
  { href: "/shipping-returns", label: "Shipping & returns" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/imprint", label: "Imprint" },
] as const;

/** "/" must match exactly, every other tab matches its whole section. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
