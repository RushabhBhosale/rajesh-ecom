import { Metadata } from "next";

import { OrdersTable } from "@/components/admin/orders-table";
import { listOrders } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Orders | Rajesh Control",
};

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">Track purchase activity and payment states across the storefront.</p>
      </header>
      <OrdersTable data={orders} />
    </section>
  );
}
