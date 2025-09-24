import Link from "next/link";
import { Suspense } from "react";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listProducts } from "@/lib/products";
import { Search, Filter, SlidersHorizontal, Package } from "lucide-react";
import { Label } from "@/components/ui/label";
import { listProductCategories, listProducts } from "@/lib/products";

export const metadata = {
  title: "Enterprise Products | Rajesh Renewed",
  description:
    "Browse our comprehensive catalog of certified refurbished enterprise technology. Search and filter by category, condition, and price.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    category?: string;
    condition?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}) {
  const products = await listProducts({});
interface ProductsPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const qParam = typeof searchParams?.q === "string" ? searchParams?.q : "";
  const categoryParam = typeof searchParams?.category === "string" ? searchParams?.category : "";
  const sortParam = typeof searchParams?.sort === "string" ? searchParams?.sort : "";
  const stockParam = typeof searchParams?.stock === "string" ? searchParams?.stock : "";
  const minPrice = parseNumber(typeof searchParams?.minPrice === "string" ? searchParams?.minPrice : undefined);
  const maxPrice = parseNumber(typeof searchParams?.maxPrice === "string" ? searchParams?.maxPrice : undefined);

  const sort = ["newest", "price-asc", "price-desc"].includes(sortParam) ? (sortParam as "newest" | "price-asc" | "price-desc") : "newest";
  const searchQuery = qParam.trim();
  const category = categoryParam.trim() || undefined;
  const inStockOnly = stockParam === "in-stock";

  const [products, categories] = await Promise.all([
    listProducts({
      searchQuery,
      category,
      sort,
      inStockOnly,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
    }),
    listProductCategories(),
  ]);

  const filtersActive = Boolean(
    searchQuery ||
      category ||
      inStockOnly ||
      (typeof minPrice === "number" && !Number.isNaN(minPrice)) ||
      (typeof maxPrice === "number" && !Number.isNaN(maxPrice)) ||
      sort !== "newest",
  );

  // Get unique categories and conditions for filters
  const categories = [...new Set(products.map((p) => p.category))];
  const conditions = [...new Set(products.map((p) => p.condition))];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Simplified Header */}
      <section className="border-b border-slate-200 bg-slate-50/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Enterprise Products
              </h1>
              <p className="mt-2 text-slate-600">
                {products.length} certified devices available
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-slate-300 text-slate-700"
            >
              <Link href="/register">Request Enterprise Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-24" id="catalogue">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Certified catalogue</h2>
            <p className="mx-auto max-w-3xl text-muted-foreground">
              Laptops, tablets, monitors, and accessories—all renewed, stress-tested, and backed by warranty.
            </p>
          </div>
          <form className="grid gap-6 rounded-3xl border border-border/60 bg-card/95 p-6 shadow-sm shadow-primary/5 sm:p-8" method="get">
            <div className="grid gap-4 md:grid-cols-[1fr_220px_200px]">
              <div className="space-y-2">
                <Label htmlFor="search">Search catalogue</Label>
                <Input
                  id="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search for models, accessories, or specifications"
                  className="h-11 rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={category ?? ""}
                  className="h-11 w-full rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Sort by</Label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort}
                  className="h-11 w-full rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="newest">Newest arrivals</option>
                  <option value="price-asc">Price: Low to high</option>
                  <option value="price-desc">Price: High to low</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Min price</Label>
                <Input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  min={0}
                  defaultValue={typeof minPrice === "number" ? String(minPrice) : ""}
                  placeholder="₹"
                  className="h-11 rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max price</Label>
                <Input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  min={0}
                  defaultValue={typeof maxPrice === "number" ? String(maxPrice) : ""}
                  placeholder="₹"
                  className="h-11 rounded-full"
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Availability</span>
                <label className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="stock"
                    value="in-stock"
                    defaultChecked={inStockOnly}
                    className="size-4 rounded border-border/70 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  In stock only
                </label>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button type="submit" className="rounded-full px-6">
                  Apply filters
                </Button>
                {filtersActive ? (
                  <Button asChild variant="ghost" type="button" className="rounded-full">
                    <Link href="/products">Reset</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </form>
          <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
              {products.length ? `${products.length} products` : "No products"}
            </p>
            {filtersActive ? (
              <p className="text-sm text-muted-foreground">
                Showing results that match your filters. Adjust the controls above to explore more inventory.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Browse curated refurbished hardware ready to deploy within 48 hours.
              </p>
            )}
          </div>
          {products.length ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} id={product.id} className="scroll-mt-24">
                  <ProductCard product={product} showCta={false} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/40 px-6 py-20 text-center text-muted-foreground">
              No products match your filters yet. Clear filters or check back soon for newly renewed hardware.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
