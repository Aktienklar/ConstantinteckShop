import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import ProductCard from "@/components/ProductCard";
import { categoryMeta } from "@/components/CategoryBadge";
import { BagIcon, CheckIcon } from "@/components/Icons";
import { recipes, recipesByDate, recipesByPopularity } from "@/lib/recipes";
import { formatPrice, getProduct, products } from "@/lib/products";
import { shop, site } from "@/lib/site";
import TrustStrip from "@/components/TrustStrip";

/** Teased in the hero – the thing people ask about most in the videos */
const heroProduct = getProduct("linen-apron") ?? products[0];
/** Large banner further down */
const featuredProduct = getProduct("baking-book-pdf") ?? products[0];

export default function HomePage() {
  const newest = recipesByDate.slice(0, 6);
  const popular = recipesByPopularity.slice(0, 3);

  return (
    <>
      {/* Hero – the photo carries the whole section, the copy sits in its
          empty left half. Below lg the photo becomes a banner above the text,
          because there the crop leaves no room to write on. */}
      <section className="relative overflow-hidden border-b border-crust/60 bg-dough">
        <div className="relative lg:absolute lg:inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-kitchen.jpg"
            alt="Berry sorbet, mango sorbet and chocolate ice cream on a wooden table, next to bananas and a chocolate chip banana bread"
            className="aspect-[4/3] w-full object-cover object-[62%_center] sm:aspect-[16/9] lg:h-full lg:aspect-auto lg:object-center"
          />
          {/* Scrim: blends the photo into the background and keeps the
              headline readable – upwards on mobile, sideways from lg. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-dough to-transparent lg:inset-0 lg:h-full lg:bg-gradient-to-r lg:from-dough lg:via-dough/85 lg:via-52% lg:to-transparent"
          />

        </div>

        <div className="container-page relative z-10 py-10 sm:py-14 lg:py-16">
          <div className="lg:max-w-lg xl:max-w-xl">
            <p className="rise text-sm font-bold uppercase tracking-wider text-brand">
              {site.socials.map((s) => s.label).join(" · ")}
            </p>
            <h1
              style={{ animationDelay: "60ms" }}
              className="rise mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl"
            >
              {site.claim}
            </h1>
            <p
              style={{ animationDelay: "120ms" }}
              className="rise mt-4 max-w-prose text-lg text-mocha"
            >
              {site.intro}
            </p>

            <div
              style={{ animationDelay: "180ms" }}
              className="rise mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/recipes" className="btn-primary">
                All recipes
              </Link>
              <Link href="/shop" className="btn-secondary">
                Go to shop
              </Link>
            </div>

            {/* Direct entry: both recipe worlds and the shop – one tap */}
            <div
              style={{ animationDelay: "240ms" }}
              className="rise mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {(["backen", "herzhaft"] as const).map((cat) => {
                const meta = categoryMeta[cat];
                const count = recipes.filter((r) => r.category === cat).length;
                return (
                  <Link
                    key={cat}
                    href={`/recipes?category=${cat}`}
                    className={`lift-3d flex min-h-[92px] flex-col justify-between rounded-2xl border-2 bg-white p-4 ${meta.ring}`}
                  >
                    <meta.Icon className="h-7 w-7 text-cocoa/70" />
                    <span>
                      <span className="block font-bold leading-tight">
                        {meta.label}
                      </span>
                      <span className="text-sm text-mocha">
                        {count} recipes
                      </span>
                    </span>
                  </Link>
                );
              })}

              <Link
                href="/shop"
                className="lift-3d col-span-2 flex min-h-[92px] flex-col justify-between rounded-2xl border-2 border-brand bg-brandSoft p-4 sm:col-span-1"
              >
                <BagIcon className="h-7 w-7 text-brand" />
                <span>
                  <span className="block font-bold leading-tight text-brand">
                    Shop
                  </span>
                  <span className="text-sm text-mocha">
                    {products.length} products
                  </span>
                </span>
              </Link>
            </div>

            {/* The apron, flush with the tiles above it. It used to float in
                the bottom corner of the photo, where it read as a caption
                rather than the thing this page is selling. */}
            <Link
              href={`/shop/${heroProduct.slug}`}
              style={{ animationDelay: "300ms" }}
              className="lift-3d rise group mt-3 flex items-center gap-4 rounded-2xl border-2 border-crust bg-white p-4 shadow-card sm:gap-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroProduct.image}
                alt=""
                className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-brand">
                  The apron from the videos
                </span>
                <span className="mt-1 block font-display text-lg font-bold leading-snug sm:text-xl">
                  {heroProduct.title}
                </span>
                <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-xl font-bold">
                    {formatPrice(heroProduct.price)}
                  </span>
                  <span className="text-sm text-mocha">
                    incl. VAT · {shop.deliveryTime}
                  </span>
                </span>
              </span>
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-xl text-white transition duration-300 ease-soft group-hover:bg-brand/90 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* Shop – right below the hero, before the recipes */}
      <section
        aria-labelledby="shop"
        className="border-b border-crust/60 bg-white/60 py-12"
      >
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand">
                Shop
              </p>
              <h2
                id="shop"
                className="mt-1 font-display text-2xl font-bold sm:text-3xl"
              >
                Straight from my kitchen
              </h2>
              <p className="mt-2 max-w-prose text-mocha">
                The apron and the tools from the videos – plus my recipe
                collections as a PDF, downloadable right away.
              </p>
            </div>
            <Link href="/shop" className="btn-primary">
              See all products
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newest recipes */}
      <section className="container-page py-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            New from the videos
          </h2>
          <Link
            href="/recipes"
            className="whitespace-nowrap font-semibold text-brand hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newest.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      </section>

      {/* Most popular recipes */}
      <section className="border-y border-crust/60 bg-white/60 py-12">
        <div className="container-page">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Cooked the most
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing: one product, large, at the end of the page */}
      <section className="container-page py-12">
        <div className="grid items-center gap-6 rounded-3xl bg-cocoa p-6 text-cream sm:p-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-crust">
              Recipe collection
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              {featuredProduct.title}
            </h2>
            <p className="mt-3 max-w-prose text-cream/80">
              {featuredProduct.shortDescription}
            </p>

            <ul className="mt-5 space-y-2 text-cream/90">
              {featuredProduct.highlights.slice(0, 3).map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-crust" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href={`/shop/${featuredProduct.slug}`}
                className="btn-primary"
              >
                See it for {formatPrice(featuredProduct.price)}
              </Link>
              <Link
                href="/shop"
                className="font-semibold text-cream underline underline-offset-4 hover:text-crust"
              >
                All products
              </Link>
            </div>
          </div>

          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredProduct.image}
              alt=""
              loading="lazy"
              className="mx-auto w-full max-w-sm rounded-2xl object-cover shadow-card"
            />
          </div>
        </div>
      </section>
    </>
  );
}
