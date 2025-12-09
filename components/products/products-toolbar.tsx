"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MasterOptionSummary } from "@/lib/master-constants";

interface PriceRange {
  minPrice: number;
  maxPrice: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  company?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  os?: string;
  sort?: string;
}

interface MasterOptionsByType {
  companies: MasterOptionSummary[];
  processors: MasterOptionSummary[];
  rams: MasterOptionSummary[];
  storages: MasterOptionSummary[];
  graphics: MasterOptionSummary[];
  operatingSystems: MasterOptionSummary[];
}

interface ProductsToolbarProps {
  categories: string[];
  conditions: string[];
  priceRange: PriceRange;
  masterOptions: MasterOptionsByType;
  filters: ProductFilters;
  resultCount: number;
}

export function ProductsToolbar({
  categories,
  conditions,
  priceRange,
  masterOptions,
  filters,
  resultCount,
}: ProductsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [minPriceValue, setMinPriceValue] = useState(filters.minPrice ?? "");
  const [maxPriceValue, setMaxPriceValue] = useState(filters.maxPrice ?? "");

  useEffect(() => {
    setSearchValue(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    setMinPriceValue(filters.minPrice ?? "");
  }, [filters.minPrice]);

  useEffect(() => {
    setMaxPriceValue(filters.maxPrice ?? "");
  }, [filters.maxPrice]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (params.has("q")) {
        params.delete("q");
      }

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const queryString = params.toString();
      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchValue.trim();
      updateParams({ search: trimmed.length ? trimmed : null });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchValue, updateParams]);

  const handlePriceCommit = useCallback(
    (key: "minPrice" | "maxPrice", raw: string) => {
      const cleaned = raw.trim();
      if (!cleaned) {
        updateParams({ [key]: null });
        return;
      }
      const numeric = Number.parseInt(cleaned, 10);
      if (Number.isNaN(numeric)) {
        updateParams({ [key]: null });
        return;
      }
      updateParams({ [key]: String(Math.max(0, numeric)) });
    },
    [updateParams]
  );

  const activeFilters = useMemo(() => {
    const items: any = [];

    const findName = (list: MasterOptionSummary[], id?: string | null) =>
      list.find((item) => item.id === id)?.name ?? null;

    if (filters.search) {
      items.push({ key: "search", label: `Search: "${filters.search}"` });
    }
    if (filters.category && filters.category !== "all") {
      items.push({ key: "category", label: `Category: ${filters.category}` });
    }
    if (filters.condition && filters.condition !== "all") {
      items.push({
        key: "condition",
        label: `Condition: ${filters.condition}`,
      });
    }
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ?? "0";
      const max = filters.maxPrice ?? "∞";
      items.push({ key: "price", label: `Price: ₹${min} - ₹${max}` });
    }
    if (filters.company) {
      const label = findName(masterOptions.companies, filters.company);
      items.push({ key: "company", label: `Company: ${label ?? filters.company}` });
    }
    if (filters.processor) {
      const label = findName(masterOptions.processors, filters.processor);
      items.push({ key: "processor", label: `Processor: ${label ?? filters.processor}` });
    }
    if (filters.ram) {
      const label = findName(masterOptions.rams, filters.ram);
      items.push({ key: "ram", label: `RAM: ${label ?? filters.ram}` });
    }
    if (filters.storage) {
      const label = findName(masterOptions.storages, filters.storage);
      items.push({ key: "storage", label: `Storage: ${label ?? filters.storage}` });
    }
    if (filters.graphics) {
      const label = findName(masterOptions.graphics, filters.graphics);
      items.push({ key: "graphics", label: `Graphics: ${label ?? filters.graphics}` });
    }
    if (filters.os) {
      const label = findName(masterOptions.operatingSystems, filters.os);
      items.push({ key: "os", label: `OS: ${label ?? filters.os}` });
    }
    if (filters.sort && filters.sort !== "created-desc") {
      items.push({ key: "sort", label: `Sort: ${filters.sort}` });
    }
    return items;
  }, [
    filters.category,
    filters.condition,
    filters.maxPrice,
    filters.minPrice,
    filters.company,
    filters.processor,
    filters.ram,
    filters.storage,
    filters.graphics,
    filters.os,
    filters.search,
    filters.sort,
    masterOptions.companies,
    masterOptions.processors,
    masterOptions.rams,
    masterOptions.storages,
    masterOptions.graphics,
    masterOptions.operatingSystems,
  ]);

  return (
    <section className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
            <div className="relative w-full max-w-[250px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-11 rounded-full border-slate-300 pl-11 pr-12 text-sm focus-visible:ring-slate-500"
                aria-label="Search products"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={filters.category ?? "all"}
                onValueChange={(value) =>
                  updateParams({ category: value === "all" ? null : value })
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.condition ?? "all"}
                onValueChange={(value) =>
                  updateParams({ condition: value === "all" ? null : value })
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
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

              <Select
                value={filters.company ?? "all"}
                onValueChange={(value) =>
                  updateParams({ company: value === "all" ? null : value })
                }
                disabled={isPending || masterOptions.companies.length === 0}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {masterOptions.companies.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.processor ?? "all"}
                onValueChange={(value) =>
                  updateParams({ processor: value === "all" ? null : value })
                }
                disabled={isPending || masterOptions.processors.length === 0}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
                  <SelectValue placeholder="Processor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Processors</SelectItem>
                  {masterOptions.processors.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.ram ?? "all"}
                onValueChange={(value) =>
                  updateParams({ ram: value === "all" ? null : value })
                }
                disabled={isPending || masterOptions.rams.length === 0}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
                  <SelectValue placeholder="RAM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RAM</SelectItem>
                  {masterOptions.rams.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.storage ?? "all"}
                onValueChange={(value) =>
                  updateParams({ storage: value === "all" ? null : value })
                }
                disabled={isPending || masterOptions.storages.length === 0}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
                  <SelectValue placeholder="Storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Storage</SelectItem>
                  {masterOptions.storages.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.graphics ?? "all"}
                onValueChange={(value) =>
                  updateParams({ graphics: value === "all" ? null : value })
                }
                disabled={isPending || masterOptions.graphics.length === 0}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
                  <SelectValue placeholder="Graphics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Graphics</SelectItem>
                  {masterOptions.graphics.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.os ?? "all"}
                onValueChange={(value) =>
                  updateParams({ os: value === "all" ? null : value })
                }
                disabled={isPending || masterOptions.operatingSystems.length === 0}
              >
                <SelectTrigger className="h-11 min-w-[9.5rem] rounded-full border-slate-300">
                  <SelectValue placeholder="Operating system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operating systems</SelectItem>
                  {masterOptions.operatingSystems.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 shadow-sm">
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ₹<span>Price</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Input
                    inputMode="numeric"
                    value={minPriceValue}
                    onChange={(event) => setMinPriceValue(event.target.value)}
                    onBlur={(event) =>
                      handlePriceCommit("minPrice", event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handlePriceCommit(
                          "minPrice",
                          (event.target as HTMLInputElement).value
                        );
                      }
                    }}
                    placeholder={
                      priceRange.minPrice ? `${priceRange.minPrice}` : "Min"
                    }
                    className="h-8 w-20 border-0 bg-transparent text-slate-700 placeholder:text-slate-400 focus-visible:ring-0"
                    aria-label="Minimum price"
                  />
                  <span className="text-slate-400">–</span>
                  <Input
                    inputMode="numeric"
                    value={maxPriceValue}
                    onChange={(event) => setMaxPriceValue(event.target.value)}
                    onBlur={(event) =>
                      handlePriceCommit("maxPrice", event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handlePriceCommit(
                          "maxPrice",
                          (event.target as HTMLInputElement).value
                        );
                      }
                    }}
                    placeholder={
                      priceRange.maxPrice ? `${priceRange.maxPrice}` : "Max"
                    }
                    className="h-8 w-10 border-0 bg-transparent text-slate-700 placeholder:text-slate-400 focus-visible:ring-0"
                    aria-label="Maximum price"
                  />
                </div>
              </div> */}

              <Select
                value={filters.sort ?? "created-desc"}
                onValueChange={(value) =>
                  updateParams({
                    sort: value === "created-desc" ? null : value,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-11 min-w-[10rem] rounded-full border-slate-300">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created-desc">Newest first</SelectItem>
                  <SelectItem value="name-asc">Name A–Z</SelectItem>
                  <SelectItem value="name-desc">Name Z–A</SelectItem>
                  <SelectItem value="price-asc">Price: Low → High</SelectItem>
                  <SelectItem value="price-desc">Price: High → Low</SelectItem>
                  <SelectItem value="category-asc">Category A–Z</SelectItem>
                  <SelectItem value="company-asc">Company A–Z</SelectItem>
                  <SelectItem value="processor-asc">Processor A–Z</SelectItem>
                  <SelectItem value="ram-asc">RAM A–Z</SelectItem>
                  <SelectItem value="storage-asc">Storage A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="self-start text-slate-500 hover:text-slate-900"
            onClick={() => {
              setSearchValue("");
              setMinPriceValue("");
              setMaxPriceValue("");
              updateParams({
                search: null,
                category: null,
                condition: null,
                minPrice: null,
                maxPrice: null,
                company: null,
                processor: null,
                ram: null,
                storage: null,
                graphics: null,
                os: null,
                sort: null,
              });
            }}
            disabled={isPending}
          >
            Clear filters
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </Badge> */}
          {activeFilters.map((item: any) => (
            <Badge
              key={item.key}
              variant="outline"
              className="flex items-center gap-1 border-slate-300 bg-white text-slate-700"
            >
              {item.label}
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                onClick={() => {
                  if (item.key === "price") {
                    setMinPriceValue("");
                    setMaxPriceValue("");
                    updateParams({ minPrice: null, maxPrice: null });
                    return;
                  }

                  if (item.key === "search") {
                    setSearchValue("");
                    updateParams({ search: null });
                    return;
                  }

                  if (item.key === "sort") {
                    updateParams({ sort: null });
                    return;
                  }

                  updateParams({ [item.key]: null } as Record<
                    string,
                    string | null
                  >);
                }}
                aria-label={`Remove ${item.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>

        {/* <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="font-semibold text-slate-700">
              {resultCount ? "Tailor the catalog" : "No products available"}
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <span>Price band:</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(priceRange.minPrice)} –{" "}
                {formatCurrency(priceRange.maxPrice)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <span>Categories:</span>
              <span className="font-semibold text-slate-700">
                {categories.length}
              </span>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
