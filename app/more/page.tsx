import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  LogIn,
  PackageCheck,
  ShieldUser,
  ShoppingCart,
  Store,
  UserRound,
} from "lucide-react";

import { brandName } from "@/utils/variable";

export const metadata: Metadata = {
  title: `More | ${brandName}`,
};

const sections = [
  {
    title: "Shopping",
    description: "Continue browsing and complete your order.",
    links: [
      {
        href: "/products",
        label: "All products",
        hint: "Browse available inventory",
        icon: Store,
      },
      {
        href: "/cart",
        label: "Cart",
        hint: "Review items before checkout",
        icon: ShoppingCart,
      },
      {
        href: "/checkout",
        label: "Checkout",
        hint: "Finish payment securely",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Account",
    description: "Access profile, addresses, and order history.",
    links: [
      {
        href: "/dashboard/profile",
        label: "Profile & addresses",
        hint: "Update account and shipping details",
        icon: UserRound,
      },
      {
        href: "/dashboard/orders",
        label: "My orders",
        hint: "Track and review your purchases",
        icon: PackageCheck,
      },
      {
        href: "/login",
        label: "Sign in",
        hint: "Log in to unlock your account tools",
        icon: LogIn,
      },
    ],
  },
];

export default function MorePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-100">
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            <ShieldUser className="h-4 w-4" aria-hidden />
            More
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Quick access links
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Open important pages like checkout, profile, and orders from one
            place.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold text-neutral-900">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {section.description}
              </p>
              <div className="mt-3 space-y-2">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm transition-colors hover:bg-neutral-100"
                    >
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span>
                          <span className="block font-medium text-neutral-900">
                            {link.label}
                          </span>
                          <span className="block text-xs text-neutral-500">
                            {link.hint}
                          </span>
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-neutral-500" aria-hidden />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
