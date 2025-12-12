"use client";

import * as React from "react";
import type { ColumnDef, ColumnFiltersState, Row, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: string;
  emptyState?: React.ReactNode;
  className?: string;
  renderMobileRow?: (item: TData) => React.ReactNode;
  mobileEmptyState?: React.ReactNode;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
}

function defaultGetRowId<TData>(originalRow: TData, index: number) {
  const maybeId =
    (originalRow as { id?: string | number; _id?: string | number }).id ??
    (originalRow as { id?: string | number; _id?: string | number })._id;

  if (typeof maybeId === "string" || typeof maybeId === "number") {
    return String(maybeId);
  }
  return String(index);
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  searchKey,
  emptyState,
  className,
  renderMobileRow,
  mobileEmptyState,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getRowId: getRowId ?? defaultGetRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const searchColumn = searchKey ? table.getColumn(searchKey) : null;
  const searchValue = (searchColumn?.getFilterValue() as string) ?? "";

  const mobileContent = renderMobileRow
    ? table.getRowModel().rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-border/70 bg-background/95 p-4 shadow-sm">
          {renderMobileRow(row.original)}
        </div>
      ))
    : null;

  const hasRows = table.getRowModel().rows?.length;

  return (
    <div className={cn("space-y-4", className)}>
      {searchColumn ? (
        <div className="flex w-full flex-col gap-3 rounded-xl border border-border/60 bg-background/95 p-3 text-sm shadow-sm sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Search className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.22em]">Search</span>
          </div>
          <Input
            value={searchValue}
            onChange={(event) => searchColumn.setFilterValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full border-0 bg-muted/40 px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      ) : null}
      {renderMobileRow ? (
        <div className="space-y-3 md:hidden">
          {hasRows && mobileContent?.length ? (
            mobileContent
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {mobileEmptyState ?? emptyState ?? "No records found"}
            </div>
          )}
        </div>
      ) : null}
      <div className={cn(renderMobileRow ? "hidden md:block" : undefined)}>
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-muted/40">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {hasRows ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {emptyState ?? "No records found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
