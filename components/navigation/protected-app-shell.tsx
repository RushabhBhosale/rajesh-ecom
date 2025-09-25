"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";
import type { Role } from "@/models/user";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  roles: Role[];
}

interface ProtectedAppShellProps {
  user: SessionUser;
  navLinks: NavLink[];
  children: React.ReactNode;
}

export function ProtectedAppShell({
  user,
  navLinks,
  children,
}: ProtectedAppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const links = navLinks.filter((link) => link.roles.includes(user.role));
  const homeHref = links[0]?.href ?? "/";

  const activeHref = useMemo(() => {
    const matches = links
      .filter(
        (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
      )
      .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href ?? pathname;
  }, [links, pathname]);

  return (
    <div className="flex min-h-screen bg-muted/10">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* SIDEBAR */}
      <aside
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/60 bg-gradient-to-b from-background via-background/95 to-background shadow-lg transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top brand + close on mobile */}
        <div className="flex items-center justify-between px-6 py-3">
          <Link
            href={homeHref}
            className="group flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/15 text-lg text-primary">
              R
            </span>
            <span className="tracking-tight">Rajesh Control</span>
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-border/60 p-2 text-muted-foreground md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Thin divider */}
        <div className="mx-6 mb-2 h-px bg-border/70" />

        {/* NAV (scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Navigation
          </p>
          <nav className="flex flex-col gap-1.5">
            {links.map((link: any) => {
              const isActive = link.href === activeHref;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    {/* left active accent bar */}
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-60"
                      )}
                    />
                    {Icon ? (
                      <Icon
                        className={cn(
                          "h-4.5 w-4.5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "mr-0.5 inline-block h-1.5 w-1.5 rounded-full",
                          isActive ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      />
                    )}
                    <span>{link.label}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {link.badge !== undefined ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                        {link.badge}
                      </span>
                    ) : null}
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isActive
                          ? "translate-x-0 text-primary"
                          : "translate-x-0 group-hover:translate-x-0.5"
                      )}
                    />
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER (sticky) */}
        <div className="mt-auto border-t border-border/60 bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name}
              </p>
              <p className="truncate text-[11px] capitalize text-muted-foreground">
                {user.role}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border/60 p-2 text-muted-foreground md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">
                Welcome back
              </p>
              <p className="text-xs text-muted-foreground">
                Manage catalogue, accounts, and platform content.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm font-medium text-muted-foreground md:flex">
            <span>Need help?</span>
            <Button asChild size="sm" variant="outline">
              <Link href="/">View storefront</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/10 px-6 py-4">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
