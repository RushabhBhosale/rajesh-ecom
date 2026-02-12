"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_PAGE_SIZE = 12;

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export function ProductsPagination({
  currentPage,
  totalPages,
  pageSize,
}: ProductsPaginationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }

    if (pageSize !== DEFAULT_PAGE_SIZE) {
      params.set("pageSize", String(pageSize));
    } else {
      params.delete("pageSize");
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const handlePageSizeChange = (value: string) => {
    const nextPageSize = Number.parseInt(value, 10);
    if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (nextPageSize === DEFAULT_PAGE_SIZE) {
      params.delete("pageSize");
    } else {
      params.set("pageSize", String(nextPageSize));
    }
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;
  const previousHref = buildHref(Math.max(1, currentPage - 1));
  const nextHref = buildHref(Math.min(totalPages, currentPage + 1));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/80 px-4 py-3 shadow-sm">
      <Field orientation="horizontal" className="w-fit">
        <FieldLabel htmlFor="products-rows-per-page">Rows per page</FieldLabel>
        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
          <SelectTrigger id="products-rows-per-page" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={previousHref}
                aria-disabled={isPreviousDisabled}
                className={
                  isPreviousDisabled ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={nextHref}
                aria-disabled={isNextDisabled}
                className={isNextDisabled ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
