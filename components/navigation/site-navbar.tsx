"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import type { ProductSummary } from "@/lib/products";
import { defaultStoreSettings, type StoreSettings } from "@/lib/store-settings";
import { cn } from "@/lib/utils";
import { brandName } from "@/utils/variable";
import {
  useCartStore,
  useCartHydration,
  selectItemCount,
} from "@/lib/stores/cart-store";

const navLinks = [
  // { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  // { href: "/about", label: "About" },
  // { href: "/contact", label: "Contact" },
];

const authLinks = [
  { href: "/login", label: "Sign in", primary: true },
  // { href: "/register", label: "Create account", primary: true },
];

export function SiteNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [topBarSettings, setTopBarSettings] = useState(
    () => ({
      enabled: defaultStoreSettings.topBarEnabled,
      message: defaultStoreSettings.topBarMessage,
      ctaText: defaultStoreSettings.topBarCtaText,
      ctaHref: defaultStoreSettings.topBarCtaHref,
    }),
  );
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchRef = useRef<HTMLFormElement | null>(null);
  const mobileSearchRef = useRef<HTMLFormElement | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedCart = useCartHydration();
  const itemCount = useCartStore(selectItemCount);
  const cartCount = hasHydratedCart ? Math.min(itemCount, 99) : 0;

  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/superadmin");
  const shouldHide = isAdminArea;

  useEffect(() => {
    if (isAdminArea) {
      setCurrentUser(null);
      setIsFetchingUser(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function fetchUser() {
      setIsFetchingUser(true);
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setCurrentUser(null);
          return;
        }

        const data: { user: SessionUser | null } = await response.json();
        setCurrentUser(data.user ?? null);
      } catch (error) {
        if (
          isActive &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setCurrentUser(null);
        }
      } finally {
        if (isActive) {
          setIsFetchingUser(false);
        }
      }
    }

    void fetchUser();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isAdminArea, pathname]);

  useEffect(() => {
    if (isAdminArea) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function fetchTopBarSettings() {
      try {
        const response = await fetch("/api/settings", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok || !isActive) {
          return;
        }

        const data: { settings?: Partial<StoreSettings> } = await response.json();
        const next = data?.settings;
        if (!next || !isActive) {
          return;
        }

        setTopBarSettings({
          enabled: Boolean(next.topBarEnabled ?? defaultStoreSettings.topBarEnabled),
          message:
            typeof next.topBarMessage === "string" && next.topBarMessage.trim().length > 0
              ? next.topBarMessage
              : defaultStoreSettings.topBarMessage,
          ctaText:
            typeof next.topBarCtaText === "string" && next.topBarCtaText.trim().length > 0
              ? next.topBarCtaText
              : defaultStoreSettings.topBarCtaText,
          ctaHref:
            typeof next.topBarCtaHref === "string" && next.topBarCtaHref.startsWith("/")
              ? next.topBarCtaHref
              : defaultStoreSettings.topBarCtaHref,
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setTopBarSettings({
            enabled: defaultStoreSettings.topBarEnabled,
            message: defaultStoreSettings.topBarMessage,
            ctaText: defaultStoreSettings.topBarCtaText,
            ctaHref: defaultStoreSettings.topBarCtaHref,
          });
        }
      }
    }

    void fetchTopBarSettings();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isAdminArea, pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const query = searchTerm.trim();

    if (!query) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
        searchAbortRef.current = null;
      }
      setSuggestions([]);
      setIsSearching(false);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);

    let isActive = true;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }

      const controller = new AbortController();
      searchAbortRef.current = controller;
      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=6`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Unable to search products");
        }
        const data = await response.json();
        if (!isActive) {
          return;
        }
        setSuggestions(Array.isArray(data?.products) ? data.products : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (isActive) {
          setSuggestions([]);
        }
      } finally {
        if (isActive) {
          setIsSearching(false);
        }
        searchAbortRef.current = null;
      }
    }, 1000);

    return () => {
      isActive = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
        searchAbortRef.current = null;
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const targets = [desktopSearchRef.current, mobileSearchRef.current];
      const clickedInside = targets.some(
        (target) => target && target.contains(event.target as Node),
      );
      if (!clickedInside) {
        setShowSuggestions(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setShowSuggestions(false);
    setSearchTerm("");
    setSuggestions([]);
    setIsSearching(false);
  }, [pathname]);

  const accountLink = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    if (currentUser.role === "superadmin") {
      return { href: "/superadmin", label: "Super admin" };
    }

    if (currentUser.role === "admin") {
      return { href: "/admin", label: "Dashboard" };
    }

    if (currentUser.role === "user") {
      return { href: "/dashboard/orders", label: "My orders" };
    }

    return null;
  }, [currentUser]);

  const userInitial = useMemo(() => {
    if (!currentUser) {
      return "";
    }

    const source = currentUser.name || currentUser.email || "";
    return source.charAt(0).toUpperCase();
  }, [currentUser]);

  const hasQuery = searchTerm.trim().length > 0;

  const renderSuggestions = (variant: "desktop" | "mobile") => {
    if (!showSuggestions || !hasQuery) {
      return null;
    }

    return (
      <div
        className={cn(
          "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white/95 shadow-xl backdrop-blur-sm",
          variant === "mobile" ? "max-h-72" : "max-h-96",
        )}
      >
        <div className="divide-y divide-neutral-200">
          {isSearching ? (
            <p className="px-4 py-3 text-sm text-neutral-500">
              Searching products...
            </p>
          ) : suggestions.length ? (
            suggestions.map((product) => {
              const taxonomy = [product.company?.name, product.category]
                .filter(Boolean)
                .join(" • ");
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex items-start gap-3 px-4 py-3 text-sm transition hover:bg-neutral-100/70"
                  onClick={() => {
                    setShowSuggestions(false);
                    setMenuOpen(false);
                  }}
                >
                  <div className="flex-1 space-y-1">
                    <p className="line-clamp-2 font-semibold text-neutral-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {taxonomy || "View product"}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs font-semibold text-neutral-900">
                    {formatCurrency(product.price)}
                  </span>
                </Link>
              );
            })
          ) : (
            <p className="px-4 py-3 text-sm text-neutral-500">
              No matching products yet
            </p>
          )}
        </div>
      </div>
    );
  };

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {topBarSettings.enabled ? (
        <div className="hidden border-b border-neutral-200 bg-white text-neutral-700 md:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-xs font-semibold">
            <p>{topBarSettings.message}</p>
            <Link
              href={topBarSettings.ctaHref}
              className="inline-flex items-center gap-1 text-neutral-600 underline-offset-4 transition-colors hover:text-neutral-900 hover:underline"
            >
              {topBarSettings.ctaText}
            </Link>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold text-neutral-900"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-neutral-900 text-white">
                R
              </span>
              {brandName}
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-500 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-neutral-900",
                    pathname === link.href ? "text-neutral-900" : undefined,
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <form
            ref={desktopSearchRef}
            className="relative hidden flex-1 max-w-md lg:max-w-2xl md:block"
            action="/products"
            role="search"
          >
            <Search
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden
            />
            <Input
              name="q"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (hasQuery) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Search for laptops, tablets, accessories..."
              className="h-11 rounded-full border-neutral-200 bg-white/80 pl-10 pr-14 text-sm"
              aria-label="Search products"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span className="sr-only">Search</span>
            </Button>
            {renderSuggestions("desktop")}
          </form>
          <div className="hidden items-center gap-2 md:flex">
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isFetchingUser && "opacity-75",
                  )}
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Account options"
                  disabled={isFetchingUser}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-900">
                    {userInitial || "U"}
                  </span>
                  <span className="hidden max-w-[140px] truncate md:inline">
                    {currentUser.name || currentUser.email}
                  </span>
                </button>
                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white/95 p-2 text-sm shadow-lg"
                  >
                    <div className="space-y-1 rounded-md bg-neutral-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Signed in
                      </p>
                      <p className="truncate font-semibold text-neutral-900">
                        {currentUser.name || currentUser.email}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {currentUser.email}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Link href="/dashboard/profile">Profile & addresses</Link>
                    </Button>
                    {accountLink ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full justify-start"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Link href={accountLink.href}>{accountLink.label}</Link>
                      </Button>
                    ) : null}
                    <LogoutButton
                      variant="ghost"
                      size="sm"
                      className="mt-1 w-full justify-start"
                      onLogout={() => {
                        setUserMenuOpen(false);
                        setCurrentUser(null);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : isFetchingUser ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-neutral-200" />
            ) : (
              authLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant={link.primary ? "default" : "ghost"}
                  size="sm"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="relative hidden items-center gap-2 rounded-full lg:flex h-11"
            >
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4" aria-hidden />
                View cart
                {cartCount > 0 ? (
                  <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </Button>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-neutral-200 p-2 text-neutral-600 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-900/45"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            className="absolute inset-y-0 right-0 flex h-full w-[calc(100%-20px)] max-w-sm flex-col overflow-y-auto border-l border-neutral-200 bg-white p-4 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Menu
              </p>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-neutral-200 p-2 text-neutral-600"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <form
              ref={mobileSearchRef}
              className="relative mb-4"
              action="/products"
              role="search"
            >
              <Input
                name="q"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (hasQuery) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Search for products"
                className="h-11 rounded-full border-neutral-200 bg-white/80 pl-4 pr-12 text-sm"
                aria-label="Search products"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="sr-only">Search</span>
              </Button>
              {renderSuggestions("mobile")}
            </form>
            <nav className="flex flex-col gap-3 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-md px-2 py-1 text-neutral-600 transition-colors hover:bg-neutral-100/70 hover:text-neutral-900",
                    pathname === link.href
                      ? "bg-neutral-100/70 text-neutral-900"
                      : undefined,
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 pb-2">
              {currentUser ? (
                <>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-sm">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Signed in
                    </p>
                    <p className="font-semibold text-neutral-900">
                      {currentUser.name || currentUser.email}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {currentUser.email}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    onClick={() => setMenuOpen(false)}
                    className="justify-start"
                  >
                    <Link href="/dashboard/profile">Profile & addresses</Link>
                  </Button>
                  {accountLink ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      onClick={() => setMenuOpen(false)}
                      className="justify-start"
                    >
                      <Link href={accountLink.href}>{accountLink.label}</Link>
                    </Button>
                  ) : null}
                  <LogoutButton
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onLogout={() => {
                      setMenuOpen(false);
                      setCurrentUser(null);
                    }}
                  />
                </>
              ) : isFetchingUser ? (
                <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
              ) : (
                authLinks.map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant={link.primary ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-between"
              >
                <Link
                  href="/cart"
                  className="inline-flex w-full items-center justify-between gap-2"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    View cart
                  </span>
                  {cartCount > 0 ? (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                      {cartCount}
                    </span>
                  ) : null}
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
