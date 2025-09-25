import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ORDER_STATUS_VALUES, type OrderStatusValue } from "@/lib/order-status";
import { getOrderById } from "@/lib/orders";
import { OrderModel } from "@/models/order";

const STATUS_VALUES = ORDER_STATUS_VALUES as [OrderStatusValue, ...OrderStatusValue[]];

const payloadSchema = z.object({
  status: z.enum(STATUS_VALUES),
});

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = payloadSchema.parse(await request.json());

    await connectDB();
    const updated = await OrderModel.findByIdAndUpdate(
      params.orderId,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const summary = await getOrderById(updated._id.toString());
    return NextResponse.json({ order: summary }, { status: 200 });
  } catch (error) {
    console.error("Update order status failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
