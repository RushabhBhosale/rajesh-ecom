import Link from "next/link";
import { Suspense } from "react";

import { ProductCard } from "@/components/products/product-card";
import { ProductsToolbar } from "@/components/products/products-toolbar";
import { ProductsSortControl } from "@/components/products/products-sort-control";
import { Button } from "@/components/ui/button";
import { getProductFacets, listProducts, type ListProductsOptions } from "@/lib/products";
import type { ProductCondition } from "@/lib/product-constants";
import { brandName } from "@/utils/variable";
import { Package } from "lucide-react";

function normalizeToken(value?: string | null) {
  return value?.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "") ?? "";
}

export const metadata = {
  title: `Enterprise Products | ${brandName}`,
  description:
    "Browse our comprehensive catalog of certified refurbished enterprise technology. Search and filter by category, condition, and price.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    categoryName?: string;
    condition?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
    company?: string;
    companyName?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    graphics?: string;
    os?: string;
    companySubMaster?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
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
    typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;
  const fallbackSearch =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const search = (rawSearch ?? fallbackSearch)?.trim();

  const rawCategory =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : undefined;
  const rawCategoryName =
    typeof resolvedSearchParams.categoryName === "string"
      ? resolvedSearchParams.categoryName
      : undefined;

  const matchCategory = (value?: string) => {
    if (!value) {
      return undefined;
    }
    if (facets.categories.includes(value)) {
      return value;
    }
    const normalized = normalizeToken(value);
    if (!normalized) {
      return undefined;
    }
    return facets.categories.find(
      (categoryOption) => normalizeToken(categoryOption) === normalized
    );
  };
  const category = matchCategory(rawCategory) ?? matchCategory(rawCategoryName);

  const rawCondition =
    typeof resolvedSearchParams.condition === "string"
      ? resolvedSearchParams.condition
      : undefined;
  const condition =
    rawCondition && facets.conditions.includes(rawCondition as ProductCondition)
      ? (rawCondition as ProductCondition)
      : undefined;

  const minPrice = Number.isFinite(
    Number.parseInt(resolvedSearchParams.minPrice ?? "", 10)
  )
    ? Number.parseInt(resolvedSearchParams.minPrice as string, 10)
    : undefined;

  const maxPrice = Number.isFinite(
    Number.parseInt(resolvedSearchParams.maxPrice ?? "", 10)
  )
    ? Number.parseInt(resolvedSearchParams.maxPrice as string, 10)
    : undefined;

  const rawCompany =
    typeof resolvedSearchParams.company === "string"
      ? resolvedSearchParams.company
      : undefined;
  const rawCompanyName =
    typeof resolvedSearchParams.companyName === "string"
      ? resolvedSearchParams.companyName
      : undefined;
  const rawCompanySub =
    typeof resolvedSearchParams.companySubMaster === "string"
      ? resolvedSearchParams.companySubMaster
      : undefined;
  const subMasterOption = rawCompanySub
    ? facets.companySubMasters.find((item) => item.id === rawCompanySub)
    : undefined;
  const matchCompanyId = (value?: string) => {
    if (!value) {
      return undefined;
    }
    const direct = facets.companies.find((item) => item.id === value);
    if (direct) {
      return direct.id;
    }
    const token = normalizeToken(value);
    if (!token) {
      return undefined;
    }
    const match = facets.companies.find(
      (item) => normalizeToken(item.name) === token
    );
    return match?.id;
  };
  const companyId =
    matchCompanyId(rawCompany) ??
    matchCompanyId(rawCompanyName) ??
    subMasterOption?.masterId;
  const companySubMasterId =
    subMasterOption && subMasterOption.masterId === companyId
      ? subMasterOption.id
      : undefined;

  const rawProcessor =
    typeof resolvedSearchParams.processor === "string"
      ? resolvedSearchParams.processor
      : undefined;
  const processorId = facets.processors.some((item) => item.id === rawProcessor)
    ? rawProcessor
    : undefined;

  const rawRam =
    typeof resolvedSearchParams.ram === "string" ? resolvedSearchParams.ram : undefined;
  const ramId = facets.rams.some((item) => item.id === rawRam)
    ? rawRam
    : undefined;

  const rawStorage =
    typeof resolvedSearchParams.storage === "string"
      ? resolvedSearchParams.storage
      : undefined;
  const storageId = facets.storages.some((item) => item.id === rawStorage)
    ? rawStorage
    : undefined;

  const rawGraphics =
    typeof resolvedSearchParams.graphics === "string"
      ? resolvedSearchParams.graphics
      : undefined;
  const graphicsId = facets.graphics.some((item) => item.id === rawGraphics)
    ? rawGraphics
    : undefined;

  const rawOs = typeof resolvedSearchParams.os === "string" ? resolvedSearchParams.os : undefined;
  const osId = facets.operatingSystems.some((item) => item.id === rawOs)
    ? rawOs
    : undefined;

  const sort: ListProductsOptions["sort"] =
    typeof resolvedSearchParams.sort === "string" &&
    allowedSortOptions.has(resolvedSearchParams.sort)
      ? (resolvedSearchParams.sort as ListProductsOptions["sort"])
      : undefined;

  const products = await listProducts({
    search,
    category,
    condition,
    minPrice,
    maxPrice,
    companyId,
    companySubMasterId,
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
    companySubMaster: companySubMasterId ?? undefined,
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
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading filters…</div>}>
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
                priceRange={facets.priceRange}
                companySubMasters={facets.companySubMasters}
                filters={filterSnapshot}
                resultCount={products.length}
              />
            </Suspense>

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
                <Suspense fallback={<div className="text-sm text-muted-foreground">Loading sort…</div>}>
                  <ProductsSortControl sort={filterSnapshot.sort} />
                </Suspense>
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
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
