"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ProductSummary } from "@/lib/products";

interface ProductsTableProps {
  data: ProductSummary[];
  onEdit: (product: ProductSummary) => void;
  onDelete: (id: string) => void;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductsTable({ data, onEdit, onDelete }: ProductsTableProps) {
  const columns = React.useMemo<ColumnDef<ProductSummary>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
        cell: ({ row }) => (
          <div className="max-w-xs space-y-1">
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{row.original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue<string>()}</span>,
      },
      {
        accessorKey: "condition",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Condition" />,
        cell: ({ getValue }) => (
          <span className="text-sm capitalize text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" align="right" />,
        cell: ({ getValue }) => (
          <div className="text-right font-semibold text-primary">{currencyFormatter.format(getValue<number>())}</div>
        ),
      },
      {
        accessorKey: "featured",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Featured" />,
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <BadgeCheck className="h-4 w-4" aria-hidden /> Featured
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Standard</span>
          ),
        enableSorting: false,
      },
      {
        accessorKey: "inStock",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">
            {getValue<boolean>() ? "Available" : "Out of stock"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              Delete
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search products by name"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <PackageSearch className="h-10 w-10" aria-hidden />
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs">Try adjusting your filters or add a new product.</p>
        </div>
      }
    />
  );
}
