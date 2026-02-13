"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ReturnOrderButtonProps = ComponentProps<typeof Button> & {
  orderId: string;
};

export function ReturnOrderButton({ orderId, children, ...buttonProps }: ReturnOrderButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/return`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : "Unable to request return";
        toast.error(message);
        return;
      }
      toast.success(data?.message ?? "Return requested");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Unable to request a return right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button {...buttonProps} onClick={handleClick} disabled={isLoading || buttonProps.disabled}>
      {isLoading ? "Requesting…" : children}
    </Button>
  );
}
