import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/lib/auth";
import type { Role } from "@/models/user";

const navLinks: Array<{ href: string; label: string; roles: Role[] }> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["user", "admin", "superadmin"],
  },
  { href: "/admin", label: "Admin", roles: ["admin", "superadmin"] },
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
    <div className="min-h-screen bg-muted/10">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="font-semibold">
              {user.name}{" "}
              <span className="text-sm text-muted-foreground">
                ({user.role})
              </span>
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3">
            {navLinks
              .filter((link) => link.roles.includes(user.role))
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
