import type { Metadata } from "next";
import LegalLayout, { LegalSection } from "@/components/LegalLayout";
import { shop, site } from "@/lib/site";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: `Delivery times, shipping costs and returns at ${site.name}.`,
};

export default function ShippingReturnsPage() {
  return (
    <LegalLayout
      title="Shipping & returns"
      intro="What delivery costs, how long it takes and how to send something back."
      missing={[
        "The statutory withdrawal instruction (Widerrufsbelehrung) in its exact wording, plus the model withdrawal form",
        "The return address goods should be sent to",
        "Who pays the return postage – say so plainly, customers look for this",
      ]}
    >
      <LegalSection heading="Shipping costs and delivery time">
        <p>
          Orders ship to {shop.shipsTo} and normally arrive within{" "}
          {shop.deliveryTime} of your order. Shipping costs{" "}
          {formatPrice(shop.shippingFlatRate)} per order
          {shop.freeShippingFrom
            ? `, and is free from an order value of ${formatPrice(shop.freeShippingFrom)}`
            : ""}
          .
        </p>
        <p>
          Recipe collections as PDFs have no shipping cost. You get the download
          link by email straight after your order.
        </p>
      </LegalSection>

      <LegalSection heading="Returns">
        <p>
          You have {shop.returnDays} days to send an item back, without giving a
          reason. Items should be unused and in their original packaging. Once
          the return arrives, you get your money back using the payment method
          you paid with.
        </p>
        <p>
          PDFs are excluded from returns as soon as the download has started –
          you will be asked to confirm this explicitly during checkout.
        </p>
      </LegalSection>

      <LegalSection heading="Something arrived damaged?">
        <p>
          Write to{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-semibold text-brand hover:underline"
          >
            {site.email}
          </a>{" "}
          with a photo and your order number. Damage in transit is sorted out
          without a return shipment.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
