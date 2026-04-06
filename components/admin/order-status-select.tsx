"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/order-status";

interface OrderStatusSelectProps {
  orderId: string;
  status: OrderStatusValue;
}

export function OrderStatusSelect({ orderId, status }: OrderStatusSelectProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderStatusValue>(status);
  const [pendingStatus, setPendingStatus] = useState<OrderStatusValue>(status);
  const [statusNote, setStatusNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setCurrentStatus(status);
    setPendingStatus(status);
    setStatusNote("");
    setIsEditing(false);
  }, [status]);

  const handleStatusChange = useCallback(
    (nextStatus: OrderStatusValue) => {
      if (nextStatus === currentStatus) {
        setPendingStatus(currentStatus);
        setStatusNote("");
        setIsEditing(false);
        return;
      }
      setPendingStatus(nextStatus);
      setIsEditing(true);
    },
    [currentStatus]
  );

  const handleCancel = useCallback(() => {
    if (isUpdating) {
      return;
    }
    setPendingStatus(currentStatus);
    setStatusNote("");
    setIsEditing(false);
  }, [currentStatus, isUpdating]);

  const handleSubmit = useCallback(
    async () => {
      if (pendingStatus === currentStatus) {
        setIsEditing(false);
        return;
      }

      const trimmedNote = statusNote.trim();
      setIsUpdating(true);
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: pendingStatus,
            note: trimmedNote || undefined,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            typeof data?.error === "string"
              ? data.error
              : Array.isArray(data?.error?.status)
                ? data.error.status[0]
                : Array.isArray(data?.error?.note)
                  ? data.error.note[0]
                : "Unable to update status";
          toast.error(message ?? "Unable to update status");
          return;
        }
        setCurrentStatus(pendingStatus);
        setPendingStatus(pendingStatus);
        setStatusNote("");
        setIsEditing(false);
        toast.success(trimmedNote ? "Order status and note updated" : "Order status updated");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Unable to update status");
      } finally {
        setIsUpdating(false);
      }
    },
    [currentStatus, orderId, pendingStatus, router, statusNote]
  );

  return (
    <div className="space-y-2">
      <Select
        value={pendingStatus}
        onValueChange={(value) => handleStatusChange(value as OrderStatusValue)}
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

      {isEditing ? (
        <div className="w-[280px] max-w-full space-y-2 rounded-md border border-border/70 bg-background/95 p-2 shadow-sm">
          <Input
            value={statusNote}
            onChange={(event) => setStatusNote(event.target.value)}
            placeholder="Optional note (e.g. shipped via Shiprocket)"
            maxLength={280}
            className="h-8 text-xs"
          />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
