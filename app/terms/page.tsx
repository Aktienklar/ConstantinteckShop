import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";
import { shop, site } from "@/lib/site";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: `The terms that apply to orders placed with ${site.name}.`,
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms and conditions"
      intro="The rules that apply when you order from this shop."
      missing={[
        "Your full business details as the contracting party",
        "How a contract comes about: at which click the order is binding and when you accept it",
        "Whether the contract text is stored and in which language it is concluded",
        "Retention of title until full payment",
        "Warranty and liability clauses, checked against current German consumer law",
        "For the PDFs: that the download starts before the withdrawal period ends and that the customer expressly consents to this, losing the right of withdrawal",
      ]}
    >
      <LegalSection heading="Scope">
        <p>
          These terms apply to all orders placed through this shop by consumers
          and businesses.
        </p>
      </LegalSection>

      <LegalSection heading="Prices and payment">
        <p>
          All prices include statutory VAT. For physical goods, shipping of{" "}
          {formatPrice(shop.shippingFlatRate)} is added
          {shop.freeShippingFrom
            ? `, and orders from ${formatPrice(shop.freeShippingFrom)} ship free`
            : ""}
          . Payment is possible by {shop.paymentMethods.join(", ")}.
        </p>
      </LegalSection>

      <LegalSection heading="Delivery">
        <p>
          Physical goods are shipped to {shop.shipsTo} and normally arrive in{" "}
          {shop.deliveryTime}. Digital products are made available as a download
          immediately after payment.
        </p>
      </LegalSection>

      <LegalSection heading="Right of withdrawal">
        <p>
          Consumers have a statutory right of withdrawal of at least{" "}
          {shop.returnDays} days. The formal withdrawal instruction and the
          model withdrawal form still have to be inserted here in the exact
          statutory wording – see the shipping and returns page.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
