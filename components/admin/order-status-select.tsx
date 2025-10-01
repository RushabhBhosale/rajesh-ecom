"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/order-status";

interface OrderStatusSelectProps {
  orderId: string;
  status: OrderStatusValue;
}

export function OrderStatusSelect({ orderId, status }: OrderStatusSelectProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderStatusValue>(status);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const handleChange = useCallback(
    async (nextStatus: OrderStatusValue) => {
      if (nextStatus === currentStatus) {
        return;
      }
      setIsUpdating(true);
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            typeof data?.error === "string"
              ? data.error
              : Array.isArray(data?.error?.status)
                ? data.error.status[0]
                : "Unable to update status";
          toast.error(message ?? "Unable to update status");
          return;
        }
        setCurrentStatus(nextStatus);
        toast.success("Order status updated");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Unable to update status");
      } finally {
        setIsUpdating(false);
      }
    },
    [currentStatus, orderId, router]
  );

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => handleChange(value as OrderStatusValue)}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
