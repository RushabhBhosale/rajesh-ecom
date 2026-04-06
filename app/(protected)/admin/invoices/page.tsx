import { Metadata } from "next";

import { InvoicesTable } from "@/components/admin/invoices-table";
import { listOrders } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Invoices | Rajesh Control",
};

export default async function AdminInvoicesPage() {
  const orders = await listOrders();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Browse generated invoices and open printable invoice documents linked
          to each order.
        </p>
      </header>
      <InvoicesTable data={orders} />
    </section>
  );
}
