import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rajesh Renewed",
    short_name: "Rajesh",
    description:
      "Premium renewed electronics with enterprise-grade QA, fast delivery, and responsive support.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0b1224",
    theme_color: "#0f172a",
    lang: "en",
    categories: ["shopping", "productivity"],
    icons: [
      {
        src: "/pwa-icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        src: "/pwa-icon-180.png",
        type: "image/png",
        sizes: "180x180",
      },
      {
        src: "/pwa-icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
      {
        src: "/pwa-icon-maskable.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Browse products",
        short_name: "Shop",
        url: "/products",
      },
      {
        name: "View cart",
        short_name: "Cart",
        url: "/cart",
      },
    ],
  };
}
