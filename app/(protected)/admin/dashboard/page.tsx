import { Metadata } from "next";

import { AdminDashboardContent } from "@/components/admin/dashboard/admin-dashboard-content";
import { getAdminDashboardMetrics } from "@/lib/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Rajesh Control",
};

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics();

  return <AdminDashboardContent metrics={metrics} />;
}
