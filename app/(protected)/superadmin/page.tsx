import { CreateUserForm } from "@/components/auth/create-user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listUsers } from "@/lib/users";

const roleUpdateSnippet =
  'db.users.updateOne({"email": "team@company.com"}, {$set: {role: "admin"}})';

export default async function SuperAdminPage() {
  const users = await listUsers();
  const totalAdmins = users.filter((user) => user.role === "admin").length;
  const totalSuperAdmins = users.filter((user) => user.role === "superadmin").length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Super admin controls</h1>
        <p className="text-muted-foreground">
          Super admins can bootstrap the platform and manage high-trust configuration.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Role distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Total users: {users.length}</p>
            <p>Admins: {totalAdmins}</p>
            <p>Super admins: {totalSuperAdmins}</p>
          </CardContent>
        </Card>
        <CreateUserForm
          allowedRoles={["user", "admin", "superadmin"]}
          heading="Create team member"
          description="Super admins can elevate teammates instantly."
        />
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Promoting team members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Assign elevated roles by updating the user document in MongoDB (or add your own
              admin-only API). The registration endpoint only grants admin privileges when the
              platform is first bootstrapped.
            </p>
            <div className="rounded-md bg-muted p-3 font-mono text-xs">
              {roleUpdateSnippet}
            </div>
            <p>
              For production, wrap this logic in an API route that checks the caller&apos;s super admin
              role before updating.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
