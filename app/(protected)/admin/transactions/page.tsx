import { Metadata } from "next";

import { TransactionsTable } from "@/components/admin/transactions-table";
import { listTransactions } from "@/lib/transactions";

export const metadata: Metadata = {
  title: "Transactions | Rajesh Control",
};

export default async function AdminTransactionsPage() {
  const transactions = await listTransactions();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          View Razorpay captures and offline payment commitments linked to each order.
        </p>
      </header>
      <TransactionsTable data={transactions} />
    </section>
  );
}
