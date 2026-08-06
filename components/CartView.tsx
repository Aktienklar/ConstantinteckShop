"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice, getProduct } from "@/lib/products";
import { shop } from "@/lib/site";
import { ReturnIcon, ShieldIcon, TruckIcon } from "./Icons";

export default function CartView() {
  const { lines, total, itemCount, setQuantity, remove, clear } = useCart();
  const [ordered, setOrdered] = useState(false);

  const hasPhysical = lines.some(
    (line) => getProduct(line.productSlug)?.type === "physical"
  );
  /** Digital-only orders never ship, and the free-shipping tier applies to
      the goods total – both are what the customer sees stated elsewhere. */
  const qualifiesForFreeShipping =
    shop.freeShippingFrom !== null && total >= shop.freeShippingFrom;
  const shipping =
    hasPhysical && !qualifiesForFreeShipping ? shop.shippingFlatRate : 0;
  const missingForFreeShipping =
    shop.freeShippingFrom !== null && hasPhysical && !qualifiesForFreeShipping
      ? shop.freeShippingFrom - total
      : 0;

  if (ordered) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-savorySoft text-savory">
          <ShieldIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold">
          That was the mockup checkout
        </h2>
        <p className="mx-auto mt-2 max-w-md text-mocha">
          In this prototype nothing is charged and nothing is shipped. Stripe
          or Shopify will take over here later on.
        </p>
        <Link href="/recipes" className="btn-primary mt-6">
          On to the recipes
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border-2 border-dashed border-crust bg-white px-6 py-14 text-center">
        <p className="font-display text-xl font-bold">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-mocha">
          An apron, dough scrapers or a recipe collection as a PDF – have a
          look around the shop.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Go to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <ul className="space-y-3 lg:col-span-2">
        {lines.map((line) => {
          const product = getProduct(line.productSlug);
          if (!product) return null;
          const variant = product.variants?.find((v) => v.id === line.variantId);
          const key = `${line.productSlug}-${line.variantId ?? ""}`;

          return (
            <li key={key} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card sm:gap-4 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt=""
                loading="lazy"
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/shop/${product.slug}`}
                  className="font-semibold leading-snug hover:text-brand"
                >
                  {product.title}
                </Link>
                <p className="mt-0.5 text-sm text-mocha">
                  {variant ? `Colour: ${variant.label} · ` : ""}
                  {product.type === "digital" ? "PDF download" : "Shipped"}
                </p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center gap-1 rounded-full border-2 border-crust p-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        setQuantity(product.slug, line.variantId, line.quantity - 1)
                      }
                      className="grid h-9 w-9 place-items-center rounded-full text-lg font-bold hover:bg-dough"
                    >
                      −
                    </button>
                    <span className="w-7 text-center font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        setQuantity(product.slug, line.variantId, line.quantity + 1)
                      }
                      className="grid h-9 w-9 place-items-center rounded-full text-lg font-bold hover:bg-dough"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold">
                      {formatPrice(product.price * line.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(product.slug, line.variantId)}
                      className="min-h-[40px] px-1 text-sm font-semibold text-mocha underline hover:text-brand"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Summary */}
      <aside className="lg:col-span-1">
        <div className="rounded-3xl bg-white p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold">Summary</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <Row
              label={`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
              value={formatPrice(total)}
            />
            <Row
              label="Shipping"
              value={
                shipping === 0
                  ? hasPhysical
                    ? "Free"
                    : "none (PDF only)"
                  : formatPrice(shipping)
              }
            />
          </dl>

          {missingForFreeShipping > 0 && (
            <p className="mt-3 rounded-xl bg-brandSoft px-3 py-2 text-sm text-cocoa">
              {formatPrice(missingForFreeShipping)} more and shipping is free.
            </p>
          )}

          <div className="mt-4 flex items-baseline justify-between border-t border-crust/60 pt-4">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-bold">
              {formatPrice(total + shipping)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              clear();
              setOrdered(true);
            }}
            className="btn-primary mt-5 w-full"
          >
            Checkout (mockup)
          </button>

          <ul className="mt-4 space-y-2 text-xs text-mocha">
            <li className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4 shrink-0 text-brand" />
              Delivery in {shop.deliveryTime} to {shop.shipsTo}
            </li>
            <li className="flex items-center gap-2">
              <ReturnIcon className="h-4 w-4 shrink-0 text-brand" />
              {shop.returnDays} days to return
            </li>
            <li className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 shrink-0 text-brand" />
              {shop.paymentMethods.join(" · ")}
            </li>
          </ul>

          {shop.isPrototype && (
            <p className="mt-3 rounded-xl bg-crust/40 px-3 py-2 text-center text-xs text-mocha">
              Prototype: this button charges nothing and ships nothing.
            </p>
          )}

          <button
            type="button"
            onClick={clear}
            className="mt-4 w-full text-sm font-semibold text-mocha underline hover:text-brand"
          >
            Empty cart
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-mocha">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
