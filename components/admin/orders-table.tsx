"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Clock, CreditCard, PackageCheck } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { OrderSummary } from "@/lib/orders";

interface OrdersTableProps {
  data: OrderSummary[];
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatPaymentLabel(method: string) {
  if (method === "razorpay") {
    return "Razorpay";
  }
  if (method === "cod") {
    return "Cash on delivery";
  }
  return method;
}

export function OrdersTable({ data }: OrdersTableProps) {
  const columns = React.useMemo<ColumnDef<OrderSummary>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">#{row.original.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{dateFormatter.format(new Date(row.original.createdAt))}</p>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => (
          <div className="space-y-1 max-w-[220px]">
            <p className="text-sm font-medium text-foreground">{row.original.customerName}</p>
            <p className="text-xs text-muted-foreground">{row.original.customerEmail}</p>
            <p className="text-xs text-muted-foreground">{row.original.customerPhone}</p>
          </div>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Payment" />,
        cell: ({ row }) => (
          <div className="space-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{formatPaymentLabel(row.original.paymentMethod)}</span>
            <span className="block text-xs uppercase tracking-wide text-muted-foreground">
              {row.original.paymentStatus}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total" align="right" />,
        cell: ({ getValue }) => (
          <div className="text-right font-semibold text-primary">{currencyFormatter.format(getValue<number>())}</div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ getValue }) => (
          <span className="text-sm capitalize text-muted-foreground">{getValue<string>()}</span>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="customerName"
      searchPlaceholder="Search orders by customer"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <PackageCheck className="h-10 w-10" aria-hidden />
          <p className="text-sm font-medium">No orders yet</p>
          <p className="text-xs">Orders placed through checkout will appear here.</p>
        </div>
      }
      renderMobileRow={(order) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">#{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {dateFormatter.format(new Date(order.createdAt))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{currencyFormatter.format(order.total)}</p>
              <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
            <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            <span>{formatPaymentLabel(order.paymentMethod)}</span>
            <span className="uppercase tracking-wide">{order.paymentStatus}</span>
          </div>
        </div>
      )}
      mobileEmptyState={
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No orders yet</p>
          <p className="text-xs">Orders placed through checkout will appear here.</p>
        </div>
      }
    />
  );
}
