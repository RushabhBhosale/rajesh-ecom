import { CreateUserForm } from "@/components/auth/create-user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listUsers } from "@/lib/users";

export default async function AdminPage() {
  const users = await listUsers();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin overview</h1>
        <p className="text-muted-foreground">
          Review all registered users. Only admins and super admins can access this area.
        </p>
      </div>
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
    </section>
  );
}
