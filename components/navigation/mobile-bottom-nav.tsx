"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, Home, ShoppingBag, ShoppingCart } from "lucide-react";

import {
  useCartStore,
  useCartHydration,
  selectItemCount,
} from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  href: string;
  label: string;
  icon: typeof Home;
  match: (pathname: string) => boolean;
}

const navItems: MobileNavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/products",
    label: "Products",
    icon: ShoppingBag,
    match: (pathname) =>
      pathname === "/products" || pathname.startsWith("/products/"),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingCart,
    match: (pathname) => pathname === "/cart" || pathname.startsWith("/checkout"),
  },
  {
    href: "/more",
    label: "More",
    icon: Ellipsis,
    match: (pathname) => pathname === "/more" || pathname.startsWith("/more/"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const hasHydratedCart = useCartHydration();
  const itemCount = useCartStore(selectItemCount);
  const cartCount = hasHydratedCart ? Math.min(itemCount, 99) : 0;

  const shouldHide =
    pathname.startsWith("/admin") || pathname.startsWith("/superadmin");

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className="md:hidden"
        style={{ height: "calc(4.25rem + env(safe-area-inset-bottom))" }}
      />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
        aria-label="Mobile app navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map((item) => {
            const isActive = item.match(pathname);
            const Icon = item.icon;
            const isCart = item.label === "Cart";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-2 text-[0.68rem] font-semibold transition-colors",
                  isActive ? "text-neutral-900" : "text-neutral-500",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
                {isCart && cartCount > 0 ? (
                  <span className="absolute left-1/2 top-2 ml-2 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-neutral-900 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                    {cartCount}
                  </span>
                ) : null}
                {isActive ? (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-neutral-900" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
