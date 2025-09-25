import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import { listOrdersByUser } from "@/lib/orders";

export const metadata: Metadata = {
  title: "My orders | Rajesh Control",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orders = await listOrdersByUser(user.id);

  if (!orders.length) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
        <div className="flex size-16 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold text-slate-500">
          🧾
        </div>
        <h1 className="text-2xl font-semibold text-foreground">No orders yet</h1>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          When you place an order it will appear here with its fulfillment status and payment details.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">My orders</h1>
        <p className="text-sm text-muted-foreground">
          Track status updates, payment confirmations, and items included in each purchase.
        </p>
      </header>

      <div className="space-y-6">
        {orders.map((order) => {
          const orderNumber = order.orderNumber;
          const statusLabel = getOrderStatusLabel(order.status);
          const created = new Date(order.createdAt);
          const paymentMethodLabel =
            order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay";

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
                  <h2 className="text-2xl font-semibold text-foreground">
                    {formatCurrency(order.total)}
                  </h2>
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
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Items</h3>
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
                  <h3 className="text-sm font-semibold text-foreground">Shipping information</h3>
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
    </section>
  );
}
