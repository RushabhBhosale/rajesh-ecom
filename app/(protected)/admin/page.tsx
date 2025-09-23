import { CreateUserForm } from "@/components/auth/create-user-form";
import { ProductManager } from "@/components/products/product-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProducts } from "@/lib/products";
import { listUsers } from "@/lib/users";

export default async function AdminPage() {
  const users = await listUsers();
  const products = await listProducts();

  return (
    <section className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Admin overview</h1>
        <p className="text-muted-foreground">
          Review user accounts and curate the catalogue that powers the storefront experience.
        </p>
      </div>
      <div className="space-y-6">
        <CreateUserForm
          allowedRoles={["user"]}
          heading="Invite a new user"
          description="Create shopper or staff accounts. They can update their password after first sign in."
        />
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
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
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Product catalogue</h2>
        <p className="text-muted-foreground">
          Add, edit, and feature refurbished or factory-new devices that appear in marketing pages.
        </p>
        <ProductManager products={products} />
      </div>
    </section>
  );
}
