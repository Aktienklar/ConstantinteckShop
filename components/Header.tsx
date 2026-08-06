"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, navigation, site } from "@/lib/site";
import { useCart } from "@/lib/cart";

export default function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-crust/60 bg-cream/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-brand text-base text-white"
          >
            C
          </span>
          <span className="font-display">{site.name}</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="hidden sm:flex sm:items-center sm:gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(pathname, item.href)}
              />
            ))}
          </nav>

          <Link
            href="/cart"
            aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-dough"
          >
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 grid h-5 min-w-[20px] place-items-center rounded-full bg-brand px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile: navigation on its own row, large touch targets instead of a burger menu */}
      <nav className="no-scrollbar flex gap-2 overflow-x-auto border-t border-crust/50 px-4 py-2 sm:hidden">
        {navigation.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`chip whitespace-nowrap ${
                active
                  ? "border-cocoa bg-cocoa text-cream"
                  : "border-crust bg-white text-mocha"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-11 items-center rounded-full px-4 text-base font-medium transition ${
        active ? "bg-dough text-cocoa" : "text-mocha hover:bg-dough/60"
      }`}
    >
      {label}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
