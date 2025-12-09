import mongoose, { Schema, type InferSchemaType } from "mongoose";

import { ORDER_STATUS_VALUES } from "@/lib/order-status";

const addressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "India" },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    condition: { type: String, default: "", trim: true },
    color: { type: String, default: "", trim: true },
    variant: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const paymentMethods = ["cod", "razorpay"] as const;
const paymentStatuses = ["pending", "paid", "failed"] as const;

type PaymentMethod = (typeof paymentMethods)[number];
type PaymentStatus = (typeof paymentStatuses)[number];
type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    shippingAddress: { type: addressSchema, required: true },
    items: { type: [orderItemSchema], required: true, default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, enum: paymentMethods, required: true },
    paymentStatus: { type: String, enum: paymentStatuses, default: "pending" },
    status: { type: String, enum: [...ORDER_STATUS_VALUES], default: "placed" },
    razorpayOrderId: { type: String, default: "", trim: true },
    razorpayPaymentId: { type: String, default: "", trim: true },
    razorpaySignature: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export type OrderDocument = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type OrderPaymentMethod = PaymentMethod;
export type OrderPaymentStatus = PaymentStatus;
export type OrderStatusValue = OrderStatus;

export const OrderModel =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", OrderSchema);
