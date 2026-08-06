import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductBuyBox from "@/components/ProductBuyBox";
import ShopPromise from "@/components/ShopPromise";
import RelatedRecipes from "@/components/RelatedRecipes";
import ProductCard from "@/components/ProductCard";
import { getProduct, products } from "@/lib/products";
import { CheckIcon } from "@/components/Icons";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const product = getProduct(params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.shortDescription,
    openGraph: {
      title: product.title,
      description: product.shortDescription,
      images: [product.image],
    },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const others = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <div className="container-page py-6">
      <Link
        href="/shop"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-mocha hover:text-brand"
      >
        ‹ Back to shop
      </Link>

      <div className="mt-1 grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          <div className="overflow-hidden rounded-3xl bg-dough">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[0]}
              alt={product.title}
              className="aspect-square w-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
              {gallery.slice(1).map((image, index) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={image}
                  src={image}
                  alt={`${product.title} – view ${index + 2}`}
                  loading="lazy"
                  className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28"
                />
              ))}
            </div>
          )}
        </div>

        {/* Info & purchase */}
        <div>
          <span className="inline-flex rounded-full bg-brandSoft px-3 py-1 text-sm font-semibold text-brand">
            {product.type === "digital"
              ? "Digital · PDF"
              : "Physical · shipped to you"}
          </span>

          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
            {product.title}
          </h1>
          <p className="mt-3 text-lg text-mocha">{product.shortDescription}</p>

          <div className="mt-6">
            <ProductBuyBox product={product} />
          </div>

          <ShopPromise type={product.type} />

          <section className="mt-6">
            <h2 className="font-display text-xl font-bold">Details</h2>
            <p className="mt-2 leading-relaxed text-mocha">{product.description}</p>
            <ul className="mt-4 space-y-2">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-savory" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Way back to the content: product -> recipe/video */}
      <div className="mt-10">
        <RelatedRecipes recipeSlugs={product.linkedRecipeSlugs} />
      </div>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Goes well with this</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {others.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
