import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ToasterProvider } from "@/components/providers/toaster-provider";
import { SiteNavbar } from "@/components/navigation/site-navbar";
import { SiteFooter } from "@/components/navigation/site-footer";
import { PwaClient } from "@/components/pwa/pwa-client";
import { brandName } from "@/utils/variable";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${brandName} | Premium refurbished electronics`,
  description:
    "Shop professionally renewed laptops, tablets, and accessories with fast shipping, expert support, and sustainable savings.",
  applicationName: brandName,
  manifest: "/manifest.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f172a" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: brandName,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/pwa-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/pwa-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/pwa-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-background antialiased safe-inset`}
      >
        <PwaClient />
        <SiteNavbar />
        <ToasterProvider />
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
