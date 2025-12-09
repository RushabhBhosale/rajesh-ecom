import { notFound, redirect } from "next/navigation";

import { ReturnOrderButton } from "@/components/dashboard/return-order-button";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import { getOrderForUser } from "@/lib/orders";

interface OrderDetailPageProps {
  params: { orderId: string };
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const order = await getOrderForUser(params.orderId, user.id);
  if (!order) {
    notFound();
  }

  const created = new Date(order.createdAt);
  const statusLabel = getOrderStatusLabel(order.status);
  const paymentMethodLabel =
    order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay";
  const canRequestReturn =
    order.status === "delivered" || order.status === "dispatched";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Order #{order.orderNumber}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Order details
        </h1>
        <p className="text-sm text-muted-foreground">
          Placed on{" "}
          {created.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-foreground">
                {statusLabel}
              </span>
              <span className="text-sm text-muted-foreground">
                Payment: {paymentMethodLabel}
              </span>
              <span className="text-sm text-muted-foreground">
                Payment status: {order.paymentStatus}
              </span>
            </div>
            {canRequestReturn ? (
              <ReturnOrderButton orderId={order.id} variant="outline" size="sm">
                Request return
              </ReturnOrderButton>
            ) : null}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Items</h2>
              <ul className="space-y-3">
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variant ?? "base"}-${item.color ?? "default"}`}
                    className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      {item.variant ? (
                        <p className="text-xs text-muted-foreground">
                           {item.variant}
                        </p>
                      ) : null}
                      {item.color ? (
                        <p className="text-xs text-muted-foreground">Colour: {item.color}</p>
                      ) : null}
                      <p className="text-xs">Qty {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Shipping information
            </h2>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {order.customerName}
              </p>
              <p className="whitespace-pre-line">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2
                  ? `\n${order.shippingAddress.line2}`
                  : ""}
                {`\n${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`}
                {`\n${order.shippingAddress.country}`}
              </p>
              <p className="mt-2 text-xs">Contact: {order.customerPhone}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Payment summary
            </h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>GST</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.tax)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-600">
                  Complimentary
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {order.razorpayOrderId || order.razorpayPaymentId ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Razorpay details
              </h3>
              <dl className="space-y-1 text-xs text-muted-foreground">
                {order.razorpayOrderId ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="uppercase tracking-wide">Order ID</dt>
                    <dd className="font-mono text-[11px] text-foreground">
                      {order.razorpayOrderId}
                    </dd>
                  </div>
                ) : null}
                {order.razorpayPaymentId ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="uppercase tracking-wide">Payment ID</dt>
                    <dd className="font-mono text-[11px] text-foreground">
                      {order.razorpayPaymentId}
                    </dd>
                  </div>
                ) : null}
                {/* {order.razorpaySignature ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="uppercase tracking-wide">Signature</dt>
                    <dd className="font-mono text-[11px] text-foreground">{order.razorpaySignature}</dd>
                  </div>
                ) : null} */}
              </dl>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Need assistance? Reach our support team at{" "}
            <a
              href="mailto:support@rajeshrenewed.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              support@rajeshrenewed.com
            </a>
            .
          </div>
        </aside>
      </div>
    </section>
  );
}
