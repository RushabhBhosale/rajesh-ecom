"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  group?: string;
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

  const isLinkMatch = useMemo(
    () => (href: string) => {
      if (pathname === href) return true;
      if (href === "/") return pathname === "/";
      return pathname.startsWith(`${href}/`);
    },
    [pathname]
  );

  const activeHref = useMemo(() => {
    const matches = links
      .filter((link) => isLinkMatch(link.href))
      .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href ?? pathname;
  }, [isLinkMatch, links, pathname]);

  const grouped = useMemo(() => {
    const groups = new Map<string, NavLink[]>();
    const order: string[] = [];
    const solo: NavLink[] = [];
    links.forEach((link) => {
      if (link.group) {
        if (!groups.has(link.group)) {
          groups.set(link.group, []);
          order.push(link.group);
        }
        groups.get(link.group)!.push(link);
      } else {
        solo.push(link);
      }
    });
    return { groups, solo, order };
  }, [links]);

  function buildExpanded(): Record<string, boolean> {
    const expanded: Record<string, boolean> = {};
    grouped.groups.forEach((items, group) => {
      expanded[group] = items.some((item) => isLinkMatch(item.href));
    });
    return expanded;
  }

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => buildExpanded()
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      grouped.groups.forEach((items, group) => {
        const hasActive = items.some((item) => isLinkMatch(item.href));
        if (next[group] === undefined) {
          next[group] = hasActive;
          changed = true;
        } else if (hasActive && !next[group]) {
          next[group] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [grouped.groups, isLinkMatch]);

  function toggleGroup(group: string) {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  const firstName = user.name?.split(" ")[0] ?? "there";
  const userInitial = user.name?.charAt(0)?.toUpperCase() ?? "U";

  useEffect(() => {
    function handlePointer(event: PointerEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background via-muted/40 to-muted/60">
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/60 bg-gradient-to-b from-background via-background/95 to-muted/60 shadow-xl transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 py-3">
          <Link
            href={homeHref}
            className="group flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary shadow-sm">
              R
            </span>
            <span className="tracking-tight">Rajesh Control</span>
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-border/60 bg-background/60 p-2 text-muted-foreground md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mx-6 mb-2 h-px bg-border/70" />

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Navigation
          </p>
          <nav className="flex flex-col gap-1.5">
            {grouped.order.map((group) => {
              const items = grouped.groups.get(group) ?? [];
              const isOpen = expandedGroups[group];
              const hasActive = items.some((item) => item.href === activeHref);
              return (
                <div key={group} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                      hasActive
                        ? "bg-primary/10 text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <span>{group}</span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen ? "rotate-90 text-primary" : "text-muted-foreground"
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="space-y-1 pl-3">
                      {items.map((link) => {
                        const isActive = activeHref === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setSidebarOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                              isActive
                                ? "bg-primary/10 text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <span className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all",
                                  isActive
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-60"
                                )}
                              />
                              <span
                                className={cn(
                                  "mr-0.5 inline-block h-1.5 w-1.5 rounded-full",
                                  isActive ? "bg-primary" : "bg-muted-foreground/50"
                                )}
                              />
                              <span>{link.label}</span>
                            </span>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isActive
                                  ? "translate-x-0 text-primary"
                                  : "translate-x-0 group-hover:translate-x-0.5"
                              )}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {grouped.solo.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-60"
                      )}
                    />
                    <span
                      className={cn(
                        "mr-0.5 inline-block h-1.5 w-1.5 rounded-full",
                        isActive ? "bg-primary" : "bg-muted-foreground/50"
                      )}
                    />
                    <span>{link.label}</span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isActive
                        ? "translate-x-0 text-primary"
                        : "translate-x-0 group-hover:translate-x-0.5"
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-gradient-to-r from-background via-background/95 to-muted/60 px-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border/60 bg-background/60 p-2 text-muted-foreground md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </button>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Welcome back, {firstName}
              </p>
              <p className="text-xs text-muted-foreground">
                Manage catalogue, accounts, orders, and platform content.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/70 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
              >
                {userInitial}
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-3 pb-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button asChild size="sm" variant="ghost" className="w-full justify-start">
                      <Link href="/">View storefront</Link>
                    </Button>
                    <LogoutButton
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onLogout={() => setUserMenuOpen(false)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="rounded-2xl border border-border/60 bg-background/95 p-4 shadow-sm sm:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
