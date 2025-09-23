import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your access and activity.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You are signed in as</p>
            <p className="text-lg font-medium capitalize">{user?.role ?? "user"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Try visiting the admin and super admin areas to see role-based access in action.</p>
            <p>Use the sign-out button in the header to end your session securely.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Token security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Authentication uses HTTP-only JWT cookies with server-side verification and middleware
              guards for each role-specific route.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
