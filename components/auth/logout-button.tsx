"use client";

import { type ComponentProps, type ReactNode, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  children?: ReactNode;
  redirectTo?: string;
  onLogout?: () => void;
}

export function LogoutButton({
  className,
  variant = "ghost",
  size,
  children,
  redirectTo = "/",
  onLogout,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        onLogout?.();
        router.replace(redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={logout} disabled={isPending}>
      {children ?? (isPending ? "Signing out..." : "Sign out")}
    </Button>
  );
}
