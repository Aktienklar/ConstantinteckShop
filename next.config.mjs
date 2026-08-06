/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Platzhalterbilder im Prototyp. Kann raus, sobald echte Fotos in /public liegen.
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
