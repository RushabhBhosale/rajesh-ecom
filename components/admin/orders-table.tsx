"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Clock, CreditCard, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, type OrderStatusValue, getOrderStatusLabel } from "@/lib/order-status";
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
  const router = useRouter();
  const [orders, setOrders] = React.useState<OrderSummary[]>(data);
  const [updating, setUpdating] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<OrderStatusValue | "all">("all");

  React.useEffect(() => {
    setOrders(data);
  }, [data]);

  const handleStatusChange = React.useCallback(
    async (orderId: string, status: OrderStatusValue) => {
      setUpdating(orderId);
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            typeof payload?.error === "string"
              ? payload.error
              : Array.isArray(payload?.error?.status)
                ? payload.error.status[0]
                : "Unable to update status";
          toast.error(message ?? "Unable to update status");
          return;
        }
        const updatedOrder: OrderSummary | null = payload?.order ?? null;
        if (updatedOrder) {
          setOrders((prev) =>
            prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
          );
        }
        toast.success("Order status updated");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Unable to update status");
      } finally {
        setUpdating(null);
      }
    },
    [router]
  );

  const renderStatusControl = React.useCallback(
    (order: OrderSummary) => {
      const isUpdating = updating === order.id;
      return (
        <Select
          value={order.status}
          onValueChange={(value) => {
            if (value !== order.status) {
              void handleStatusChange(order.id, value as OrderStatusValue);
            }
          }}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
    [handleStatusChange, updating]
  );

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
        cell: ({ row }) => renderStatusControl(row.original),
      },
    ],
    [renderStatusControl]
  );

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const statusSummary = React.useMemo(() => {
    const counts = ORDER_STATUSES.map((status) => ({ value: status.value, label: status.label, count: 0 }));
    const total = orders.length;
    const map = new Map(counts.map((entry) => [entry.value, entry]));
    for (const order of orders) {
      const entry = map.get(order.status as OrderStatusValue);
      if (entry) {
        entry.count += 1;
      }
    }
    return { counts, total };
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            statusFilter === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/70 bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
          onClick={() => setStatusFilter("all")}
        >
          All <span className="ml-1 text-xs text-muted-foreground">({statusSummary.total})</span>
        </button>
        {statusSummary.counts.map((status) => (
          <button
            key={status.value}
            type="button"
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors capitalize",
              statusFilter === status.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/70 bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label}
            <span className="ml-1 text-xs text-muted-foreground">({status.count})</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
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
              <p className="text-xs text-muted-foreground">{getOrderStatusLabel(order.status)}</p>
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
          <div>{renderStatusControl(order)}</div>
        </div>
      )}
        mobileEmptyState={
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No orders yet</p>
            <p className="text-xs">Orders placed through checkout will appear here.</p>
          </div>
        }
      />
    </div>
  );
}
