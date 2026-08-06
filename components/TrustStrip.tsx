import { formatPrice } from "@/lib/products";
import { shop } from "@/lib/site";
import { DownloadIcon, ReturnIcon, ShieldIcon, TruckIcon } from "./Icons";

/**
 * The four questions a first-time buyer has before they trust a small shop:
 * when does it arrive, what does it cost, can I send it back, is paying safe.
 *
 * Every claim here comes from `shop` in lib/site.ts – keep them true.
 */
export default function TrustStrip() {
  const items = [
    {
      Icon: TruckIcon,
      title: `Delivery in ${shop.deliveryTime}`,
      text: shop.freeShippingFrom
        ? `Free from ${formatPrice(shop.freeShippingFrom)}, otherwise ${formatPrice(shop.shippingFlatRate)}`
        : `Flat rate ${formatPrice(shop.shippingFlatRate)}`,
    },
    {
      Icon: ReturnIcon,
      title: `${shop.returnDays} days to return`,
      text: "Unused and in its packaging, no reason needed",
    },
    {
      Icon: ShieldIcon,
      title: "Secure payment",
      text: shop.paymentMethods.join(" · "),
    },
    {
      Icon: DownloadIcon,
      title: "PDFs right away",
      text: "Download link by email, no shipping",
    },
  ];

  return (
    <section
      aria-label="Shipping, returns and payment"
      className="border-y border-crust/60 bg-white"
    >
      <ul className="container-page grid gap-x-6 gap-y-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <li
            key={item.title}
            /* Staggered so the row assembles left to right instead of
               appearing as one block. */
            style={{ animationDelay: `${index * 70}ms` }}
            className="rise flex items-start gap-3"
          >
            <span className="mt-0.5 shrink-0 text-brand">
              <item.Icon className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold leading-snug">{item.title}</span>
              <span className="mt-0.5 block text-sm leading-snug text-mocha">
                {item.text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
