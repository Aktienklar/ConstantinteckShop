import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import TrustStrip from "@/components/TrustStrip";
import { BagIcon, DownloadIcon } from "@/components/Icons";
import { products } from "@/lib/products";
import { shop } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "The apron from the videos, the dough scraper set and my recipe collections as a PDF for instant download.",
};

export default function ShopPage() {
  const physical = products.filter((p) => p.type === "physical");
  const digital = products.filter((p) => p.type === "digital");

  return (
    <>
      {/* Coloured band, so the page opens with something other than a
          headline on an empty background. */}
      <section className="border-b border-crust/60 bg-dough">
        <div className="container-page py-10 sm:py-14">
          <p className="rise text-sm font-bold uppercase tracking-wider text-brand">
            Shop
          </p>
          <h1
            style={{ animationDelay: "60ms" }}
            className="rise mt-2 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-5xl"
          >
            Everything I use in the videos.
          </h1>
          <p
            style={{ animationDelay: "120ms" }}
            className="rise mt-4 max-w-prose text-lg text-mocha"
          >
            The apron and the tools you keep asking about in the comments – plus
            my recipe collections as a PDF, in your inbox the moment you order.
          </p>
        </div>
      </section>

      <TrustStrip />

      <div className="container-page py-10 sm:py-14">
        <ShopSection
          id="physical"
          Icon={BagIcon}
          title="For the kitchen"
          hint={`Shipped to ${shop.shipsTo} in ${shop.deliveryTime}.`}
          products={physical}
        />

        <ShopSection
          id="digital"
          Icon={DownloadIcon}
          title="Recipe collections (PDF)"
          hint="Instant download after purchase – no waiting, no shipping."
          products={digital}
        />

        {/* Way back to the content the products come from */}
        <section className="mt-14 grid items-center gap-6 rounded-3xl bg-cocoa p-6 text-cream sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Not sure yet?
            </h2>
            <p className="mt-2 max-w-prose text-cream/80">
              Every recipe on this site is free and always will be. Have a look
              at what the apron and the scrapers actually get used for.
            </p>
          </div>
          <Link href="/recipes" className="btn-primary lift">
            Browse the recipes
          </Link>
        </section>
      </div>
    </>
  );
}

function ShopSection({
  id,
  Icon,
  title,
  hint,
  products: items,
}: {
  id: string;
  Icon: (props: { className?: string }) => JSX.Element;
  title: string;
  hint: string;
  products: typeof products;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={id} className="mt-12 first:mt-0">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brandSoft text-brand">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h2 id={id} className="font-display text-2xl font-bold">
            {title}
          </h2>
          <p className="text-sm text-mocha">{hint}</p>
        </div>
      </div>

      {/* Fixed three columns. Letting the count drive the columns made a
          two-product section blow the cards up to half the screen. */}
      <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3">
        {items.map((product, index) => (
          <div
            key={product.slug}
            style={{ animationDelay: `${index * 70}ms` }}
            className="rise h-full"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
