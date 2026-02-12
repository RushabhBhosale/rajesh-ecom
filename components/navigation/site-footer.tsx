"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import { brandName } from "@/utils/variable";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
];

const accountLinks = [
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/dashboard/orders", label: "My Orders" },
];

export function SiteFooter() {
  const pathname = usePathname();
  const shouldHide =
    pathname.startsWith("/admin") || pathname.startsWith("/superadmin");

  if (shouldHide) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-neutral-200 bg-gradient-to-b from-white to-neutral-50 dark:border-neutral-800 dark:from-neutral-950 dark:to-neutral-900">
      {/* Subtle grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(0 0 0) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(0 0 0) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-600 text-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:from-neutral-200 dark:to-neutral-400 dark:text-neutral-900">
                <span className="text-lg font-black">R</span>
              </div>
              <span className="bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent dark:from-neutral-50 dark:to-neutral-300">
                {brandName}
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Certified refurbished hardware for reliable enterprise
              deployments. Sustainable IT solutions without compromise on
              quality or performance.
            </p>
          </div>

          {/* Explore section */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-50">
              Explore
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account section */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-50">
              Account
            </h3>
            <ul className="space-y-3">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Support section */}
        <div className="border-t border-neutral-200 py-8 dark:border-neutral-800">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                Support
              </h4>
              <a
                href="mailto:support@rajeshrenewed.com"
                className="group inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="border-b border-transparent transition-colors group-hover:border-current">
                  support@rajeshrenewed.com
                </span>
              </a>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                Sales
              </h4>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
              >
                <span className="border-b border-transparent transition-colors group-hover:border-current">
                  Contact sales
                </span>
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                Location
              </h4>
              <div className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-200 py-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-500 md:flex-row md:text-left">
          <p>
            © {currentYear} {brandName}. Built for sustainable enterprise IT.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/products"
              className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-300"
            >
              Browse catalog
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-300"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
