import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { OrderModel } from "@/models/order";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await OrderModel.findOne({ _id: orderId, userId: user.id });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "returned") {
      return NextResponse.json({ message: "Order already marked as returned" }, { status: 200 });
    }

    if (order.status !== "delivered" && order.status !== "dispatched") {
      return NextResponse.json({
        error: "Order cannot be returned at this stage",
      }, { status: 400 });
    }

    order.status = "returned";
    await order.save();

    const summary = await getOrderById(order._id.toString());
    return NextResponse.json({ order: summary }, { status: 200 });
  } catch (error) {
    console.error("Request return failed", error);
    return NextResponse.json({ error: "Unable to request return" }, { status: 500 });
  }
}
