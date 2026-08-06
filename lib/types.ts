/**
 * Central data types of the prototype.
 * Content lives as TypeScript arrays in lib/recipes.ts and lib/products.ts
 * so it can be maintained in code without a backend or CMS.
 */

export type Category = "backen" | "herzhaft";
export type Difficulty = "einfach" | "mittel" | "anspruchsvoll";
export type ProductType = "physical" | "digital";

export interface Ingredient {
  /** e.g. "250 g" or "1 EL" – may stay empty (e.g. "Salz") */
  amount?: string;
  name: string;
}

export interface Recipe {
  slug: string;
  title: string;
  category: Category;
  /** Short teaser for cards and the meta description */
  excerpt: string;
  image: string;
  /** Embed URL (YouTube/TikTok/Instagram). Leave empty -> placeholder box is shown. */
  videoUrl: string;
  videoPlatform?: "youtube" | "tiktok" | "instagram";
  prepTimeMinutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  /** Slugs from lib/products.ts -> produces the "What I use for this" block */
  linkedProductSlugs: string[];
  tags: string[];
  /** ISO date, drives the "newest first" sorting */
  publishedAt: string;
  /** For the "popular" sorting on the home page */
  popularity: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  /** Hex value for the colour dot in the UI */
  colorHex?: string;
}

export interface Product {
  slug: string;
  title: string;
  type: ProductType;
  /** Price in euros (gross) */
  price: number;
  image: string;
  /** Further images for the gallery on the product page */
  gallery?: string[];
  /** One sentence for cards and cross-selling blocks */
  shortDescription: string;
  description: string;
  highlights: string[];
  variants?: ProductVariant[];
  /** Slugs from lib/recipes.ts -> back link product -> recipe/video */
  linkedRecipeSlugs: string[];
}

export interface CartLine {
  productSlug: string;
  variantId?: string;
  quantity: number;
}
