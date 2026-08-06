import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warme Basis (Teig / Creme / Kruste)
        cream: "#FDF8F1",
        dough: "#F6ECDD",
        crust: "#E4CFB2",
        cocoa: "#3B2A20",
        mocha: "#6E5544",
        // Kategorie-Akzente: Backen/Süßes vs. Herzhaft/Alltag
        sweet: "#D4517A",
        sweetSoft: "#FBE7EE",
        savory: "#4F7C4A",
        savorySoft: "#E7F1E4",
        // Marken-Akzent (CTAs, Shop)
        brand: "#C2410C",
        brandSoft: "#FFEDD5",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        /* Three elevation steps. Each keeps a tight contact shadow plus a
           wider, softer one – that pairing is what reads as a real object
           lying on the page rather than a rectangle with a blur behind it. */
        card: "0 1px 2px rgba(59,42,32,.06), 0 8px 24px -12px rgba(59,42,32,.18)",
        lift: "0 2px 4px rgba(59,42,32,.08), 0 18px 40px -16px rgba(59,42,32,.28)",
        pop: "0 3px 6px rgba(59,42,32,.10), 0 28px 56px -20px rgba(59,42,32,.34)",
      },
      keyframes: {
        /* Position only – deliberately no opacity. An entrance animation that
           starts at opacity 0 leaves the content invisible anywhere the
           animation does not run (background tabs, blocked CSS, odd embeds).
           If this one never runs, the element simply sits 10px lower, which
           nobody notices. */
        rise: {
          from: { transform: "translate3d(0,10px,0)" },
          to: { transform: "translate3d(0,0,0)" },
        },
      },
      animation: {
        rise: "rise .55s cubic-bezier(.22,1,.36,1) both",
      },
      transitionTimingFunction: {
        /* Overshoot-free ease-out – movement settles instead of stopping dead. */
        soft: "cubic-bezier(.22,1,.36,1)",
      },
    },
  },
  plugins: [],
};

export default config;
