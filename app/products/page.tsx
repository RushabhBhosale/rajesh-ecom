import Link from "next/link";

import { ProductCard } from "@/components/products/product-card";
import { ProductsToolbar } from "@/components/products/products-toolbar";
import { ProductsSortControl } from "@/components/products/products-sort-control";
import { Button } from "@/components/ui/button";
import { getProductFacets, listProducts } from "@/lib/products";
import type { ProductCondition } from "@/lib/product-constants";
import { Package } from "lucide-react";

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
    q?: string;
    company?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    os?: string;
  };
}) {
  const facets = await getProductFacets();

  const allowedSortOptions = new Set([
    "name-asc",
    "name-desc",
    "price-asc",
    "price-desc",
    "category-asc",
    "company-asc",
    "processor-asc",
    "ram-asc",
    "storage-asc",
    "created-desc",
  ]);

  const rawSearch =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const fallbackSearch =
    typeof searchParams.q === "string" ? searchParams.q : undefined;
  const search = (rawSearch ?? fallbackSearch)?.trim();

  const rawCategory =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const category =
    rawCategory && facets.categories.includes(rawCategory)
      ? rawCategory
      : undefined;

  const rawCondition =
    typeof searchParams.condition === "string"
      ? searchParams.condition
      : undefined;
  const condition =
    rawCondition && facets.conditions.includes(rawCondition as ProductCondition)
      ? (rawCondition as ProductCondition)
      : undefined;

  const minPrice = Number.isFinite(
    Number.parseInt(searchParams.minPrice ?? "", 10)
  )
    ? Number.parseInt(searchParams.minPrice as string, 10)
    : undefined;

  const maxPrice = Number.isFinite(
    Number.parseInt(searchParams.maxPrice ?? "", 10)
  )
    ? Number.parseInt(searchParams.maxPrice as string, 10)
    : undefined;

  const rawCompany =
    typeof searchParams.company === "string"
      ? searchParams.company
      : undefined;
  const companyId = facets.companies.some((item) => item.id === rawCompany)
    ? rawCompany
    : undefined;

  const rawProcessor =
    typeof searchParams.processor === "string"
      ? searchParams.processor
      : undefined;
  const processorId = facets.processors.some((item) => item.id === rawProcessor)
    ? rawProcessor
    : undefined;

  const rawRam =
    typeof searchParams.ram === "string" ? searchParams.ram : undefined;
  const ramId = facets.rams.some((item) => item.id === rawRam)
    ? rawRam
    : undefined;

  const rawStorage =
    typeof searchParams.storage === "string"
      ? searchParams.storage
      : undefined;
  const storageId = facets.storages.some((item) => item.id === rawStorage)
    ? rawStorage
    : undefined;

  const rawGraphics =
    typeof searchParams.graphics === "string"
      ? searchParams.graphics
      : undefined;
  const graphicsId = facets.graphics.some((item) => item.id === rawGraphics)
    ? rawGraphics
    : undefined;

  const rawOs = typeof searchParams.os === "string" ? searchParams.os : undefined;
  const osId = facets.operatingSystems.some((item) => item.id === rawOs)
    ? rawOs
    : undefined;

  const sort:any =
    typeof searchParams.sort === "string" &&
    allowedSortOptions.has(searchParams.sort)
      ? searchParams.sort
      : undefined;

  const products = await listProducts({
    search,
    category,
    condition,
    minPrice,
    maxPrice,
    companyId,
    processorId,
    ramId,
    storageId,
    graphicsId,
    osId,
    sort,
  });

  const filterSnapshot = {
    search: search ?? undefined,
    category: category ?? undefined,
    condition: condition ?? undefined,
    minPrice: typeof minPrice === "number" ? String(minPrice) : undefined,
    maxPrice: typeof maxPrice === "number" ? String(maxPrice) : undefined,
    company: companyId ?? undefined,
    processor: processorId ?? undefined,
    ram: ramId ?? undefined,
    storage: storageId ?? undefined,
    graphics: graphicsId ?? undefined,
    os: osId ?? undefined,
    sort: sort ?? undefined,
  };

  const emptyState = !products.length;

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* <section className="relative border-b border-slate-200/80 bg-white/90 py-12 backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,theme(colors.slate.200/40),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Enterprise Catalog
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Purpose-Built Hardware for Modern Teams
              </h1>
              <p className="text-lg text-slate-600">
                Explore certified refurbished and factory-sealed devices with transparent pricing, condition insight, and fast deployment support.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Available inventory
                </p>
                <p className="text-4xl font-bold text-slate-900">{products.length}</p>
                <p className="text-sm text-slate-500">
                  Devices ready for immediate procurement
                </p>
              </div>
              <Button asChild className="rounded-full px-6">
                <Link href="/register">Request enterprise pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section> */}

      <section className="flex-1 py-10">
        <div className="mx-auto px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            <ProductsToolbar
              categories={facets.categories}
              conditions={facets.conditions}
              masterOptions={{
                companies: facets.companies,
                processors: facets.processors,
                rams: facets.rams,
                storages: facets.storages,
                graphics: facets.graphics,
                operatingSystems: facets.operatingSystems,
              }}
              filters={filterSnapshot}
              resultCount={products.length}
            />

            <div className="space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Showing {products.length} curated devices
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Enterprise hardware ready to deploy
                  </h2>
                </div>
                <ProductsSortControl sort={filterSnapshot.sort} />
              </div>

              {emptyState ? (
                <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center shadow-sm">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-slate-100">
                    <Package className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                    No products match your filters yet
                  </h3>
                  <p className="mt-3 text-base text-slate-600">
                    Adjust your filters or reset them to explore the full catalog.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      asChild
                      className="rounded-full border-slate-300"
                    >
                      <Link href="/products">Clear filters</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      id={product.id}
                      className="scroll-mt-28"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
