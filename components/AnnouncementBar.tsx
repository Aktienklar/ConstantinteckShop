import Link from "next/link";
import { formatPrice, getProduct } from "@/lib/products";
import { shop } from "@/lib/site";

/**
 * Slim bar above the header – the first thing a visitor sees.
 *
 * It carries the one product the channel is actually known for (the apron)
 * and the two terms that decide whether a first-time buyer keeps reading:
 * what shipping costs and how long they have to send it back.
 */
export default function AnnouncementBar() {
  const apron = getProduct("linen-apron");
  if (!apron) return null;

  return (
    <div className="bg-cocoa text-cream">
      <div className="container-page flex min-h-[44px] flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 text-sm sm:justify-between">
        <Link
          href={`/shop/${apron.slug}`}
          className="group inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
        >
          <span
            aria-hidden
            className="hidden h-2 w-2 shrink-0 rounded-full bg-brand sm:block"
          />
          {/* Short enough to stay on one line on a phone – a bar that wraps
              to two lines eats the top of the first screen. */}
          <span className="sm:hidden">
            The apron from the videos · {formatPrice(apron.price)}
          </span>
          <span className="hidden sm:inline">
            The linen apron from the videos – now in the shop,{" "}
            {formatPrice(apron.price)}
          </span>
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </Link>

        <p className="hidden text-cream/75 md:block">
          {shop.freeShippingFrom
            ? `Free shipping from ${formatPrice(shop.freeShippingFrom)}`
            : `Shipping ${formatPrice(shop.shippingFlatRate)}`}{" "}
          · {shop.returnDays}-day returns
        </p>
      </div>
    </div>
  );
}
