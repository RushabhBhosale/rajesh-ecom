import Link from "next/link";
import { notFound } from "next/navigation";

import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import { getOrderById } from "@/lib/orders";
import { getTransactionById } from "@/lib/transactions";

interface TransactionDetailPageProps {
  params: Promise<{ transactionId: string }>;
}

function formatValue(value: string | null) {
  return value && value.trim().length > 0 ? value : "—";
}

export default async function AdminTransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const { transactionId } = await params;
  const transaction = await getTransactionById(transactionId);
  if (!transaction) {
    notFound();
  }

  const relatedOrder = transaction.orderId
    ? await getOrderById(transaction.orderId)
    : null;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Transaction
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          TX-{transaction.id.slice(-6).toUpperCase()}
        </h1>
        <p className="text-sm text-muted-foreground">
          Recorded{" "}
          {new Date(transaction.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Transaction details
          </h2>
          <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Amount
              </dt>
              <dd className="font-semibold text-foreground">
                {formatCurrency(transaction.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Currency
              </dt>
              <dd className="font-medium text-foreground">{transaction.currency}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Method
              </dt>
              <dd className="font-medium capitalize text-foreground">
                {transaction.paymentMethod}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Status
              </dt>
              <dd className="font-medium capitalize text-foreground">
                {transaction.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Gateway
              </dt>
              <dd className="font-medium capitalize text-foreground">
                {transaction.gateway}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Updated
              </dt>
              <dd className="font-medium text-foreground">
                {new Date(transaction.updatedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          </dl>
        </div>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground">References</h2>
          <dl className="space-y-3 text-sm text-muted-foreground">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Gateway transaction ID
              </dt>
              <dd className="break-all font-mono text-xs text-foreground">
                {formatValue(transaction.gatewayTransactionId)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Razorpay order ID
              </dt>
              <dd className="break-all font-mono text-xs text-foreground">
                {formatValue(transaction.razorpayOrderId)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground/80">
                Razorpay signature
              </dt>
              <dd className="break-all font-mono text-xs text-foreground">
                {formatValue(transaction.razorpaySignature)}
              </dd>
            </div>
          </dl>

          {relatedOrder ? (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Related order
              </p>
              <p className="text-sm font-semibold text-foreground">
                #{relatedOrder.orderNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {relatedOrder.customerName} ·{" "}
                {getOrderStatusLabel(relatedOrder.status)}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <Link
                  href={`/admin/orders/${relatedOrder.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open order
                </Link>
                <Link
                  href={`/admin/invoices/${relatedOrder.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open invoice
                </Link>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
