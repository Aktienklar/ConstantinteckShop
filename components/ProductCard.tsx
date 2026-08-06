import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="card lift-3d group flex h-full flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-dough">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 ease-soft group-hover:scale-[1.06]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-mocha">
          {product.type === "digital" ? "PDF · instant download" : "Shipped"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold leading-snug">
          {product.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-mocha">
          {product.shortDescription}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {product.variants && (
            <span className="flex items-center gap-1" aria-hidden>
              {product.variants.map((v) => (
                <span
                  key={v.id}
                  title={v.label}
                  className="h-4 w-4 rounded-full border border-cocoa/20"
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
