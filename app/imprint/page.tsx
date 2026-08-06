import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Imprint",
  description: `Provider identification for ${site.name}.`,
};

export default function ImprintPage() {
  return (
    <LegalLayout
      title="Imprint"
      intro="Provider identification under § 5 DDG (formerly § 5 TMG)."
      missing={[
        "Full name and postal address – a P.O. box is not enough, it has to be an address where post can be served",
        "Email address and a second way to reach you quickly (phone or a contact form)",
        "VAT identification number under § 27a UStG, if you have one",
        "If you use the small-business rule (§ 19 UStG): a note that no VAT is shown",
        "Person responsible for the content under § 18 (2) MStV, if you publish editorial content",
      ]}
    >
      <LegalSection heading="Contact">
        <p>
          Email:{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-semibold text-brand hover:underline"
          >
            {site.email}
          </a>
        </p>
        <p>
          The address above is a placeholder and has to be replaced with your
          real details before the shop takes orders.
        </p>
      </LegalSection>

      <LegalSection heading="Online dispute resolution">
        <p>
          The EU Commission provides a platform for online dispute resolution at{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          . State here whether you are willing or obliged to take part in
          dispute resolution proceedings before a consumer arbitration board.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
