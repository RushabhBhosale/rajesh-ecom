import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { razorpayVerificationSchema } from "@/lib/checkout-validation";
import { connectDB } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { OrderModel } from "@/models/order";
import { TransactionModel } from "@/models/transaction";

export async function POST(request: Request) {
  try {
    const payload = razorpayVerificationSchema.parse(await request.json());
    await connectDB();

    const order = await OrderModel.findById(payload.orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.razorpayOrderId) {
      return NextResponse.json({ error: "Order is not configured for Razorpay" }, { status: 400 });
    }

    if (order.razorpayOrderId !== payload.razorpayOrderId) {
      return NextResponse.json({ error: "Razorpay order mismatch" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId: payload.razorpayOrderId,
      razorpayPaymentId: payload.razorpayPaymentId,
      razorpaySignature: payload.razorpaySignature,
    });

    if (!isValid) {
      await OrderModel.findByIdAndUpdate(order._id, {
        paymentStatus: "failed",
      });
      await TransactionModel.findOneAndUpdate(
        { orderId: order._id },
        {
          status: "failed",
          gatewayTransactionId: payload.razorpayPaymentId,
          razorpaySignature: payload.razorpaySignature,
          rawPayload: payload,
        },
        { sort: { createdAt: -1 } }
      );
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    await OrderModel.findByIdAndUpdate(order._id, {
      paymentStatus: "paid",
      razorpayPaymentId: payload.razorpayPaymentId,
      razorpaySignature: payload.razorpaySignature,
    });

    await TransactionModel.findOneAndUpdate(
      { orderId: order._id },
      {
        status: "paid",
        gatewayTransactionId: payload.razorpayPaymentId,
        razorpayOrderId: payload.razorpayOrderId,
        razorpaySignature: payload.razorpaySignature,
        rawPayload: payload,
      },
      { sort: { createdAt: -1 } }
    );

    return NextResponse.json({ message: "Payment verified" }, { status: 200 });
  } catch (error) {
    console.error("Razorpay verify error", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to verify payment" }, { status: 500 });
  }
}
