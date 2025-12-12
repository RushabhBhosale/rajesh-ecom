import type { Role } from "@/models/user";

export type AdminNavLink = {
  href: string;
  label: string;
  roles: Role[];
  group?: string;
};

export const adminNavLinks: AdminNavLink[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    roles: ["admin", "superadmin"],
  },
  { href: "/admin/inventory", label: "Inventory", roles: ["admin", "superadmin"] },
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
  {
    href: "/admin/submasters",
    label: "Submaster listing",
    roles: ["admin", "superadmin"],
    group: "Masters",
  },
  {
    href: "/admin/submasters/new",
    label: "Add submaster",
    roles: ["admin", "superadmin"],
    group: "Masters",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    roles: ["admin", "superadmin"],
  },
  { href: "/superadmin", label: "Super Admin", roles: ["superadmin"] },
];
