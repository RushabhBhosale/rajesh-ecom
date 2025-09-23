import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/40 px-4 text-center">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Secure access control for your Next.js commerce platform
        </h1>
        <p className="text-lg text-muted-foreground">
          Role-based authentication with JWT cookies, MongoDB persistence, and middleware guards.
          Start by creating an account or sign in to see the protected dashboard.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild>
          <Link href="/register">Get started</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
