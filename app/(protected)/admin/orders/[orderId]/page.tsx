import { notFound, redirect } from "next/navigation";

import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel, type OrderStatusValue } from "@/lib/order-status";
import { getOrderById } from "@/lib/orders";

interface AdminOrderDetailPageProps {
  params: { orderId: string };
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const actor = await getCurrentUser();
  if (!actor) {
    redirect("/login");
  }
  if (actor.role !== "admin" && actor.role !== "superadmin") {
    redirect("/" );
  }

  const order = await getOrderById(params.orderId);
  if (!order) {
    notFound();
  }

  const created = new Date(order.createdAt);
  const updated = new Date(order.updatedAt);
  const statusLabel = getOrderStatusLabel(order.status);
  const paymentMethodLabel = order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Order #{order.orderNumber}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Order overview</h1>
        <p className="text-sm text-muted-foreground">
          Created on {created.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · Last updated {updated.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-foreground">
                {statusLabel}
              </span>
              <OrderStatusSelect orderId={order.id} status={order.status as OrderStatusValue} />
            </div>

            <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">Customer</dt>
                <dd className="font-medium text-foreground">{order.customerName}</dd>
                <dd>{order.customerEmail}</dd>
                <dd>{order.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">Payment</dt>
                <dd className="font-medium text-foreground">{paymentMethodLabel}</dd>
                <dd>Payment status: {order.paymentStatus}</dd>
              </div>
            </dl>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Items</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs">Qty {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(item.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Shipping information</h2>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.customerName}</p>
              <p className="whitespace-pre-line">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `\n${order.shippingAddress.line2}` : ""}
                {`\n${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`}
                {`\n${order.shippingAddress.country}`}
              </p>
              <p className="mt-2 text-xs">Contact: {order.customerPhone}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <div className="space-y-2 text-sm text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Payment summary</h2>
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>GST</span>
              <span className="font-semibold text-foreground">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-600">Complimentary</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {order.razorpayOrderId || order.razorpayPaymentId ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Razorpay metadata</h3>
              <dl className="space-y-1 text-xs text-muted-foreground">
                {order.razorpayOrderId ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="uppercase tracking-wide">Order ID</dt>
                    <dd className="font-mono text-[11px] text-foreground">{order.razorpayOrderId}</dd>
                  </div>
                ) : null}
                {order.razorpayPaymentId ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="uppercase tracking-wide">Payment ID</dt>
                    <dd className="font-mono text-[11px] text-foreground">{order.razorpayPaymentId}</dd>
                  </div>
                ) : null}
                {order.razorpaySignature ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="uppercase tracking-wide">Signature</dt>
                    <dd className="font-mono text-[11px] text-foreground">{order.razorpaySignature}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
