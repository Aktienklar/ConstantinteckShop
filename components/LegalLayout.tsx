import Link from "next/link";
import { legalNavigation } from "@/lib/site";

/**
 * Shared shell for the legal pages.
 *
 * `missing` lists the things only the shop owner can supply (real address,
 * VAT ID, the wording their lawyer or provider gives them). It renders as a
 * visible warning so an unfinished page can never be mistaken for a finished
 * one – a blank imprint is worse than an obvious gap.
 */
export default function LegalLayout({
  title,
  intro,
  missing = [],
  children,
}: {
  title: string;
  intro?: string;
  missing?: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page py-8">
      <div className="lg:grid lg:grid-cols-4 lg:gap-10">
        <nav aria-label="Legal pages" className="lg:col-span-1">
          <p className="text-sm font-bold uppercase tracking-wide text-mocha">
            Legal
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
        </nav>

        <article className="mt-8 max-w-prose lg:col-span-3 lg:mt-0">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-lg text-mocha">{intro}</p>}

          {missing.length > 0 && (
            <aside
              role="note"
              className="mt-6 rounded-2xl border-2 border-brand/40 bg-brandSoft p-5"
            >
              <p className="font-bold text-brand">
                This page still needs your details
              </p>
              <p className="mt-1 text-sm text-cocoa">
                It is published but incomplete. Selling to consumers in Germany
                without these details is a legal risk – fill them in before the
                shop goes live.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cocoa">
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          )}

          <div className="mt-8 space-y-6 leading-relaxed text-mocha">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}

/** Heading + body inside a legal page, so all four pages look the same. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-cocoa">{heading}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
