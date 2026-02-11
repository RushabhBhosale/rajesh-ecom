"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminDashboardMetrics } from "@/lib/dashboard";
import { getOrderStatusLabel } from "@/lib/order-status";

interface AdminDashboardContentProps {
  metrics: AdminDashboardMetrics;
}

type MonthlyOrderEntry = AdminDashboardMetrics["monthlyOrders"][number];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const chartColors = ["#2563eb", "#9333ea", "#0ea5e9", "#ec4899", "#f97316", "#22c55e"];

function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return currencyFormatter.format(safeValue);
}

function formatNumber(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return numberFormatter.format(safeValue);
}

export function AdminDashboardContent({ metrics }: AdminDashboardContentProps) {
  const hasMonthlyData = metrics.monthlyOrders.some((entry) => entry.orderCount > 0 || entry.revenue > 0);
  const hasRevenueData = metrics.monthlyOrders.some((entry) => entry.revenue > 0);
  const hasOrderData = metrics.monthlyOrders.some((entry) => entry.orderCount > 0);
  const hasPaymentData = metrics.paymentMethods.some((entry) => entry.revenue > 0);
  const hasTransactionData = metrics.transactionsByStatus.some((entry) => entry.count > 0 || entry.amount > 0);
  const monthlyRevenuePeak = hasRevenueData
    ? metrics.monthlyOrders.reduce<MonthlyOrderEntry | null>((best, entry) => {
        if (!best || entry.revenue > best.revenue) {
          return entry;
        }
        return best;
      }, null)
    : null;
  const monthlyOrdersPeak = hasOrderData
    ? metrics.monthlyOrders.reduce<MonthlyOrderEntry | null>((best, entry) => {
        if (!best || entry.orderCount > best.orderCount) {
          return entry;
        }
        return best;
      }, null)
    : null;
  const useRevenueForBars = hasRevenueData;
  const maxMonthlyValue = metrics.monthlyOrders.reduce((max, entry) => {
    const value = useRevenueForBars ? entry.revenue : entry.orderCount;
    return value > max ? value : max;
  }, 0);
  const transactionChartData = metrics.transactionsByStatus.map((entry) => ({
    ...entry,
    label: entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
  }));

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Store dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor orders, payments, and fulfillment activity to keep the storefront running smoothly.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-foreground">{formatCurrency(metrics.totals.totalRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Gross sales generated across all orders.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-foreground">{formatNumber(metrics.totals.totalOrders)}</p>
            <p className="mt-1 text-xs text-muted-foreground">All orders received through the storefront.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average order value</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-foreground">{formatCurrency(metrics.totals.averageOrderValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Revenue generated per order on average.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-foreground">{formatNumber(metrics.totals.processingOrders)}</p>
              <p className="text-xs text-muted-foreground">Orders currently moving through processing.</p>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivered</span>
              <span className="text-sm font-semibold text-foreground">{formatNumber(metrics.totals.fulfilledOrders)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">Monthly performance snapshot</CardTitle>
            <p className="text-sm text-muted-foreground">
              A quick look at how the last four months have trended across orders and revenue.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {hasMonthlyData ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue leader</p>
                    {hasRevenueData && monthlyRevenuePeak ? (
                      <>
                        <p className="mt-2 text-lg font-semibold text-foreground">{monthlyRevenuePeak.month}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(monthlyRevenuePeak.revenue)} generated
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Revenue data will appear after your first paid order.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order leader</p>
                    {hasOrderData && monthlyOrdersPeak ? (
                      <>
                        <p className="mt-2 text-lg font-semibold text-foreground">{monthlyOrdersPeak.month}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(monthlyOrdersPeak.orderCount)} orders fulfilled
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Orders will populate once customers start checking out.
                      </p>
                    )}
                  </div>
                </div>
                <ul className="space-y-3">
                  {metrics.monthlyOrders.map((entry) => {
                    const metricValue = useRevenueForBars ? entry.revenue : entry.orderCount;
                    const widthPercent =
                      maxMonthlyValue > 0
                        ? Math.min(
                            100,
                            Math.max((metricValue / maxMonthlyValue) * 100, metricValue > 0 ? 8 : 0)
                          )
                        : 0;
                    const averageOrderValue = entry.orderCount ? entry.revenue / entry.orderCount : 0;

                    return (
                      <li key={entry.month} className="rounded-2xl border border-border/60 p-3">
                        <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                          <span>{entry.month}</span>
                          <span>{formatCurrency(entry.revenue)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatNumber(entry.orderCount)} orders</span>
                          <span>Avg {formatCurrency(averageOrderValue)}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <EmptyChartState message="Monthly performance data will appear once your store starts receiving orders." />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Order status mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[260px]">
              {metrics.ordersByStatus.some((entry) => entry.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip<number, string>
                      formatter={(value) => {
                        const numericValue = Array.isArray(value)
                          ? Number(value[0] ?? 0)
                          : typeof value === "number"
                            ? value
                            : Number(value ?? 0);
                        return formatNumber(numericValue);
                      }}
                    />
                    <Legend verticalAlign="bottom" height={48} />
                    <Pie
                      data={metrics.ordersByStatus}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {metrics.ordersByStatus.map((entry, index) => (
                        <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="Status distribution updates as orders progress through fulfillment." />
              )}
            </div>
            <ul className="space-y-2">
              {metrics.ordersByStatus.map((entry, index) => (
                <li key={entry.status} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      aria-hidden
                    />
                    {entry.label}
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold text-foreground">
                      {formatNumber(entry.count)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatCurrency(entry.revenue)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Payment methods</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {hasPaymentData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.paymentMethods} margin={{ top: 8, right: 12, bottom: 8, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip<number, "Revenue">
                    formatter={(value) => {
                      const numericValue = Array.isArray(value)
                        ? Number(value[0] ?? 0)
                        : typeof value === "number"
                          ? value
                          : Number(value ?? 0);
                      return [formatCurrency(numericValue), "Revenue"] as const;
                    }}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill={chartColors[0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="Collect payments to track gateway performance over time." />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Transaction health</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {hasTransactionData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={transactionChartData}>
                  <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip<number, string>
                    formatter={(value) => {
                      const numericValue = Array.isArray(value)
                        ? Number(value[0] ?? 0)
                        : typeof value === "number"
                          ? value
                          : Number(value ?? 0);
                      return formatNumber(numericValue);
                    }}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Transactions"
                    stroke={chartColors[2]}
                    fill={chartColors[2]}
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="Payment activity will surface once transactions are recorded." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {metrics.recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{getOrderStatusLabel(order.status)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Orders will appear here once customers start purchasing.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40 px-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
