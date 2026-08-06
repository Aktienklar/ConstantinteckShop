import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} handles personal data.`,
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy policy"
      intro="What happens to your data when you visit this site or place an order."
      missing={[
        "Controller: your name and address, matching the imprint",
        "Hosting provider and where the servers are, plus a data processing agreement with them",
        "Payment provider and what data is passed to it during checkout",
        "Shipping provider and the address data it receives",
        "Analytics or embedded video (YouTube, TikTok, Instagram): which tools, on what legal basis, and a consent banner if they are not strictly necessary",
        "Retention periods and the statutory retention duties you are subject to",
      ]}
    >
      <LegalSection heading="What this site does today">
        <p>
          The cart is stored only in your own browser (local storage) and is
          never sent to a server. No account is needed and no newsletter is
          sent. All recipes are freely readable without giving any data.
        </p>
        <p>
          The recipe videos are embedded from external platforms. As soon as
          real embeds are switched on, those platforms can set cookies and see
          your IP address – that needs consent and has to be described here.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Under the GDPR you can ask for access, correction, deletion,
          restriction of processing and data portability, and you can object to
          processing. You can also complain to a supervisory authority. Requests
          go to{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-semibold text-brand hover:underline"
          >
            {site.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
