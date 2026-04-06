import Link from "next/link";
import { notFound } from "next/navigation";

import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import { getOrderById } from "@/lib/orders";

interface InvoiceDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function AdminInvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const invoiceIssuedAt = new Date(order.invoiceIssuedAt);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Invoice
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          {order.invoiceNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          Issued{" "}
          {invoiceIssuedAt.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          · Order #{order.orderNumber}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Bill To
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {order.customerName}
              </p>
              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ship To
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2
                  ? `\n${order.shippingAddress.line2}`
                  : ""}
                {`\n${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`}
                {`\n${order.shippingAddress.country}`}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Invoice items
            </h2>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li
                  key={`${item.productId}-${item.variant ?? "base"}-${item.color ?? "default"}`}
                  className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.variant ? (
                      <p className="text-xs text-muted-foreground">
                        {item.variant}
                      </p>
                    ) : null}
                    {item.color ? (
                      <p className="text-xs text-muted-foreground">
                        Colour: {item.color}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(item.total)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Invoice summary
            </p>
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
                <span className="font-semibold text-foreground">
                  {order.shipping > 0 ? formatCurrency(order.shipping) : "Complimentary"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Order status:</span>{" "}
              {getOrderStatusLabel(order.status)}
            </p>
            <p>
              <span className="font-medium text-foreground">Payment status:</span>{" "}
              {order.paymentStatus}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={`/api/orders/${order.id}/invoice`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Open printable invoice
            </a>
            <Link
              href={`/admin/orders/${order.id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Open order details
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
