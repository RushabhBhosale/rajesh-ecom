import mongoose, { Schema, type InferSchemaType } from "mongoose";

const paymentMethods = ["cod", "razorpay"] as const;
const transactionStatuses = ["pending", "paid", "failed", "refunded"] as const;
const gateways = ["manual", "razorpay"] as const;

type PaymentMethod = (typeof paymentMethods)[number];
type TransactionStatus = (typeof transactionStatuses)[number];
type Gateway = (typeof gateways)[number];

const TransactionSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, enum: paymentMethods, required: true },
    status: { type: String, enum: transactionStatuses, default: "pending" },
    gateway: { type: String, enum: gateways, default: "manual" },
    gatewayTransactionId: { type: String, default: "", trim: true },
    razorpayOrderId: { type: String, default: "", trim: true },
    razorpaySignature: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    rawPayload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export type TransactionDocument = InferSchemaType<typeof TransactionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type TransactionPaymentMethod = PaymentMethod;
export type TransactionStatusValue = TransactionStatus;
export type TransactionGateway = Gateway;

export const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model<TransactionDocument>("Transaction", TransactionSchema);
