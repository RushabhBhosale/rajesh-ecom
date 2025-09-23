"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "#featured", label: "Highlights" },
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">R</span>
            Rajesh Renewed
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
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
        <div className="hidden items-center gap-2 md:flex">
          {authLinks.map((link) => (
            <Button key={link.href} asChild variant={link.primary ? "default" : "ghost"} size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
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
        <div className="border-t border-border/60 bg-background/95 px-6 py-4 md:hidden">
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
          </div>
        </div>
      ) : null}
    </header>
  );
}
