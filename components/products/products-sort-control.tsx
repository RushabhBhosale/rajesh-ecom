"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProductsSortControlProps {
  sort?: string;
}

export function ProductsSortControl({ sort }: ProductsSortControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSortChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");

      if (value === "created-desc") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }

      const queryString = params.toString();
      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  const sortOptions = [
    { value: "created-desc", label: "Newest" },
    { value: "price-asc", label: "Price ↑" },
    { value: "price-desc", label: "Price ↓" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
        <span>Sort</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => {
          const isActive = (sort ?? "created-desc") === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-slate-300 text-slate-700 hover:border-slate-400"
              }
              onClick={() => handleSortChange(option.value)}
              disabled={isPending}
              aria-pressed={isActive}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
