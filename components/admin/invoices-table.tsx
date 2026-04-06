"use client";

import Link from "next/link";
import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import type { OrderSummary } from "@/lib/orders";

interface InvoicesTableProps {
  data: OrderSummary[];
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function InvoicesTable({ data }: InvoicesTableProps) {
  const columns = React.useMemo<ColumnDef<OrderSummary>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Invoice" />
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <Link
              href={`/admin/invoices/${row.original.id}`}
              className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {row.original.invoiceNumber}
            </Link>
            <p className="text-xs text-muted-foreground">
              Issued {dateFormatter.format(new Date(row.original.invoiceIssuedAt))}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "orderNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            #{row.original.orderNumber}
          </Link>
        ),
      },
      {
        accessorKey: "customerName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Customer" />
        ),
        cell: ({ row }) => (
          <div className="space-y-1 max-w-[220px]">
            <p className="text-sm font-medium text-foreground">
              {row.original.customerName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.customerEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total" align="right" />
        ),
        cell: ({ getValue }) => (
          <div className="text-right font-semibold text-primary">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm text-foreground">
              {getOrderStatusLabel(row.original.status)}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {row.original.paymentStatus}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <a
            href={`/api/orders/${row.original.id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open
          </a>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="invoiceNumber"
      searchPlaceholder="Search invoices by invoice number"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <FileText className="h-10 w-10" aria-hidden />
          <p className="text-sm font-medium">No invoices found</p>
          <p className="text-xs">
            Invoices are generated when customers place orders.
          </p>
        </div>
      }
      renderMobileRow={(invoice) => (
        <div className="space-y-3">
          <div className="space-y-1">
            <Link
              href={`/admin/invoices/${invoice.id}`}
              className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {invoice.invoiceNumber}
            </Link>
            <p className="text-xs text-muted-foreground">
              Issued {dateFormatter.format(new Date(invoice.invoiceIssuedAt))}
            </p>
          </div>
          <div className="space-y-1">
            <Link
              href={`/admin/orders/${invoice.id}`}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              Order #{invoice.orderNumber}
            </Link>
            <p className="text-sm text-foreground">{invoice.customerName}</p>
            <p className="text-xs text-muted-foreground">{invoice.customerEmail}</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-primary">
              {formatCurrency(invoice.total)}
            </span>
            <span className="text-muted-foreground">
              {getOrderStatusLabel(invoice.status)}
            </span>
          </div>
          <a
            href={`/api/orders/${invoice.id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Open printable invoice
          </a>
        </div>
      )}
      mobileEmptyState={
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No invoices found</p>
          <p className="text-xs">
            Invoices are generated when customers place orders.
          </p>
        </div>
      }
    />
  );
}
