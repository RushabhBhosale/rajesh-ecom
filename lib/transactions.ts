import { connectDB } from "@/lib/db";
import { TransactionModel, type TransactionDocument } from "@/models/transaction";

export interface TransactionSummary {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  gateway: string;
  gatewayTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  razorpayOrderId: string | null;
  razorpaySignature: string | null;
}

function mapTransaction(transaction: TransactionDocument): TransactionSummary {
  return {
    id: transaction._id.toString(),
    orderId: transaction.orderId?.toString?.() ?? "",
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    status: transaction.status,
    gateway: transaction.gateway,
    gatewayTransactionId: transaction.gatewayTransactionId || null,
    createdAt: transaction.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: transaction.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    razorpayOrderId: transaction.razorpayOrderId || null,
    razorpaySignature: transaction.razorpaySignature || null,
  };
}

export async function listTransactions(): Promise<TransactionSummary[]> {
  await connectDB();
  const transactions = await TransactionModel.find()
    .sort({ createdAt: -1 })
    .lean<TransactionDocument[]>();

  return (transactions ?? []).map(mapTransaction);
}
