import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ProtectedAppShell } from "@/components/navigation/protected-app-shell";
import { getCurrentUser } from "@/lib/auth";
import type { Role } from "@/models/user";

const navLinks: Array<{
  href: string;
  label: string;
  roles: Role[];
  group?: string;
}> = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    roles: ["admin", "superadmin"],
  },
  { href: "/dashboard/orders", label: "My orders", roles: ["user"] },
  { href: "/admin/orders", label: "Orders", roles: ["admin", "superadmin"] },
  {
    href: "/admin/transactions",
    label: "Transactions",
    roles: ["admin", "superadmin"],
  },
  {
    href: "/admin/products",
    label: "Product listing",
    roles: ["admin", "superadmin"],
    group: "Products",
  },
  {
    href: "/admin/products/new",
    label: "Add product",
    roles: ["admin", "superadmin"],
    group: "Products",
  },
  {
    href: "/admin/categories",
    label: "Category listing",
    roles: ["admin", "superadmin"],
    group: "Categories",
  },
  {
    href: "/admin/categories/new",
    label: "Add category",
    roles: ["admin", "superadmin"],
    group: "Categories",
  },
  {
    href: "/admin/masters",
    label: "Master listing",
    roles: ["admin", "superadmin"],
    group: "Masters",
  },
  {
    href: "/admin/masters/new",
    label: "Add master",
    roles: ["admin", "superadmin"],
    group: "Masters",
  },
  { href: "/superadmin", label: "Super Admin", roles: ["superadmin"] },
];

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ProtectedAppShell user={user} navLinks={navLinks}>
      {children}
    </ProtectedAppShell>
  );
}
