import Link from "next/link";
import { legalNavigation, navigation, shop, site } from "@/lib/site";
import { formatPrice } from "@/lib/products";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-crust/60 bg-dough">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">{site.name}</p>
          <p className="mt-2 max-w-xs text-sm text-mocha">{site.claim}</p>
          <p className="mt-4 text-sm text-mocha">
            Questions about an order?
            <br />
            <a
              href={`mailto:${site.email}`}
              className="font-semibold text-brand hover:underline"
            >
              {site.email}
            </a>
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-mocha">
            Pages
          </p>
          <ul className="mt-3 space-y-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-[40px] items-center text-base hover:text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal links belong in the footer of every page – buyers look for
            them here, and in Germany they have to be reachable from anywhere. */}
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-mocha">
            Orders & legal
          </p>
          <ul className="mt-3 space-y-1">
            {legalNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-[40px] items-center text-base hover:text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-mocha">
            Follow
          </p>
          <ul className="mt-3 space-y-1">
            {site.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[40px] items-center text-base hover:text-brand"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-page border-t border-crust/60 py-6 text-xs text-mocha">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p>
            All prices include VAT
            {shop.freeShippingFrom
              ? `, plus ${formatPrice(shop.shippingFlatRate)} shipping – free from ${formatPrice(shop.freeShippingFrom)}`
              : `, plus ${formatPrice(shop.shippingFlatRate)} shipping`}
            .
          </p>
          <p className="whitespace-nowrap">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>

        {/* Visitor-facing wording only – the switch that hides this lives in
            `shop.isPrototype` in lib/site.ts. */}
        {shop.isPrototype && (
          <p className="mt-4 rounded-xl bg-crust/40 px-4 py-3">
            <strong className="font-semibold text-cocoa">
              This shop is not live yet.
            </strong>{" "}
            You can browse everything, but checkout ends in a confirmation
            screen – nothing is charged and nothing ships.
          </p>
        )}
      </div>
    </footer>
  );
}
