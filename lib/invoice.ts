import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import { brandName } from "@/utils/variable";
import type { OrderSummary } from "@/lib/orders";

interface BuildInvoiceNumberInput {
  orderId: string;
  issuedAt?: Date | string | number | null;
}

interface ResolveInvoiceDetailsInput extends BuildInvoiceNumberInput {
  invoiceNumber?: string | null;
  invoiceIssuedAt?: Date | string | number | null;
}

function normalizeDate(value?: Date | string | number | null) {
  if (!value) {
    return new Date();
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function buildInvoiceNumber({ orderId, issuedAt }: BuildInvoiceNumberInput) {
  const date = normalizeDate(issuedAt);
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const suffix = orderId.slice(-8).toUpperCase();
  return `INV-${datePart}-${suffix}`;
}

export function resolveInvoiceDetails({
  orderId,
  issuedAt,
  invoiceNumber,
  invoiceIssuedAt,
}: ResolveInvoiceDetailsInput) {
  const resolvedIssuedAt = normalizeDate(invoiceIssuedAt ?? issuedAt);
  const resolvedInvoiceNumber =
    typeof invoiceNumber === "string" && invoiceNumber.trim().length > 0
      ? invoiceNumber.trim().toUpperCase()
      : buildInvoiceNumber({ orderId, issuedAt: resolvedIssuedAt });

  return {
    invoiceNumber: resolvedInvoiceNumber,
    invoiceIssuedAt: resolvedIssuedAt,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function renderInvoiceHtml(order: OrderSummary) {
  const statusLabel = getOrderStatusLabel(order.status);
  const itemsMarkup = order.items
    .map((item) => {
      const metadata = [item.variant, item.color ? `Colour: ${item.color}` : null]
        .filter(Boolean)
        .join(" | ");
      return `
        <tr>
          <td>
            <div style="font-weight: 600;">${escapeHtml(item.name)}</div>
            ${metadata ? `<div style="font-size: 12px; color: #475569;">${escapeHtml(metadata)}</div>` : ""}
          </td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.price)}</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(item.total)}</td>
        </tr>
      `;
    })
    .join("");

  const addressLines = [
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`,
    order.shippingAddress.country,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${escapeHtml(order.invoiceNumber)} | ${escapeHtml(brandName)}</title>
  </head>
  <body style="margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif;">
    <main style="max-width: 860px; margin: 0 auto; padding: 24px;">
      <section style="background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px;">
        <header style="display: flex; justify-content: space-between; gap: 16px; align-items: flex-start;">
          <div>
            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: #64748b;">${escapeHtml(brandName)}</p>
            <h1 style="margin: 10px 0 0 0; font-size: 28px;">Tax Invoice</h1>
          </div>
          <div style="text-align: right; font-size: 13px; color: #334155;">
            <p style="margin: 0;"><strong>Invoice:</strong> ${escapeHtml(order.invoiceNumber)}</p>
            <p style="margin: 6px 0 0 0;"><strong>Issued:</strong> ${formatDateTime(order.invoiceIssuedAt)}</p>
            <p style="margin: 6px 0 0 0;"><strong>Order:</strong> #${escapeHtml(order.orderNumber)}</p>
            <p style="margin: 6px 0 0 0;"><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
          </div>
        </header>

        <section style="margin-top: 20px; display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Bill To</p>
            <p style="margin: 8px 0 0 0; font-weight: 700;">${escapeHtml(order.customerName)}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">${escapeHtml(order.customerEmail)}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">${escapeHtml(order.customerPhone)}</p>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Ship To</p>
            <p style="margin: 8px 0 0 0; white-space: pre-line; font-size: 13px; line-height: 1.5; color: #334155;">${escapeHtml(addressLines.join("\n"))}</p>
          </div>
        </section>

        <section style="margin-top: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr>
                <th style="text-align: left; border-bottom: 1px solid #cbd5e1; padding: 10px 8px;">Item</th>
                <th style="text-align: center; border-bottom: 1px solid #cbd5e1; padding: 10px 8px; width: 72px;">Qty</th>
                <th style="text-align: right; border-bottom: 1px solid #cbd5e1; padding: 10px 8px; width: 132px;">Unit Price</th>
                <th style="text-align: right; border-bottom: 1px solid #cbd5e1; padding: 10px 8px; width: 132px;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsMarkup}
            </tbody>
          </table>
        </section>

        <section style="margin-top: 20px; margin-left: auto; max-width: 320px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #334155; padding: 4px 0;">
            <span>Subtotal</span>
            <span>${formatCurrency(order.subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #334155; padding: 4px 0;">
            <span>Tax</span>
            <span>${formatCurrency(order.tax)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #334155; padding: 4px 0;">
            <span>Shipping</span>
            <span>${order.shipping > 0 ? formatCurrency(order.shipping) : "Complimentary"}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 700;">
            <span>Total</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </section>

        <footer style="margin-top: 24px; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">Payment method: ${escapeHtml(order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay")}</p>
          <p style="margin: 6px 0 0 0;">Payment status: ${escapeHtml(order.paymentStatus)}</p>
        </footer>
      </section>
    </main>
  </body>
</html>`;
}
