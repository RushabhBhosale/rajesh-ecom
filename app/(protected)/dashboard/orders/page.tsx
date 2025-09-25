import { Metadata } from "next";
import { redirect } from "next/navigation";

import { UserOrdersList } from "@/components/dashboard/user-orders-list";
import { getCurrentUser } from "@/lib/auth";
import { listOrdersByUser } from "@/lib/orders";

export const metadata: Metadata = {
  title: "My orders | Rajesh Control",
};

export default async function UserOrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orders = await listOrdersByUser(user.id);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">My orders</h1>
        <p className="text-sm text-muted-foreground">
          Track status updates, payment confirmations, and manage returns for your recent purchases.
        </p>
      </header>
      <UserOrdersList orders={orders} />
    </section>
  );
}
