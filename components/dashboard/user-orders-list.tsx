"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import type { OrderSummary } from "@/lib/orders";

interface UserOrdersListProps {
  orders: OrderSummary[];
}

export function UserOrdersList({ orders: initialOrders }: UserOrdersListProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [returningOrder, setReturningOrder] = useState<string | null>(null);

  const returnableOrderIds = useMemo(
    () =>
      new Set(
        orders
          .filter((order) => order.status === "delivered" || order.status === "dispatched")
          .map((order) => order.id)
      ),
    [orders]
  );

  async function handleReturn(orderId: string) {
    setReturningOrder(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/return`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : "Unable to request return";
        toast.error(message);
        return;
      }
      if (data?.order) {
        setOrders((prev) => prev.map((order) => (order.id === data.order.id ? data.order : order)));
      }
      toast.success(data?.message ?? "Return requested");
    } catch (error) {
      console.error(error);
      toast.error("Unable to request a return right now.");
    } finally {
      setReturningOrder(null);
    }
  }

  if (!orders.length) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-lg">
        <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-xl">🧾</div>
        <h2 className="text-2xl font-semibold text-foreground">No orders yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          When you place an order it will appear here with its fulfillment status and payment details.
        </p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const orderNumber = order.orderNumber;
        const statusLabel = getOrderStatusLabel(order.status);
        const created = new Date(order.createdAt);
        const paymentMethodLabel = order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay";
        const isReturnEligible = returnableOrderIds.has(order.id);

        return (
          <article
            key={order.id}
            className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Order #{orderNumber}
                </p>
                <h3 className="text-2xl font-semibold text-foreground">
                  {formatCurrency(order.total)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Placed on {created.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground md:text-right md:items-end">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-foreground">
                  {statusLabel}
                </span>
                <span>Payment: {paymentMethodLabel}</span>
                <span>Status: {order.paymentStatus}</span>
                <div className="flex flex-wrap gap-2">
                  {isReturnEligible ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={returningOrder === order.id}
                      onClick={() => handleReturn(order.id)}
                    >
                      {returningOrder === order.id ? "Requesting…" : "Request return"}
                    </Button>
                  ) : null}
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/orders/${order.id}`}>View details</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Items</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.productId}`} className="flex items-center justify-between gap-3">
                      <span>
                        {item.name}
                        <span className="text-xs text-muted-foreground"> × {item.quantity}</span>
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Shipping information</h4>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{order.customerName}</p>
                  <p className="whitespace-pre-line">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 ? `\n${order.shippingAddress.line2}` : ""}
                    {`\n${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`}
                    {`\n${order.shippingAddress.country}`}
                  </p>
                  <p className="mt-2 text-xs">Contact: {order.customerPhone}</p>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
