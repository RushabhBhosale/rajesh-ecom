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

      {/* Search and Filters Section */}
      <section className="border-b border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                defaultValue={searchParams.search || ""}
              />
            </div>

            {/* Filters and Sorting */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <Select defaultValue={searchParams.category || "all"}>
                <SelectTrigger className="w-40 border-slate-300">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Condition Filter */}
              <Select defaultValue={searchParams.condition || "all"}>
                <SelectTrigger className="w-40 border-slate-300">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {conditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition === "refurbished" ? "Refurbished" : "New"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min ₹"
                  className="w-24 border-slate-300"
                  defaultValue={searchParams.minPrice || ""}
                />
                <span className="text-slate-400">-</span>
                <Input
                  type="number"
                  placeholder="Max ₹"
                  className="w-24 border-slate-300"
                  defaultValue={searchParams.maxPrice || ""}
                />
              </div>

              {/* Sort Options */}
              <Select defaultValue={searchParams.sort || "name-asc"}>
                <SelectTrigger className="w-44 border-slate-300">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="price-asc">Price Low to High</SelectItem>
                  <SelectItem value="price-desc">Price High to Low</SelectItem>
                  <SelectItem value="category-asc">Category A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {searchParams.search && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700"
              >
                Search: "{searchParams.search}"
                <button className="ml-2 hover:text-slate-900">×</button>
              </Badge>
            )}
            {searchParams.category && searchParams.category !== "all" && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700"
              >
                Category: {searchParams.category}
                <button className="ml-2 hover:text-slate-900">×</button>
              </Badge>
            )}
            {searchParams.condition && searchParams.condition !== "all" && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700"
              >
                Condition: {searchParams.condition}
                <button className="ml-2 hover:text-slate-900">×</button>
              </Badge>
            )}
            {(searchParams.minPrice || searchParams.maxPrice) && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700"
              >
                Price: ₹{searchParams.minPrice || "0"} - ₹
                {searchParams.maxPrice || "∞"}
                <button className="ml-2 hover:text-slate-900">×</button>
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="flex-1 bg-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Suspense
            fallback={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-96 animate-pulse rounded-lg bg-slate-200"
                  />
                ))}
              </div>
            }
          >
            {products.length ? (
              <>
                {/* Results Summary */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Showing {products.length} products
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>View:</span>
                    <button className="rounded border border-slate-300 p-1 hover:bg-slate-50">
                      <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
                        <div className="bg-slate-400"></div>
                        <div className="bg-slate-400"></div>
                        <div className="bg-slate-400"></div>
                        <div className="bg-slate-400"></div>
                      </div>
                    </button>
                    <button className="rounded border border-slate-300 p-1 hover:bg-slate-50">
                      <div className="flex h-4 w-4 flex-col gap-0.5">
                        <div className="h-1 bg-slate-400"></div>
                        <div className="h-1 bg-slate-400"></div>
                        <div className="h-1 bg-slate-400"></div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      id={product.id}
                      className="scroll-mt-24"
                    >
                      <ProductCard product={product} showCta={true} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-slate-300"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300 bg-slate-900 text-white"
                  >
                    1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                  >
                    2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                  >
                    3
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-300"
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-96 flex-col items-center justify-center text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <Package className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No products found
                </h3>
                <p className="mt-2 text-slate-600">
                  Try adjusting your search criteria or browse all categories.
                </p>
                <Button asChild className="mt-6" variant="outline">
                  <Link href="/products">View All Products</Link>
                </Button>
              </div>
            )}
          </Suspense>
        </div>
      </section>
    </main>
  );
}
