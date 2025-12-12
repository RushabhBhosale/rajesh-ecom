import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { adminNavLinks } from "@/components/navigation/admin-nav-links";
import { ProtectedAppShell } from "@/components/navigation/protected-app-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "superadmin") {
    redirect("/admin/dashboard");
  }

  return (
    <ProtectedAppShell user={user} navLinks={adminNavLinks}>
      {children}
    </ProtectedAppShell>
  );
}
