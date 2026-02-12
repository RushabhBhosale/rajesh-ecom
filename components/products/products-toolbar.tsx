"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  priceRange: { minPrice: number; maxPrice: number };
  companySubMasters: SubMasterOptionSummary[];
  filters: ProductFilters;
  resultCount: number;
}

export function ProductsToolbar({
  categories,
  conditions,
  masterOptions,
  priceRange,
  companySubMasters,
  filters,
  resultCount,
}: ProductsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const sliderBounds = useMemo(() => {
    const min = Math.max(0, Math.floor(priceRange.minPrice ?? 0));
    const upper = Math.max(min, Math.ceil(priceRange.maxPrice ?? min));
    const max = upper === min ? min + 1000 : upper;
    return { min, max };
  }, [priceRange.maxPrice, priceRange.minPrice]);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice ?? "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice ?? "");
  const [minSliderValue, setMinSliderValue] = useState(sliderBounds.min);
  const [maxSliderValue, setMaxSliderValue] = useState(sliderBounds.max);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  const sanitizePriceValue = useCallback((value: string) => {
    const numericValue = Number.parseInt(value, 10);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return null;
    }
    return numericValue;
  }, []);

  const clampToBounds = useCallback(
    (value: number) => Math.min(sliderBounds.max, Math.max(sliderBounds.min, value)),
    [sliderBounds.max, sliderBounds.min]
  );

  useEffect(() => {
    if (typeof filters.minPrice === "string" && filters.minPrice.length > 0) {
      const nextMin = sanitizePriceValue(filters.minPrice) ?? sliderBounds.min;
      setMinPriceInput(String(nextMin));
      setMinSliderValue(clampToBounds(nextMin));
    } else {
      setMinPriceInput("");
      setMinSliderValue(sliderBounds.min);
    }
    if (typeof filters.maxPrice === "string" && filters.maxPrice.length > 0) {
      const nextMax = sanitizePriceValue(filters.maxPrice) ?? sliderBounds.max;
      setMaxPriceInput(String(nextMax));
      setMaxSliderValue(clampToBounds(nextMax));
    } else {
      setMaxPriceInput("");
      setMaxSliderValue(sliderBounds.max);
    }
  }, [
    clampToBounds,
    filters.maxPrice,
    filters.minPrice,
    sanitizePriceValue,
    sliderBounds.max,
    sliderBounds.min,
  ]);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) {
        setMobileFiltersOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    closeOnDesktop();
    window.addEventListener("resize", closeOnDesktop);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", closeOnDesktop);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileFiltersOpen]);

  const handleInputChange = useCallback(
    (type: "min" | "max", value: string) => {
      if (type === "min") {
        setMinPriceInput(value);
        if (!value.trim()) {
          setMinSliderValue(sliderBounds.min);
          return;
        }
        const numeric = sanitizePriceValue(value);
        if (typeof numeric === "number") {
          setMinSliderValue(Math.min(clampToBounds(numeric), maxSliderValue));
        }
        return;
      }
      setMaxPriceInput(value);
      if (!value.trim()) {
        setMaxSliderValue(sliderBounds.max);
        return;
      }
      const numeric = sanitizePriceValue(value);
      if (typeof numeric === "number") {
        setMaxSliderValue(Math.max(clampToBounds(numeric), minSliderValue));
      }
    },
    [
      clampToBounds,
      maxSliderValue,
      minSliderValue,
      sanitizePriceValue,
      sliderBounds.max,
      sliderBounds.min,
    ]
  );

  const applyPriceFilter = useCallback(() => {
    let nextMin = sanitizePriceValue(minPriceInput);
    let nextMax = sanitizePriceValue(maxPriceInput);
    if (
      typeof nextMin === "number" &&
      typeof nextMax === "number" &&
      nextMin > nextMax
    ) {
      const swap = nextMin;
      nextMin = nextMax;
      nextMax = swap;
    }
    let normalizedMin =
      typeof nextMin === "number" ? clampToBounds(nextMin) : null;
    let normalizedMax =
      typeof nextMax === "number" ? clampToBounds(nextMax) : null;
    if (
      typeof normalizedMin === "number" &&
      typeof normalizedMax === "number" &&
      normalizedMin > normalizedMax
    ) {
      const swap = normalizedMin;
      normalizedMin = normalizedMax;
      normalizedMax = swap;
    }
    setMinSliderValue(
      typeof normalizedMin === "number" ? normalizedMin : sliderBounds.min
    );
    setMaxSliderValue(
      typeof normalizedMax === "number" ? normalizedMax : sliderBounds.max
    );
    updateParams({
      minPrice:
        typeof normalizedMin === "number" ? String(normalizedMin) : null,
      maxPrice:
        typeof normalizedMax === "number" ? String(normalizedMax) : null,
    });
  }, [
    clampToBounds,
    maxPriceInput,
    minPriceInput,
    sanitizePriceValue,
    sliderBounds.max,
    sliderBounds.min,
    updateParams,
  ]);

  const clearPriceFilter = useCallback(() => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setMinSliderValue(sliderBounds.min);
    setMaxSliderValue(sliderBounds.max);
    updateParams({
      minPrice: null,
      maxPrice: null,
    });
  }, [sliderBounds.max, sliderBounds.min, updateParams]);

  const handleQuickPrice = useCallback(
    (min?: number, max?: number) => {
      setMinPriceInput(typeof min === "number" ? String(min) : "");
      setMaxPriceInput(typeof max === "number" ? String(max) : "");
      setMinSliderValue(
        typeof min === "number" ? clampToBounds(min) : sliderBounds.min
      );
      setMaxSliderValue(
        typeof max === "number" ? clampToBounds(max) : sliderBounds.max
      );
      updateParams({
        minPrice: typeof min === "number" ? String(min) : null,
        maxPrice: typeof max === "number" ? String(max) : null,
      });
    },
    [clampToBounds, sliderBounds.max, sliderBounds.min, updateParams]
  );

  const quickPriceRanges = useMemo(() => {
    const ranges: Array<{ label: string; min?: number; max?: number }> = [
      { label: "Under ₹20k", max: 20000 },
      { label: "₹20k – ₹30k", min: 20000, max: 30000 },
      { label: "₹30k – ₹40k", min: 30000, max: 40000 },
    ];
    if (priceRange.maxPrice > 40000) {
      ranges.push({ label: "₹40k+", min: 40000 });
    }
    return ranges;
  }, [priceRange.maxPrice]);

  const sliderRange = Math.max(1, sliderBounds.max - sliderBounds.min);
  const sliderStep = Math.max(500, Math.round(sliderRange / 40));

  const sliderHighlight = useMemo(() => {
    const start =
      ((minSliderValue - sliderBounds.min) / sliderRange) * 100;
    const end = ((maxSliderValue - sliderBounds.min) / sliderRange) * 100;
    return {
      start: Math.max(0, Math.min(100, start)),
      end: Math.max(0, Math.min(100, end)),
    };
  }, [maxSliderValue, minSliderValue, sliderBounds.min, sliderRange]);

  const handleSliderChange = useCallback(
    (type: "min" | "max", value: number) => {
      if (type === "min") {
        const next = Math.min(clampToBounds(value), maxSliderValue);
        setMinSliderValue(next);
        setMinPriceInput(String(next));
        return;
      }
      const next = Math.max(clampToBounds(value), minSliderValue);
      setMaxSliderValue(next);
      setMaxPriceInput(String(next));
    },
    [clampToBounds, maxSliderValue, minSliderValue]
  );

  const handleSliderCommit = useCallback(() => {
    const minValue =
      minSliderValue <= sliderBounds.min
        ? null
        : String(Math.round(minSliderValue));
    const maxValue =
      maxSliderValue >= sliderBounds.max
        ? null
        : String(Math.round(maxSliderValue));
    updateParams({
      minPrice: minValue,
      maxPrice: maxValue,
    });
  }, [
    maxSliderValue,
    minSliderValue,
    sliderBounds.max,
    sliderBounds.min,
    updateParams,
  ]);

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
  const hasPriceFilter = Boolean(filters.minPrice || filters.maxPrice);

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

  const mobilePreviewFilters = activeFilters.slice(0, 2);

  const toolbarContent = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Filter catalog
          </p>
          <p className="text-xs text-neutral-600">
            Narrow down these {resultCount} device{resultCount === 1 ? "" : "s"}.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-neutral-500 hover:text-neutral-900"
          onClick={clearFilters}
          disabled={isPending}
        >
          Clear all
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant="secondary"
          className="bg-neutral-100 px-2.5 py-1 text-[0.7rem] text-neutral-700"
        >
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </Badge>
        {activeFilters.length > 0 ? (
          <Badge
            variant="outline"
            className="border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[0.7rem] text-neutral-600"
          >
            {activeFilters.length} filter{activeFilters.length === 1 ? "" : "s"} active
          </Badge>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/80 p-3 shadow-inner">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Price range
            </p>
            <p className="text-[0.7rem] text-neutral-500">
              Catalog: ₹{priceRange.minPrice.toLocaleString("en-IN")} - ₹
              {priceRange.maxPrice.toLocaleString("en-IN")}
            </p>
          </div>
          {hasPriceFilter ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-neutral-500 hover:text-neutral-900"
              onClick={clearPriceFilter}
              disabled={isPending}
            >
              Reset
            </Button>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="price-range-slider relative h-8">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />
            <div
              className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/60"
              style={{
                left: `${sliderHighlight.start}%`,
                right: `${100 - sliderHighlight.end}%`,
              }}
            />
            <input
              type="range"
              min={sliderBounds.min}
              max={sliderBounds.max}
              step={sliderStep}
              value={minSliderValue}
              onChange={(event) =>
                handleSliderChange("min", Number(event.target.value))
              }
              onPointerUp={handleSliderCommit}
              disabled={isPending}
              aria-label="Minimum price slider"
              className="absolute inset-x-0 top-0 h-8 w-full bg-transparent"
            />
            <input
              type="range"
              min={sliderBounds.min}
              max={sliderBounds.max}
              step={sliderStep}
              value={maxSliderValue}
              onChange={(event) =>
                handleSliderChange("max", Number(event.target.value))
              }
              onPointerUp={handleSliderCommit}
              disabled={isPending}
              aria-label="Maximum price slider"
              className="absolute inset-x-0 top-0 h-8 w-full bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between text-[0.65rem] text-neutral-500">
            <span>₹{minSliderValue.toLocaleString("en-IN")}</span>
            <span>₹{maxSliderValue.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            value={minPriceInput}
            onChange={(event) => handleInputChange("min", event.target.value)}
            className="h-9 bg-white text-xs"
            aria-label="Minimum price"
          />
          <span className="text-xs text-neutral-400">to</span>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            value={maxPriceInput}
            onChange={(event) => handleInputChange("max", event.target.value)}
            className="h-9 bg-white text-xs"
            aria-label="Maximum price"
          />
          <Button
            size="sm"
            className="text-xs"
            onClick={applyPriceFilter}
            disabled={isPending}
          >
            Apply
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPriceRanges.map((range) => {
            const isActive =
              (filters.minPrice ?? "") ===
                (typeof range.min === "number" ? String(range.min) : "") &&
              (filters.maxPrice ?? "") ===
                (typeof range.max === "number" ? String(range.max) : "");
            return (
              <Button
                key={range.label}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "border-neutral-200 px-3 py-1 text-[0.7rem]",
                  isActive ? "bg-primary text-primary-foreground" : "bg-white text-neutral-600"
                )}
                onClick={() => handleQuickPrice(range.min, range.max)}
                disabled={isPending}
              >
                {range.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {primaryGroups.map((group) => (
          <div key={group.key} className="space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
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
                            ? "border-primary/50 bg-primary/5 text-neutral-900 shadow-sm"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-neutral-300 text-primary focus:ring-1 focus:ring-primary"
                          checked={isChecked}
                          onChange={() => toggleFilter(group.key, option.value)}
                          disabled={isPending}
                          aria-label={option.label}
                        />
                        <span className="truncate">{option.label}</span>
                      </label>
                      {showSubSelect ? (
                        <div className="space-y-1 rounded-lg border border-neutral-200 bg-neutral-50/60 px-2.5 py-2">
                          {subOptions.map((subOption) => {
                            const isSubChecked = filters.companySubMaster === subOption.value;
                            return (
                              <label
                                key={subOption.value}
                                className="flex cursor-pointer items-center gap-2 pl-3 text-[11px] text-neutral-700"
                              >
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 rounded border-neutral-300 text-primary focus:ring-1 focus:ring-primary"
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
              <p className="text-xs text-neutral-400">No options available</p>
            )}
          </div>
        ))}
      </div>

      {advancedGroups.length ? (
        <div className="space-y-2 border-t border-neutral-200 pt-3">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-500 hover:text-neutral-800">
              <span>Advanced filters</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-3">
              {advancedGroups.map((group) => (
                <div key={group.key} className="space-y-1.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
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
                                ? "border-primary/50 bg-primary/5 text-neutral-900 shadow-sm"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-neutral-300 text-primary focus:ring-1 focus:ring-primary"
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
                    <p className="text-xs text-neutral-400">No options available</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : null}

      {activeFilters.length ? (
        <div className="space-y-2 border-t border-neutral-200 pt-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Active filters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((item) => (
              <Badge
                key={item.key}
                variant="outline"
                className="flex items-center gap-1 border-neutral-300 bg-white px-2.5 py-1 text-[0.7rem] text-neutral-700"
              >
                {item.label}
                <button
                  type="button"
                  className="text-neutral-400 transition-colors hover:text-neutral-600"
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
    </>
  );

  return (
    <>
      <div className="lg:hidden">
        <div className="space-y-2 rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/90 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 flex-1 justify-start border-neutral-300 text-neutral-700"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
              Filters
              {activeFilters.length > 0 ? (
                <span className="ml-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {activeFilters.length}
                </span>
              ) : null}
            </Button>
            <Badge
              variant="secondary"
              className="bg-neutral-100 px-2.5 py-1 text-[0.7rem] text-neutral-700"
            >
              {resultCount} result{resultCount === 1 ? "" : "s"}
            </Badge>
          </div>
          {mobilePreviewFilters.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {mobilePreviewFilters.map((item) => (
                <Badge
                  key={item.key}
                  variant="outline"
                  className="max-w-full truncate border-neutral-300 bg-white px-2.5 py-1 text-[0.7rem] text-neutral-700"
                >
                  {item.label}
                </Badge>
              ))}
              {activeFilters.length > mobilePreviewFilters.length ? (
                <Badge
                  variant="outline"
                  className="border-neutral-300 bg-white px-2.5 py-1 text-[0.7rem] text-neutral-600"
                >
                  +{activeFilters.length - mobilePreviewFilters.length} more
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
        >
          <button
            type="button"
            className="absolute inset-0 bg-neutral-900/45"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(90vw,360px)] flex-col border-r border-neutral-200 bg-gradient-to-b from-white to-neutral-50 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-900">Filters</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-neutral-900"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {toolbarContent}
            </div>
          </aside>
        </div>
      ) : null}

      <aside className="hidden space-y-4 rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/80 p-4 shadow-sm lg:sticky lg:top-28 lg:block lg:max-h-[75vh] lg:overflow-y-auto">
        {toolbarContent}
      </aside>
    </>
  );
}
