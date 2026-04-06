import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  createOrderEmailPayload,
  sendOrderStatusUpdateEmail,
} from "@/lib/mailer";
import { ORDER_STATUS_VALUES, type OrderStatusValue } from "@/lib/order-status";
import { getOrderById } from "@/lib/orders";
import { OrderModel } from "@/models/order";
import { TransactionModel } from "@/models/transaction";

const STATUS_VALUES = ORDER_STATUS_VALUES as [OrderStatusValue, ...OrderStatusValue[]];

const payloadSchema = z.object({
  status: z.enum(STATUS_VALUES),
  note: z.string().trim().max(280, "Status note must be 280 characters or less.").optional(),
});

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, note } = payloadSchema.parse(await request.json());

    await connectDB();
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const previousStatus = order.status;
    if (status === previousStatus) {
      const currentSummary = await getOrderById(orderId);
      return NextResponse.json({ order: currentSummary }, { status: 200 });
    }

    const normalizedNote = note?.trim() ?? "";
    const existingMetadata = toRecord(order.metadata);
    const existingStatusUpdates = Array.isArray(existingMetadata.statusUpdates)
      ? existingMetadata.statusUpdates
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) => ({ ...(entry as Record<string, unknown>) }))
      : [];

    const updateMetadata: Record<string, unknown> = {
      ...existingMetadata,
      latestStatusNote: normalizedNote || null,
      statusUpdates: [
        {
          previousStatus,
          status,
          note: normalizedNote || null,
          updatedAt: new Date().toISOString(),
          updatedBy: actor.email,
        },
        ...existingStatusUpdates,
      ].slice(0, 25),
    };

    const update: Record<string, unknown> = { status, metadata: updateMetadata };
    if (order.paymentMethod === "cod" && status === "delivered") {
      update.paymentStatus = "paid";
    }

    const updated = await OrderModel.findByIdAndUpdate(orderId, update, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (update.paymentStatus === "paid") {
      await TransactionModel.findOneAndUpdate(
        { orderId: updated._id },
        { status: "paid" },
        { sort: { createdAt: -1 } }
      );
    }

    const summary = await getOrderById(updated._id.toString());
    if (summary && summary.status !== previousStatus) {
      const emailPayload = createOrderEmailPayload(summary);
      void sendOrderStatusUpdateEmail({
        ...emailPayload,
        previousStatus,
        statusNote: normalizedNote || null,
      }).catch((emailError) => {
        console.error("Order status email failed", emailError);
      });
    }

    return NextResponse.json({ order: summary }, { status: 200 });
  } catch (error) {
    console.error("Update order status failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
