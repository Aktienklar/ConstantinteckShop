import type { Metadata, Viewport } from "next";
import "./globals.css";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${site.name} – ${site.claim}`,
    template: `%s | ${site.name}`,
  },
  description: site.intro,
  metadataBase: new URL(site.url),
};

export const viewport: Viewport = {
  themeColor: "#FDF8F1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-cream"
          >
            Skip to content
          </a>
          <AnnouncementBar />
          <Header />
          <main id="content">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
