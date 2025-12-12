"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  variantLabel: string;
  stock: number;
  inStock: boolean;
  category: string;
  company?: string | null;
  price: number;
}

type InventoryRowState = InventoryItem & {
  draftStock: string;
  saving: boolean;
};

interface InventoryTableProps {
  items: InventoryItem[];
}

export function InventoryTable({ items }: InventoryTableProps) {
  const [rows, setRows] = useState<InventoryRowState[]>(
    items.map((item) => ({
      ...item,
      draftStock: String(item.stock ?? 0),
      saving: false,
    }))
  );

  const handleStockChange = useCallback((id: string, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, draftStock: value } : row)));
  }, []);

  const handleSave = useCallback(async (row: InventoryRowState) => {
    const nextStock = Number(row.draftStock);
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      toast.error("Stock must be zero or greater.");
      return;
    }

    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, saving: true } : item)));

    try {
      const response = await fetch(`/api/admin/inventory/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: nextStock }),
      });
      const data: { variant?: { stock: number; inStock: boolean } } | null = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const message =
          typeof (data as any)?.error === "string" ? (data as any).error : "Unable to update stock.";
        toast.error(message);
        setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, saving: false } : item)));
        return;
      }

      const updatedStock = Number(data?.variant?.stock ?? nextStock);
      const updatedInStock = typeof data?.variant?.inStock === "boolean" ? data.variant.inStock : updatedStock > 0;

      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                stock: updatedStock,
                draftStock: String(updatedStock),
                inStock: updatedInStock,
                saving: false,
              }
            : item
        )
      );
      toast.success("Inventory updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update stock right now.");
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, saving: false } : item)));
    }
  }, []);

  const columns = useMemo<ColumnDef<InventoryRowState>[]>(
    () => [
      {
        id: "sku",
        accessorFn: (row) => [row.sku, row.productName, row.variantLabel].filter(Boolean).join(" "),
        header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
        cell: ({ row }) => {
          const original = row.original;
          return (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{original.sku || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {original.category}
                {original.company ? ` • ${original.company}` : ""}
              </p>
            </div>
          );
        },
      },
      {
        id: "product",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{row.original.productName}</p>
            <p className="text-xs text-muted-foreground">{row.original.variantLabel}</p>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" align="right" />,
        cell: ({ getValue }) => (
          <div className="text-right font-semibold text-foreground">{formatCurrency(getValue<number>())}</div>
        ),
      },
      {
        id: "stock",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
        cell: ({ row }) => {
          const original = row.original;
          const isSaving = original.saving;
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={original.draftStock}
                onChange={(event) => handleStockChange(original.id, event.target.value)}
                className="w-24"
                aria-label={`Stock for ${original.sku || original.productName}`}
              />
              <Button
                variant="outline"
                size="sm"
                className={cn("flex-shrink-0", isSaving ? "pointer-events-none opacity-70" : undefined)}
                onClick={() => handleSave(original)}
                disabled={isSaving || original.draftStock === ""}
              >
                {isSaving ? "Saving..." : "Update"}
              </Button>
            </div>
          );
        },
      },
      {
        id: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const original = row.original;
          const isOutOfStock = !original.inStock || original.stock <= 0;
          return (
            <div className="flex items-center gap-2">
              <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                {isOutOfStock ? "Out of stock" : "In stock"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {original.stock} unit{original.stock === 1 ? "" : "s"}
              </span>
            </div>
          );
        },
      },
    ],
    [handleSave, handleStockChange]
  );

  const renderMobileRow = useCallback(
    (row: InventoryRowState) => {
      const isOutOfStock = !row.inStock || row.stock <= 0;
      return (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{row.sku || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {row.category}
                {row.company ? ` • ${row.company}` : ""}
              </p>
            </div>
            <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
              {isOutOfStock ? "Out of stock" : "In stock"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{row.productName}</p>
            <p className="text-xs text-muted-foreground">{row.variantLabel}</p>
          </div>
          <div className="text-sm font-semibold text-foreground">{formatCurrency(row.price)}</div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={row.draftStock}
              onChange={(event) => handleStockChange(row.id, event.target.value)}
              className="w-24"
              aria-label={`Stock for ${row.sku || row.productName}`}
            />
            <Button
              variant="outline"
              size="sm"
              className={cn("flex-shrink-0", row.saving ? "pointer-events-none opacity-70" : undefined)}
              onClick={() => handleSave(row)}
              disabled={row.saving || row.draftStock === ""}
            >
              {row.saving ? "Saving..." : "Update"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {row.stock} unit{row.stock === 1 ? "" : "s"}
          </p>
        </div>
      );
    },
    [handleSave, handleStockChange]
  );

  const tableData = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          a.sku.localeCompare(b.sku || "", undefined, { sensitivity: "base" }) ||
          a.productName.localeCompare(b.productName, undefined, { sensitivity: "base" })
      ),
    [rows]
  );

  return (
    <DataTable
      columns={columns}
      data={tableData}
      searchKey="sku"
      searchPlaceholder="Search by SKU or name"
      emptyState="No SKUs found."
      renderMobileRow={renderMobileRow}
    />
  );
}
