import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { shop } from "@/lib/site";
import { DownloadIcon, ReturnIcon, ShieldIcon, TruckIcon } from "./Icons";
import type { ProductType } from "@/lib/types";

/**
 * Delivery, returns and payment directly under the buy button.
 *
 * A shop that hides this until checkout loses the cautious buyer – so the
 * shipping cost, the delivery window and the return window are stated on the
 * product page itself, with a link to the full terms.
 */
export default function ShopPromise({ type }: { type: ProductType }) {
  const rows =
    type === "digital"
      ? [
          {
            Icon: DownloadIcon,
            text: "Download link by email straight after your order – no shipping, no waiting.",
          },
          {
            Icon: ShieldIcon,
            text: `Secure payment: ${shop.paymentMethods.join(", ")}.`,
          },
        ]
      : [
          {
            Icon: TruckIcon,
            text: shop.freeShippingFrom
              ? `Ships to ${shop.shipsTo} in ${shop.deliveryTime}. ${formatPrice(shop.shippingFlatRate)} shipping, free from ${formatPrice(shop.freeShippingFrom)}.`
              : `Ships to ${shop.shipsTo} in ${shop.deliveryTime} for ${formatPrice(shop.shippingFlatRate)}.`,
          },
          {
            Icon: ReturnIcon,
            text: `${shop.returnDays} days to change your mind – unused and in its packaging, no reason needed.`,
          },
          {
            Icon: ShieldIcon,
            text: `Secure payment: ${shop.paymentMethods.join(", ")}.`,
          },
        ];

  return (
    <div className="mt-4 rounded-2xl border border-crust bg-white p-4">
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.text} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-brand">
              <row.Icon className="h-5 w-5" />
            </span>
            <span className="text-sm leading-relaxed text-mocha">{row.text}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/shipping-returns"
        className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-brand hover:underline"
      >
        Shipping &amp; returns in detail →
      </Link>
    </div>
  );
}
