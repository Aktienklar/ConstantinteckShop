/** @type {import('next').NextConfig} */

// GitHub Pages liefert die Seite unter github.io/ConstantinteckShop aus, also in
// einem Unterordner. Nur der Produktions-Build braucht das Präfix – lokal soll
// die Seite weiterhin direkt unter localhost:3000 liegen.
// Sobald eine eigene Domain dranhängt, kann basePath ganz raus.
const basePath = process.env.NODE_ENV === "production" ? "/ConstantinteckShop" : "";

const nextConfig = {
  // Erzeugt reine HTML/CSS/JS-Dateien in out/ – das, was GitHub Pages ausliefern kann.
  output: "export",
  basePath,
  images: {
    // GitHub Pages hat keinen Server, der Bilder optimieren könnte.
    unoptimized: true,
    remotePatterns: [
      // Platzhalterbilder im Prototyp. Kann raus, sobald echte Fotos in /public liegen.
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
