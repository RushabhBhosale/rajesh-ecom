import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { checkoutPayloadSchema } from "@/lib/checkout-validation";
import { connectDB } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { getRazorpayClient, getRazorpayKeyId } from "@/lib/razorpay";
import { OrderModel } from "@/models/order";
import { ProductModel, type ProductDocument } from "@/models/product";
import { TransactionModel } from "@/models/transaction";

const TAX_RATE = 0.18;

export async function POST(request: Request) {
  try {
    const payload = checkoutPayloadSchema.parse(await request.json());
    await connectDB();

    const productIds = payload.items.map((item) => item.productId);
    const uniqueIds = [...new Set(productIds)];
    const products = await ProductModel.find({ _id: { $in: uniqueIds } }).lean<ProductDocument[]>();

    if (products.length !== uniqueIds.length) {
      return NextResponse.json({ error: "One or more items are unavailable" }, { status: 400 });
    }

    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = payload.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      const color = typeof item.color === "string" && item.color.trim().length > 0
        ? item.color.trim()
        : null;
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl ?? "",
        category: product.category ?? "",
        condition: product.condition ?? "",
        color,
      };
    });

    const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
    if (subtotal <= 0) {
      return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 });
    }

    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const user = await getCurrentUser();

    const shippingAddress = {
      line1: payload.addressLine1,
      line2: payload.addressLine2 ?? "",
      city: payload.city,
      state: payload.state,
      postalCode: payload.postalCode,
      country: payload.country || "India",
    };

    const customerPhone = payload.customerPhone;

    const order = await OrderModel.create({
      userId: user?.id ?? null,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: customerPhone,
      shippingAddress,
      items: orderItems,
      subtotal,
      tax,
      total,
      currency: "INR",
      paymentMethod: payload.paymentMethod,
      paymentStatus: "pending",
      status: "placed",
      notes: payload.notes ?? "",
    });

    const transaction = await TransactionModel.create({
      orderId: order._id,
      amount: total,
      currency: "INR",
      paymentMethod: payload.paymentMethod,
      status: "pending",
      gateway: payload.paymentMethod === "razorpay" ? "razorpay" : "manual",
    });

    const emailPayload = {
      to: order.customerEmail,
      customerName: order.customerName,
      orderId: order._id.toString(),
      orderNumber: order._id.toString().slice(-6).toUpperCase(),
      status: order.status,
      paymentMethod: order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay",
      paymentStatus: order.paymentStatus,
      total,
      currency: order.currency,
      items: orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        color: item.color,
      })),
      shippingAddress: {
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
    };

    if (payload.paymentMethod === "cod") {
      void sendOrderConfirmationEmail(emailPayload).catch((error) => {
        console.error("Order confirmation email failed", error);
      });
      return NextResponse.json(
        {
          orderId: order._id.toString(),
          transactionId: transaction._id.toString(),
          total,
          currency: "INR",
          message: "Order placed successfully. Our team will contact you shortly.",
        },
        { status: 201 }
      );
    }

    try {
      const razorpay = getRazorpayClient();
      const amountInPaise = Math.round(total * 100);
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order._id.toString(),
        notes: {
          orderId: order._id.toString(),
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
        },
      });

      await OrderModel.findByIdAndUpdate(order._id, {
        razorpayOrderId: razorpayOrder.id,
      });

      await TransactionModel.findByIdAndUpdate(transaction._id, {
        razorpayOrderId: razorpayOrder.id,
        status: "pending",
      });

      void sendOrderConfirmationEmail(emailPayload).catch((error) => {
        console.error("Order confirmation email failed", error);
      });

      return NextResponse.json(
        {
          orderId: order._id.toString(),
          transactionId: transaction._id.toString(),
          razorpayOrderId: razorpayOrder.id,
          amount: amountInPaise,
          currency: razorpayOrder.currency,
          razorpayKey: getRazorpayKeyId(),
          customer: {
            name: payload.customerName,
            email: payload.customerEmail,
            phone: payload.customerPhone,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      await OrderModel.findByIdAndDelete(order._id);
      await TransactionModel.findByIdAndDelete(transaction._id);
      throw error;
    }
  } catch (error) {
    console.error("Checkout error", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to process checkout" }, { status: 500 });
  }
}
