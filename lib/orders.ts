import { connectDB } from "@/lib/db";
import { OrderModel, type OrderDocument } from "@/models/order";

export interface OrderItemSummary {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl: string | null;
  category: string | null;
  condition: string | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItemSummary[];
}

function mapOrder(order: OrderDocument): OrderSummary {
  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        productId: item.productId?.toString?.() ?? "",
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        imageUrl: item.imageUrl || null,
        category: item.category || null,
        condition: item.condition || null,
      }))
    : [];

  return {
    id: order._id.toString(),
    orderNumber: order._id.toString().slice(-6).toUpperCase(),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    createdAt: order.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: order.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    razorpayOrderId: order.razorpayOrderId || null,
    razorpayPaymentId: order.razorpayPaymentId || null,
    shippingAddress: {
      line1: order.shippingAddress?.line1 ?? "",
      line2: order.shippingAddress?.line2 ?? "",
      city: order.shippingAddress?.city ?? "",
      state: order.shippingAddress?.state ?? "",
      postalCode: order.shippingAddress?.postalCode ?? "",
      country: order.shippingAddress?.country ?? "",
    },
    items,
  };
}

export async function listOrders(): Promise<OrderSummary[]> {
  await connectDB();
  const orders = await OrderModel.find()
    .sort({ createdAt: -1 })
    .lean<OrderDocument[]>();

  return (orders ?? []).map(mapOrder);
}

export async function listOrdersByUser(userId: string): Promise<OrderSummary[]> {
  await connectDB();
  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean<OrderDocument[]>();

  return (orders ?? []).map(mapOrder);
}

export async function getOrderById(id: string): Promise<OrderSummary | null> {
  await connectDB();
  const order = await OrderModel.findById(id).lean<OrderDocument | null>();
  if (!order) {
    return null;
  }
  return mapOrder(order);
}
