"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { shop } from "@/lib/site";
import type { Product } from "@/lib/types";

/**
 * Purchase area of the product page: variant choice, quantity, cart.
 * Mockup – nothing is ordered, it only fills the local cart.
 */
export default function ProductBuyBox({ product }: { product: Product }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <p className="text-3xl font-bold">{formatPrice(product.price)}</p>
      <p className="mt-1 text-sm text-mocha">
        {product.type === "digital"
          ? "incl. VAT · instant download after purchase"
          : `incl. VAT, plus ${formatPrice(shop.shippingFlatRate)} shipping${
              shop.freeShippingFrom
                ? ` – free from ${formatPrice(shop.freeShippingFrom)}`
                : ""
            }`}
      </p>

      {product.variants && (
        <fieldset className="mt-5">
          <legend className="text-sm font-bold uppercase tracking-wide text-mocha">
            Colour
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const active = variant.id === variantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setVariantId(variant.id);
                    setAdded(false);
                  }}
                  className={`chip ${
                    active
                      ? "border-cocoa bg-cocoa text-cream"
                      : "border-crust bg-white text-cocoa hover:border-cocoa/30"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-4 w-4 rounded-full border border-cocoa/20"
                    style={{ backgroundColor: variant.colorHex }}
                  />
                  {variant.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-5 flex items-center gap-3">
        <span className="text-sm font-bold uppercase tracking-wide text-mocha">
          Quantity
        </span>
        <div className="flex items-center gap-1 rounded-full border-2 border-crust p-1">
          <QtyButton
            label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </QtyButton>
          <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
          <QtyButton
            label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          >
            +
          </QtyButton>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => {
            add(product.slug, variantId, quantity);
            setAdded(true);
          }}
        >
          Add to cart
        </button>

        {added && (
          <div role="status" className="rounded-2xl bg-savorySoft p-3 text-center">
            <p className="text-sm font-semibold text-savory">
              {quantity}× in your cart
            </p>
            <Link
              href="/cart"
              className="mt-1 inline-block font-semibold text-brand hover:underline"
            >
              Go to cart →
            </Link>
          </div>
        )}
      </div>

      {shop.isPrototype && (
        <p className="mt-4 text-center text-xs text-mocha">
          Prototype: nothing is charged and nothing ships yet.
        </p>
      )}
    </div>
  );
}

function QtyButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full text-lg font-bold hover:bg-dough"
    >
      {children}
    </button>
  );
}
