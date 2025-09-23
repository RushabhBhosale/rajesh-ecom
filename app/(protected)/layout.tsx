import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ProtectedAppShell } from "@/components/navigation/protected-app-shell";
import { getCurrentUser } from "@/lib/auth";
import type { Role } from "@/models/user";

const navLinks: Array<{ href: string; label: string; roles: Role[] }> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["user", "admin", "superadmin"],
  },
  { href: "/admin", label: "Admin", roles: ["admin", "superadmin"] },
  { href: "/admin/products", label: "Products", roles: ["admin", "superadmin"] },
  { href: "/admin/categories", label: "Categories", roles: ["admin", "superadmin"] },
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
