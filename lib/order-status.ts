export const ORDER_STATUSES = [
  { id: "1", value: "placed", label: "Placed" },
  { id: "2", value: "processing", label: "Processing" },
  { id: "3", value: "dispatched", label: "Dispatched" },
  { id: "4", value: "delivered", label: "Delivered" },
  { id: "5", value: "cancelled", label: "Cancelled" },
  { id: "6", value: "returned", label: "Returned" },
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]["value"];

export function getOrderStatusLabel(status: string) {
  const match = ORDER_STATUSES.find((entry) => entry.value === status);
  return match ? match.label : status;
}

export const ORDER_STATUS_VALUES = ORDER_STATUSES.map((status) => status.value);
