import Link from "next/link";
import { ArrowUpRight, Boxes, Layers, UsersRound } from "lucide-react";

import { CreateUserForm } from "@/components/auth/create-user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategories } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { listUsers } from "@/lib/users";

export default async function AdminPage() {
  const users = await listUsers();
  const products = await listProducts();
  const categories = await listCategories();

  const featuredCount = products.filter((product) => product.featured).length;

  return (
    <section className="space-y-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground">Admin overview</h1>
        <p className="text-muted-foreground">
          Review your key metrics at a glance and jump into catalogue or user management tasks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total products</CardTitle>
            <Boxes className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{products.length}</p>
            <p className="text-xs text-muted-foreground">{featuredCount} featured on the storefront</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <Layers className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Aggregated from current products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active users</CardTitle>
            <UsersRound className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Includes shoppers and internal staff</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
              Products
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Search and sort the entire inventory, update pricing, and feature the right devices.
            </p>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Go to product catalogue
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
              Categories
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Understand how your assortment is structured and spot opportunities to balance inventory.
            </p>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Review category listing
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <CreateUserForm
          allowedRoles={["user"]}
          heading="Invite a new user"
          description="Create shopper or staff accounts. They can update their password after first sign in."
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Latest users</CardTitle>
            <p className="text-sm text-muted-foreground">An at-a-glance view of everyone with platform access.</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{user.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-2 capitalize">{user.role}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Intl.DateTimeFormat("en", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }).format(new Date(user.createdAt ?? Date.now()))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
