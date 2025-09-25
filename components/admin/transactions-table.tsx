"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Receipt } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { TransactionSummary } from "@/lib/transactions";

interface TransactionsTableProps {
  data: TransactionSummary[];
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

function getShortId(id: string) {
  return id.slice(-6).toUpperCase();
}

export function TransactionsTable({ data }: TransactionsTableProps) {
  const columns = React.useMemo<ColumnDef<TransactionSummary>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Transaction" />,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">TX-{getShortId(row.original.id)}</p>
            <p className="text-xs text-muted-foreground">Order #{getShortId(row.original.orderId)}</p>
          </div>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
        cell: ({ row }) => (
          <div className="text-sm capitalize text-muted-foreground">
            {row.original.paymentMethod}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" align="right" />,
        cell: ({ getValue }) => (
          <div className="text-right font-semibold text-primary">{currencyFormatter.format(getValue<number>())}</div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <span className="text-sm capitalize text-muted-foreground">{row.original.status}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Recorded" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormatter.format(new Date(row.original.createdAt))}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="id"
      searchPlaceholder="Search transactions"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <Receipt className="h-10 w-10" aria-hidden />
          <p className="text-sm font-medium">No transactions yet</p>
          <p className="text-xs">Successful payments will appear in this ledger.</p>
        </div>
      }
      renderMobileRow={(transaction) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">TX-{getShortId(transaction.id)}</p>
              <p className="text-xs text-muted-foreground">Order #{getShortId(transaction.orderId)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{currencyFormatter.format(transaction.amount)}</p>
              <p className="text-xs capitalize text-muted-foreground">{transaction.status}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{transaction.paymentMethod}</span>
            <span>{dateFormatter.format(new Date(transaction.createdAt))}</span>
          </div>
        </div>
      )}
      mobileEmptyState={
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No transactions yet</p>
          <p className="text-xs">Successful payments will appear in this ledger.</p>
        </div>
      }
    />
  );
}
