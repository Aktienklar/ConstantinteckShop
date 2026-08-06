"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "./types";
import { getProduct } from "./products";

/**
 * Cart as pure client state (localStorage).
 * Prototype: no payment integration. When moving to Stripe/Shopify only
 * `checkout()` gets swapped for a real session call here.
 */

const STORAGE_KEY = "ct-cart-v1";

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  total: number;
  add: (productSlug: string, variantId?: string, quantity?: number) => void;
  setQuantity: (productSlug: string, variantId: string | undefined, quantity: number) => void;
  remove: (productSlug: string, variantId?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(line: CartLine, slug: string, variantId?: string) {
  return line.productSlug === slug && (line.variantId ?? "") === (variantId ?? "");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      // broken/blocked storage -> just start with an empty cart
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore (e.g. private mode)
    }
  }, [lines, hydrated]);

  const add = useCallback(
    (productSlug: string, variantId?: string, quantity = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => sameLine(l, productSlug, variantId));
        if (existing) {
          return prev.map((l) =>
            sameLine(l, productSlug, variantId)
              ? { ...l, quantity: l.quantity + quantity }
              : l
          );
        }
        return [...prev, { productSlug, variantId, quantity }];
      });
    },
    []
  );

  const setQuantity = useCallback(
    (productSlug: string, variantId: string | undefined, quantity: number) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => !sameLine(l, productSlug, variantId))
          : prev.map((l) =>
              sameLine(l, productSlug, variantId) ? { ...l, quantity } : l
            )
      );
    },
    []
  );

  const remove = useCallback((productSlug: string, variantId?: string) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, productSlug, variantId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const total = lines.reduce((sum, l) => {
      const product = getProduct(l.productSlug);
      return sum + (product ? product.price * l.quantity : 0);
    }, 0);
    return { lines, itemCount, total, add, setQuantity, remove, clear };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
