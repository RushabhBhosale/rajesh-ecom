import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/order-status";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/models/order";
import { TransactionModel } from "@/models/transaction";

interface OrderStatusBreakdownEntry {
  status: OrderStatusValue;
  label: string;
  count: number;
  revenue: number;
}

interface MonthlyOrderEntry {
  month: string;
  orderCount: number;
  revenue: number;
}

interface PaymentMethodEntry {
  method: string;
  label: string;
  count: number;
  revenue: number;
}

interface TransactionStatusEntry {
  status: string;
  count: number;
  amount: number;
}

interface RecentOrderEntry {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  totals: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    processingOrders: number;
    fulfilledOrders: number;
  };
  ordersByStatus: OrderStatusBreakdownEntry[];
  monthlyOrders: MonthlyOrderEntry[];
  paymentMethods: PaymentMethodEntry[];
  transactionsByStatus: TransactionStatusEntry[];
  recentOrders: RecentOrderEntry[];
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  razorpay: "Razorpay",
};

function getOrderNumberFromId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  await connectDB();

  const monthsToInclude = 4;
  const dateRangeStart = new Date();
  dateRangeStart.setHours(0, 0, 0, 0);
  dateRangeStart.setMonth(dateRangeStart.getMonth() - (monthsToInclude - 1), 1);

  const [
    orderTotalsAggregation,
    orderStatusAggregation,
    monthlyOrdersAggregation,
    paymentMethodAggregation,
    transactionStatusAggregation,
    recentOrdersDocs,
  ] = await Promise.all([
    OrderModel.aggregate<{
      _id: null;
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      processingOrders: number;
      fulfilledOrders: number;
    }>([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
          processingOrders: {
            $sum: {
              $cond: [{ $in: ["$status", ["placed", "processing", "dispatched"]] }, 1, 0],
            },
          },
          fulfilledOrders: {
            $sum: {
              $cond: [{ $in: ["$status", ["delivered"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    OrderModel.aggregate<{
      _id: string;
      count: number;
      revenue: number;
    }>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]),
    OrderModel.aggregate<{
      _id: { year: number; month: number };
      orderCount: number;
      revenue: number;
    }>([
      { $match: { createdAt: { $gte: dateRangeStart } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          orderCount: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    OrderModel.aggregate<{
      _id: string;
      count: number;
      revenue: number;
    }>([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]),
    TransactionModel.aggregate<{
      _id: string;
      count: number;
      amount: number;
    }>([
      { $match: { createdAt: { $gte: dateRangeStart } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),
    OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select(["customerName", "total", "status", "createdAt"])
      .lean<{
        _id: { toString(): string };
        customerName: string;
        total: number;
        status: string;
        createdAt?: Date;
      }>()
      .exec(),
  ]);

  const totals = orderTotalsAggregation[0] ?? {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    processingOrders: 0,
    fulfilledOrders: 0,
  };

  const ordersByStatus: OrderStatusBreakdownEntry[] = ORDER_STATUSES.map((status) => {
    const match = orderStatusAggregation.find((entry) => entry._id === status.value);
    return {
      status: status.value,
      label: status.label,
      count: match?.count ?? 0,
      revenue: match?.revenue ?? 0,
    };
  });

  const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short" });
  const monthlyMap = new Map(
    monthlyOrdersAggregation.map((entry) => [
      `${entry._id.year}-${entry._id.month}`,
      { orderCount: entry.orderCount, revenue: entry.revenue },
    ])
  );
  const monthlyOrders: MonthlyOrderEntry[] = [];
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  for (let index = monthsToInclude - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - index);
    const mapKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const entry = monthlyMap.get(mapKey);
    monthlyOrders.push({
      month: `${monthFormatter.format(date)} ${date.getFullYear()}`,
      orderCount: entry?.orderCount ?? 0,
      revenue: entry?.revenue ?? 0,
    });
  }

  const paymentMethods: PaymentMethodEntry[] = paymentMethodAggregation
    .map((entry) => ({
      method: entry._id,
      label: PAYMENT_METHOD_LABELS[entry._id] ?? entry._id,
      count: entry.count,
      revenue: entry.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const transactionsByStatus: TransactionStatusEntry[] = transactionStatusAggregation
    .map((entry) => ({
      status: entry._id,
      count: entry.count,
      amount: entry.amount,
    }))
    .sort((a, b) => b.count - a.count);

  const recentOrderList = Array.isArray(recentOrdersDocs) ? recentOrdersDocs : [];

  const recentOrders: RecentOrderEntry[] = recentOrderList.map((order) => ({
    id: order._id.toString(),
    orderNumber: getOrderNumberFromId(order._id.toString()),
    customerName: order.customerName,
    status: order.status,
    total: order.total ?? 0,
    createdAt: order.createdAt?.toISOString?.() ?? new Date().toISOString(),
  }));

  return {
    totals: {
      totalRevenue: totals.totalRevenue ?? 0,
      totalOrders: totals.totalOrders ?? 0,
      averageOrderValue: totals.averageOrderValue ?? 0,
      processingOrders: totals.processingOrders ?? 0,
      fulfilledOrders: totals.fulfilledOrders ?? 0,
    },
    ordersByStatus,
    monthlyOrders,
    paymentMethods,
    transactionsByStatus,
    recentOrders,
  };
}
