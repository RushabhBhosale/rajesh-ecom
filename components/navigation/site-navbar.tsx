"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop all" },
  { href: "#deals", label: "Today's deals" },
  { href: "#categories", label: "Categories" },
  { href: "#services", label: "Services" },
];

const authLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account", primary: true },
];

const HIDDEN_ON_PATHS = [/^\/dashboard/, /^\/admin/, /^\/superadmin/];

export function SiteNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const shouldHide = HIDDEN_ON_PATHS.some((regex) => regex.test(pathname));
  if (shouldHide) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="hidden border-b border-border/60 bg-primary text-primary-foreground md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-xs font-semibold">
          <p>Free 2-day shipping on business orders over $499.</p>
          <Link href="#deals" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
            Browse limited-time offers
          </Link>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">R</span>
            Rajesh Renewed
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground",
                  pathname === link.href ? "text-foreground" : undefined,
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <form className="relative hidden flex-1 max-w-md lg:max-w-2xl md:block" action="/products" role="search">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            name="q"
            placeholder="Search for laptops, tablets, accessories..."
            className="h-11 rounded-full border-border/70 bg-muted/70 pl-10 pr-14 text-sm"
            aria-label="Search products"
          />
          <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full">
            <Search className="h-4 w-4" aria-hidden />
            <span className="sr-only">Search</span>
          </Button>
        </form>
        <div className="hidden items-center gap-2 md:flex">
          {authLinks.map((link) => (
            <Button key={link.href} asChild variant={link.primary ? "default" : "ghost"} size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Button asChild variant="outline" size="sm" className="hidden items-center gap-2 rounded-full lg:flex">
            <Link href="/products">
              <ShoppingCart className="h-4 w-4" aria-hidden />
              View cart
            </Link>
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-border/60 p-2 text-muted-foreground md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {menuOpen ? (
        <div className="border-t border-border/60 bg-background/95 px-4 py-4 md:hidden">
          <form className="relative mb-4" action="/products" role="search">
            <Input
              name="q"
              placeholder="Search for products"
              className="h-11 rounded-full border-border/70 bg-muted/70 pl-4 pr-12 text-sm"
              aria-label="Search products"
            />
            <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full">
              <Search className="h-4 w-4" aria-hidden />
              <span className="sr-only">Search</span>
            </Button>
          </form>
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                  pathname === link.href ? "bg-muted/60 text-foreground" : undefined,
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {authLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={link.primary ? "default" : "outline"}
                size="sm"
                onClick={() => setMenuOpen(false)}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <Button asChild variant="outline" size="sm" onClick={() => setMenuOpen(false)}>
              <Link href="/products" className="inline-flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" aria-hidden />
                View cart
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
