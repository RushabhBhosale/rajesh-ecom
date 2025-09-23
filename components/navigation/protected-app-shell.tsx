"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

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

export function ProtectedAppShell({ user, navLinks, children }: ProtectedAppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const links = navLinks.filter((link) => link.roles.includes(user.role));
  const homeHref = links[0]?.href ?? "/";

  return (
    <div className="flex min-h-screen bg-muted/10">
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/60 bg-background/95 px-6 py-8 shadow-sm transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/15 text-lg text-primary">
              R
            </span>
            Rajesh Control
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
        <div className="mt-8 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigation</p>
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary/10 text-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in</p>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-6">
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
              <p className="text-sm font-medium text-foreground">Welcome back</p>
              <p className="text-xs text-muted-foreground">
                Manage catalogue, accounts, and platform content from this admin panel.
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
        <main className="flex-1 overflow-y-auto bg-muted/10 px-6 py-10">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
