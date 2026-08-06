import type { Category } from "@/lib/types";
import { CupcakeIcon, PotIcon } from "./Icons";

/**
 * Colour and icon mapping for the two worlds.
 * Read everywhere so that "Baking & Sweets" and "Savoury & Everyday"
 * look identical on every page.
 */
export const categoryMeta: Record<
  Category,
  {
    label: string;
    short: string;
    /** Line icon – takes the surrounding text colour. */
    Icon: (props: { className?: string }) => JSX.Element;
    badge: string;
    accent: string;
    ring: string;
  }
> = {
  backen: {
    label: "Baking & Sweets",
    short: "Sweet",
    Icon: CupcakeIcon,
    badge: "bg-sweetSoft text-sweet",
    accent: "bg-sweet",
    ring: "border-sweet",
  },
  herzhaft: {
    label: "Savoury & Everyday",
    short: "Savoury",
    Icon: PotIcon,
    badge: "bg-savorySoft text-savory",
    accent: "bg-savory",
    ring: "border-savory",
  },
};

export default function CategoryBadge({
  category,
  size = "sm",
}: {
  category: Category;
  size?: "sm" | "md";
}) {
  const meta = categoryMeta[category];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${meta.badge} ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <meta.Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {meta.label}
    </span>
  );
}
