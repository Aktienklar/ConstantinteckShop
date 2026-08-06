import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${site.shortName} – who is behind the recipes and where else you can find me.`,
};

export default function AboutPage() {
  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://placehold.co/600x600/E4CFB2/3B2A20?text=Portrait"
            alt={`${site.shortName} in the kitchen`}
            className="aspect-square w-full rounded-3xl object-cover shadow-card"
          />
        </div>

        <div className="lg:col-span-2">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Hi, I&apos;m {site.shortName}.
          </h1>

          <div className="mt-4 space-y-4 text-lg leading-relaxed text-mocha">
            <p>
              It all started with a yeast dough that refused to rise. Instead of
              giving up I repeated it thirty times and filmed the whole thing –
              today a few hundred thousand people watch me bake on Sundays and
              cook something quick during the week.
            </p>
            <p>
              This site exists because every other comment asks for the recipe.
              Here it is: ingredients up top, steps below, no half a life story
              in front of it.
            </p>
            <p>
              Weekends are for bakes that take some ambition – babka,
              cheesecake, overnight yeast doughs. During the week I cook like
              everyone else: fast, with whatever is around, usually in one pan.
              You&apos;ll find both here, cleanly separated.
            </p>
            <p className="text-base">
              A note on language: the site is in English, but the recipes
              themselves stay in German – exactly as they are written and
              measured in the videos.
            </p>
          </div>

          <h2 className="mt-8 font-display text-2xl font-bold">
            Where to find me
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {site.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="lift-3d flex min-h-[72px] flex-col justify-center rounded-2xl border-2 border-crust bg-white px-4 hover:border-brand"
                >
                  <span className="font-bold">{social.label}</span>
                  <span className="text-sm text-mocha">{social.handle}</span>
                </a>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-2xl font-bold">Work with me</h2>
          <p className="mt-2 text-mocha">
            For collaborations and enquiries:{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-semibold text-brand hover:underline"
            >
              {site.email}
            </a>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/recipes" className="btn-primary">
              Go to the recipes
            </Link>
            <Link href="/shop" className="btn-secondary">
              Go to shop
            </Link>
          </div>
        </div>
      </div>

      {/* What I use is available to take home right away */}
      <section aria-labelledby="shop-teaser" className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="shop-teaser" className="font-display text-2xl font-bold">
            What I work with
          </h2>
          <Link
            href="/shop"
            className="whitespace-nowrap font-semibold text-brand hover:underline"
          >
            Go to shop
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
