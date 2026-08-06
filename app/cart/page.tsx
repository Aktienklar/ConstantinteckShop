import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your cart – a prototype without real payment processing.",
};

export default function CartPage() {
  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Cart</h1>
      <CartView />
    </div>
  );
}
