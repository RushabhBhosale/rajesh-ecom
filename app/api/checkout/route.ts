import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { checkoutPayloadSchema } from "@/lib/checkout-validation";
import { connectDB } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { getRazorpayClient, getRazorpayKeyId } from "@/lib/razorpay";
import { getStoreSettings } from "@/lib/store-settings/server";
import { OrderModel } from "@/models/order";
import { ProductModel, type ProductDocument } from "@/models/product";
import { VariantModel, type VariantDocument } from "@/models/variant";
import { TransactionModel } from "@/models/transaction";

type CheckoutVariant = {
  id: string;
  label: string;
  price: number;
  isDefault: boolean;
  stock: number;
  inStock: boolean;
  sku: string;
  condition: string;
  imageUrl: string;
};

function normalizeVariantDocuments(variants: VariantDocument[] | undefined): CheckoutVariant[] {
  if (!Array.isArray(variants)) {
    return [];
  }
  const seen = new Set<string>();
  return variants
    .map((variant) => ({
      id: variant._id.toString(),
      label: typeof variant.label === "string" ? variant.label.trim() : "",
      price: Number.isFinite(Number((variant as any)?.price))
        ? Number((variant as any)?.price)
        : Number.NaN,
      stock:
        Number.isFinite(Number((variant as any)?.stock)) && Number((variant as any)?.stock) >= 0
          ? Number((variant as any)?.stock)
          : 1,
      inStock: typeof (variant as any)?.inStock === "boolean" ? Boolean((variant as any)?.inStock) : true,
      sku: typeof (variant as any)?.sku === "string" ? (variant as any).sku.trim() : "",
      condition:
        typeof (variant as any)?.condition === "string"
          ? ((variant as any).condition as string)
          : "refurbished",
      imageUrl:
        typeof (variant as any)?.imageUrl === "string" ? (variant as any).imageUrl.trim() : "",
      isDefault: Boolean(variant.isDefault),
    }))
    .filter((variant) => {
      if (!variant.label || Number.isNaN(variant.price) || variant.price < 0) {
        return false;
      }
      const key = variant.label.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function buildFallbackVariant(): CheckoutVariant {
  return {
    id: "",
    label: "Base configuration",
    price: 0,
    stock: 0,
    inStock: false,
    sku: "",
    condition: "refurbished",
    imageUrl: "",
    isDefault: true,
  };
}

export async function POST(request: Request) {
  const decremented: Array<{ variantId: string; quantity: number }> = [];

  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const payload = checkoutPayloadSchema.parse(await request.json());
    await connectDB();

    const productIds = payload.items.map((item) => item.productId);
    const uniqueIds = [...new Set(productIds)];
    const products = await ProductModel.find({ _id: { $in: uniqueIds } }).lean<ProductDocument[]>();

    const variantDocs = await VariantModel.find({ productId: { $in: uniqueIds } }).lean<VariantDocument[]>();
    const rawVariantMap = new Map<string, VariantDocument[]>();
    variantDocs.forEach((variant) => {
      const key = typeof variant.productId === "string" ? variant.productId : variant.productId?.toString();
      if (!key) {
        return;
      }
      if (!rawVariantMap.has(key)) {
        rawVariantMap.set(key, []);
      }
      rawVariantMap.get(key)?.push(variant);
    });

    const variantMap = new Map<string, CheckoutVariant[]>();
    rawVariantMap.forEach((variants, key) => {
      variantMap.set(key, normalizeVariantDocuments(variants));
    });

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
      const variantLabel = typeof item.variant === "string" && item.variant.trim().length > 0
        ? item.variant.trim()
        : null;
      const normalizedVariantsFromMap = variantMap.get(product._id.toString()) ?? [];
      const normalizedVariants =
        normalizedVariantsFromMap.length > 0
          ? normalizedVariantsFromMap
          : [buildFallbackVariant()];
      const matchedVariant = variantLabel
        ? normalizedVariants.find(
            (variant) => variant.label.toLowerCase() === variantLabel.toLowerCase()
          )
        : normalizedVariants.find((variant) => variant.isDefault) ?? normalizedVariants[0];
      if (variantLabel && !matchedVariant) {
        throw new Error("INVALID_VARIANT_SELECTION");
      }
      if (matchedVariant && (!matchedVariant.inStock || matchedVariant.stock <= 0)) {
        throw new Error("OUT_OF_STOCK");
      }
      if (matchedVariant && item.quantity > matchedVariant.stock) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      const unitPrice = matchedVariant ? matchedVariant.price : 0;
      return {
        productId: product._id,
        name: product.name,
        price: unitPrice,
        quantity: item.quantity,
        imageUrl: matchedVariant?.imageUrl ?? "",
        category: product.category ?? "",
        condition: matchedVariant?.condition ?? "",
        color,
        variant: matchedVariant?.label ?? "",
        variantId: matchedVariant?.id ?? null,
      };
    });

    // Aggregate stock deductions per variant
    const stockAdjustments = new Map<string, number>();
    orderItems.forEach((item) => {
      if (item.variantId) {
        stockAdjustments.set(
          item.variantId,
          (stockAdjustments.get(item.variantId) ?? 0) + item.quantity
        );
      }
    });

    // Apply stock deductions with optimistic locking
    for (const [variantId, quantity] of stockAdjustments.entries()) {
      const updated = await VariantModel.findOneAndUpdate(
        { _id: variantId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!updated) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // Ensure inStock flag reflects current quantity
      const shouldBeInStock = updated.stock > 0;
      if (updated.inStock !== shouldBeInStock) {
        updated.inStock = shouldBeInStock;
        await updated.save();
      }

      decremented.push({ variantId, quantity });
    }

    const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
    if (subtotal <= 0) {
      return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 });
    }

    const settings = await getStoreSettings();
    const taxRate = settings.gstEnabled ? settings.gstRate / 100 : 0;
    const shippingAmount = settings.shippingEnabled ? Number(settings.shippingAmount.toFixed(2)) : 0;
    const tax = Number((subtotal * taxRate).toFixed(2));
    const total = Number((subtotal + tax + shippingAmount).toFixed(2));

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
      userId: actor.id ?? null,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: customerPhone,
      shippingAddress,
      items: orderItems,
      subtotal,
      tax,
      shipping: shippingAmount,
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
      shipping: shippingAmount,
      items: orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        color: item.color,
        variant: item.variant,
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
    if (decremented.length > 0) {
      for (const adjustment of decremented) {
        const restored = await VariantModel.findByIdAndUpdate(
          adjustment.variantId,
          { $inc: { stock: adjustment.quantity } },
          { new: true }
        );
        if (restored) {
          const shouldBeInStock = restored.stock > 0;
          if (restored.inStock !== shouldBeInStock) {
            restored.inStock = shouldBeInStock;
            await restored.save();
          }
        }
      }
    }

    console.error("Checkout error", error);
    if (error instanceof Error && error.message === "INVALID_VARIANT_SELECTION") {
      return NextResponse.json({ error: "Selected configuration is unavailable" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "OUT_OF_STOCK") {
      return NextResponse.json({ error: "Selected variant is out of stock" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Insufficient stock for one or more items" }, { status: 400 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to process checkout" }, { status: 500 });
  }
}
