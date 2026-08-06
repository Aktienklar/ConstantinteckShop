import Link from "next/link";
import { formatPrice, getProducts } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";

/**
 * Cross-selling recipe -> shop.
 * Deliberately its own outlined block (not an ad banner): same visual
 * language as the rest of the page, an honest heading.
 */
export default function UsedProducts({
  productSlugs,
}: {
  productSlugs: string[];
}) {
  const products = getProducts(productSlugs);
  if (products.length === 0) return null;

  return (
    <section
      aria-label="What I use for this"
      className="rounded-3xl border-2 border-crust bg-white p-5 sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold">
          What I use for this
        </h2>
        <Link
          href="/shop"
          className="whitespace-nowrap text-sm font-semibold text-brand hover:underline"
        >
          All in the shop
        </Link>
      </div>
      <p className="mt-1 text-sm text-mocha">
        Exactly the things from the video – not required, the recipe works without them.
      </p>

      <ul className="mt-4 space-y-3">
        {products.map((product) => (
          <li
            key={product.slug}
            className="lift flex gap-3 rounded-2xl bg-cream p-3 sm:gap-4 sm:p-4"
          >
            <Link
              href={`/shop/${product.slug}`}
              className="shrink-0"
              tabIndex={-1}
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt=""
                loading="lazy"
                className="h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/shop/${product.slug}`}
                className="font-semibold leading-snug hover:text-brand"
              >
                {product.title}
              </Link>
              <p className="mt-0.5 line-clamp-2 text-sm text-mocha">
                {product.shortDescription}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-bold">{formatPrice(product.price)}</span>
                {product.type === "digital" && (
                  <span className="rounded-full bg-brandSoft px-2 py-0.5 text-xs font-semibold text-brand">
                    Instant download
                  </span>
                )}
              </div>

              <div className="mt-3">
                <AddToCartButton
                  product={product}
                  className="btn-secondary w-full whitespace-nowrap px-4 text-sm sm:w-auto sm:text-base"
                  label="Add to cart"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
