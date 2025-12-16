"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MasterOptionSummary } from "@/lib/master-constants";
import type { SubMasterOptionSummary } from "@/lib/submaster-constants";
import { cn } from "@/lib/utils";

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
  companySubMaster?: string;
}

interface MasterOptionsByType {
  companies: MasterOptionSummary[];
  processors: MasterOptionSummary[];
  rams: MasterOptionSummary[];
  storages: MasterOptionSummary[];
  graphics: MasterOptionSummary[];
  operatingSystems: MasterOptionSummary[];
}

type FilterKey =
  | "category"
  | "condition"
  | "company"
  | "companySubMaster"
  | "processor"
  | "ram"
  | "storage"
  | "graphics"
  | "os";

type CheckboxOption = { value: string; label: string };
type CheckboxGroup = { key: FilterKey; title: string; options: CheckboxOption[] };

interface ProductsToolbarProps {
  categories: string[];
  conditions: string[];
  masterOptions: MasterOptionsByType;
  companySubMasters: SubMasterOptionSummary[];
  filters: ProductFilters;
  resultCount: number;
}

export function ProductsToolbar({
  categories,
  conditions,
  masterOptions,
  companySubMasters,
  filters,
  resultCount,
}: ProductsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

  const subMasterById = useMemo(() => {
    const map = new Map<string, SubMasterOptionSummary>();
    companySubMasters.forEach((option) => {
      map.set(option.id, option);
    });
    return map;
  }, [companySubMasters]);

  const subMasterLabel = useCallback(
    (id: string): string => {
      const cache = new Map<string, string>();
      const buildPath = (optionId: string): string => {
        if (cache.has(optionId)) return cache.get(optionId)!;
        const option = subMasterById.get(optionId);
        if (!option) return "";
        const parts = [option.name];
        const seen = new Set<string>();
        let parentId = option.parentId;
        while (parentId) {
          if (seen.has(parentId)) break;
          seen.add(parentId);
          const parent = subMasterById.get(parentId);
          if (!parent) break;
          parts.unshift(parent.name);
          parentId = parent.parentId;
        }
        if (option.masterName) {
          parts.unshift(option.masterName);
        }
        const label = parts.filter(Boolean).join(" / ");
        cache.set(optionId, label);
        return label;
      };
      return buildPath(id);
    },
    [subMasterById]
  );

  const companySubOptions = useMemo(() => {
    const map = new Map<string, Array<{ value: string; label: string }>>();
    companySubMasters.forEach((option) => {
      const list = map.get(option.masterId) ?? [];
      list.push({
        value: option.id,
        label: subMasterLabel(option.id) || option.name,
      });
      map.set(option.masterId, list);
    });

    // sort each list
    map.forEach((list, key) => {
      list.sort((a, b) => a.label.localeCompare(b.label));
      map.set(key, list);
    });

    return map;
  }, [companySubMasters, subMasterLabel]);

  const toggleFilter = useCallback(
    (key: FilterKey, value: string) => {
      if (key === "company") {
        const isActive = filters[key] === value;
        const nextCompany = isActive ? null : value;
        const updates: Record<string, string | null> = { company: nextCompany };
        if (!nextCompany) {
          updates.companySubMaster = null;
        } else if (filters.companySubMaster) {
          const subMaster = subMasterById.get(filters.companySubMaster);
          const belongsToCompany = subMaster?.masterId === nextCompany;
          if (!belongsToCompany) {
            updates.companySubMaster = null;
          }
        }
        updateParams(updates);
        return;
      }
      const isActive = filters[key] === value;
      updateParams({ [key]: isActive ? null : value });
    },
    [filters, subMasterById, updateParams]
  );

  const clearFilters = useCallback(() => {
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
      companySubMaster: null,
      sort: null,
    });
  }, [updateParams]);

  const checkboxGroups = useMemo<CheckboxGroup[]>(
    () => [
      {
        key: "category",
        title: "Category",
        options: categories.map((category) => ({
          value: category,
          label: category,
        })),
      },
      {
        key: "condition",
        title: "Condition",
        options: conditions.map((condition) => ({
          value: condition,
          label: condition === "refurbished" ? "Refurbished" : condition,
        })),
      },
      {
        key: "company",
        title: "Company",
        options: masterOptions.companies.map((option) => ({
          value: option.id,
          label: option.name,
        })),
      },
      {
        key: "processor",
        title: "Processor",
        options: masterOptions.processors.map((option) => ({
          value: option.id,
          label: option.name,
        })),
      },
      {
        key: "ram",
        title: "Memory",
        options: masterOptions.rams.map((option) => ({
          value: option.id,
          label: option.name,
        })),
      },
      {
        key: "storage",
        title: "Storage",
        options: masterOptions.storages.map((option) => ({
          value: option.id,
          label: option.name,
        })),
      },
      {
        key: "graphics",
        title: "Graphics",
        options: masterOptions.graphics.map((option) => ({
          value: option.id,
          label: option.name,
        })),
      },
      {
        key: "os",
        title: "Operating system",
        options: masterOptions.operatingSystems.map((option) => ({
          value: option.id,
          label: option.name,
        })),
      },
    ],
    [
      categories,
      conditions,
      masterOptions.companies,
      masterOptions.graphics,
      masterOptions.operatingSystems,
      masterOptions.processors,
      masterOptions.rams,
      masterOptions.storages,
    ]
  );

  const primaryGroups = checkboxGroups.slice(0, 3);
  const advancedGroups = checkboxGroups.slice(3);

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string }> = [];

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
    if (filters.companySubMaster) {
      const label = subMasterLabel(filters.companySubMaster);
      items.push({
        key: "companySubMaster",
        label: `Submaster: ${label || filters.companySubMaster}`,
      });
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
    filters.companySubMaster,
    filters.graphics,
    filters.maxPrice,
    filters.minPrice,
    filters.company,
    filters.os,
    filters.processor,
    filters.ram,
    filters.search,
    filters.sort,
    filters.storage,
    subMasterLabel,
    masterOptions.companies,
    masterOptions.graphics,
    masterOptions.operatingSystems,
    masterOptions.processors,
    masterOptions.rams,
    masterOptions.storages,
  ]);

  return (
    <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm lg:sticky lg:top-28 lg:max-h-[75vh] lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Filter catalog
          </p>
          <p className="text-xs text-slate-600">
            Narrow down these {resultCount} device{resultCount === 1 ? "" : "s"}.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 hover:text-slate-900"
          onClick={clearFilters}
          disabled={isPending}
        >
          Clear all
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-slate-100 px-2.5 py-1 text-[0.7rem] text-slate-700">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </Badge>
        {activeFilters.length > 0 ? (
          <Badge variant="outline" className="border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.7rem] text-slate-600">
            {activeFilters.length} filter{activeFilters.length === 1 ? "" : "s"} active
          </Badge>
        ) : null}
      </div>

      <div className="space-y-4">
        {primaryGroups.map((group) => (
          <div key={group.key} className="space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {group.title}
            </p>
            {group.options.length ? (
              <div className="space-y-1.5">
                {group.options.map((option) => {
                  const isChecked = filters[group.key] === option.value;
                  const subOptions =
                    group.key === "company"
                      ? companySubOptions.get(option.value) ?? []
                      : [];
                  const showSubSelect =
                    group.key === "company" && isChecked && subOptions.length > 0;
                  return (
                  <div key={option.value} className="space-y-1">
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition",
                        isChecked
                            ? "border-primary/50 bg-primary/5 text-slate-900 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-1 focus:ring-primary"
                          checked={isChecked}
                          onChange={() => toggleFilter(group.key, option.value)}
                          disabled={isPending}
                          aria-label={option.label}
                        />
                        <span className="truncate">{option.label}</span>
                      </label>
                      {showSubSelect ? (
                        <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2">
                          {subOptions.map((subOption) => {
                            const isSubChecked = filters.companySubMaster === subOption.value;
                            return (
                              <label
                                key={subOption.value}
                                className="flex cursor-pointer items-center gap-2 pl-3 text-[11px] text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-1 focus:ring-primary"
                                  checked={isSubChecked}
                                  onChange={() =>
                                    updateParams({
                                      companySubMaster: isSubChecked ? null : subOption.value,
                                    })
                                  }
                                  disabled={isPending}
                                  aria-label={subOption.label}
                                />
                                <span className="truncate">{subOption.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No options available</p>
            )}
          </div>
        ))}
      </div>

      {advancedGroups.length ? (
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500 hover:text-slate-800">
              <span>Advanced filters</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-3">
              {advancedGroups.map((group) => (
                <div key={group.key} className="space-y-1.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {group.title}
                  </p>
                  {group.options.length ? (
                    <div className="space-y-1.5">
                      {group.options.map((option) => {
                        const isChecked = filters[group.key] === option.value;
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition",
                              isChecked
                                ? "border-primary/50 bg-primary/5 text-slate-900 shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-1 focus:ring-primary"
                              checked={isChecked}
                              onChange={() => toggleFilter(group.key, option.value)}
                              disabled={isPending}
                              aria-label={option.label}
                            />
                            <span className="truncate">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No options available</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : null}

      {activeFilters.length ? (
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Active filters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((item) => (
              <Badge
                key={item.key}
                variant="outline"
                className="flex items-center gap-1 border-slate-300 bg-white px-2.5 py-1 text-[0.7rem] text-slate-700"
              >
                {item.label}
                <button
                  type="button"
                  className="text-slate-400 transition-colors hover:text-slate-600"
                  onClick={() => {
                    if (item.key === "price") {
                      updateParams({ minPrice: null, maxPrice: null });
                      return;
                    }
                    if (item.key === "search") {
                      updateParams({ search: null });
                      return;
                    }
                    if (item.key === "sort") {
                      updateParams({ sort: null });
                      return;
                    }
                    updateParams({ [item.key]: null } as Record<string, string | null>);
                  }}
                  aria-label={`Remove ${item.label}`}
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
