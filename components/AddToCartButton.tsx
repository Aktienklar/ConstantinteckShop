"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

/**
 * Compact "Add to cart" button for cross-selling blocks.
 * For products with variants it automatically picks the first one.
 */
export default function AddToCartButton({
  product,
  variantId,
  className = "btn-primary w-full",
  label = "Add to cart",
}: {
  product: Product;
  variantId?: string;
  className?: string;
  label?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const resolvedVariant = variantId ?? product.variants?.[0]?.id;

  if (added) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <span className="btn-secondary flex-1 cursor-default border-savory/40 text-savory">
          Added ✓
        </span>
        <Link href="/cart" className="btn-primary flex-1">
          Go to cart
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        add(product.slug, resolvedVariant);
        setAdded(true);
      }}
    >
      {label}
    </button>
  );
}
