import nodemailer from "nodemailer";

import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";
import type { OrderSummary } from "@/lib/orders";
import { brandName } from "@/utils/variable";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM;

let cachedTransporter: nodemailer.Transporter | null = null;

function isEmailConfigured() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_FROM && (SMTP_USER === undefined || SMTP_PASS));
}

function getTransporter() {
  if (!isEmailConfigured()) {
    throw new Error("SMTP credentials are not fully configured.");
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth:
        SMTP_USER && SMTP_PASS
          ? {
              user: SMTP_USER,
              pass: SMTP_PASS,
            }
          : undefined,
    });
  }

  return cachedTransporter;
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  color?: string | null;
  variant?: string | null;
}

export interface OrderEmailPayload {
  to: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceIssuedAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  items: OrderEmailItem[];
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface OrderStatusUpdateEmailPayload extends OrderEmailPayload {
  previousStatus?: string | null;
  statusNote?: string | null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeAddressLine(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLabel(value: string) {
  if (!value) {
    return "";
  }
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatPaymentMethod(method: string) {
  if (method === "cod") {
    return "Cash on delivery";
  }
  if (method === "razorpay") {
    return "Razorpay";
  }
  return normalizeLabel(method) || method;
}

function formatPaymentStatus(status: string) {
  return normalizeLabel(status) || status;
}

function formatInvoiceDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusNarrative(status: string) {
  switch (status) {
    case "placed":
      return "Your order has been placed and is waiting for processing.";
    case "processing":
      return "Your order is now being prepared by our operations team.";
    case "dispatched":
      return "Your order has been dispatched and is on the way.";
    case "delivered":
      return "Your order has been delivered successfully.";
    case "cancelled":
      return "This order has been cancelled.";
    case "returned":
      return "Your return request has been received.";
    default:
      return "There is a new update on your order.";
  }
}

function renderAddress(address: OrderEmailPayload["shippingAddress"]) {
  const parts = [normalizeAddressLine(address.line1)];
  const line2 = normalizeAddressLine(address.line2);
  if (line2) {
    parts.push(line2);
  }
  parts.push(`${address.city}, ${address.state} ${address.postalCode}`);
  parts.push(address.country);
  return parts.filter(Boolean).join("\n");
}

function renderItems(items: OrderEmailItem[]) {
  return items
    .map(
      (item) =>
        `${item.name}${
          item.variant || item.color
            ? ` (${[item.variant, item.color].filter(Boolean).join(" · ")})`
            : ""
        } (x${item.quantity}) — ${formatCurrency(item.total)}`
    )
    .join("\n");
}

function renderItemsHtml(items: OrderEmailItem[]) {
  return items
    .map((item) => {
      const variantAndColor = [item.variant, item.color].filter(Boolean).join(" · ");
      return `<li><strong>${escapeHtml(item.name)}</strong>${
        variantAndColor ? ` (${escapeHtml(variantAndColor)})` : ""
      } (x${item.quantity}) — ${formatCurrency(item.total)}</li>`;
    })
    .join("");
}

function buildOrderSummaryText(payload: OrderEmailPayload) {
  return [
    `Invoice: ${payload.invoiceNumber} (${formatInvoiceDate(payload.invoiceIssuedAt)})`,
    `Order reference: #${payload.orderNumber}`,
    `Status: ${getOrderStatusLabel(payload.status)}`,
    `Payment: ${formatPaymentMethod(payload.paymentMethod)} (${formatPaymentStatus(payload.paymentStatus)})`,
    "",
    "Order details:",
    `Subtotal: ${formatCurrency(payload.subtotal)}`,
    `Tax: ${formatCurrency(payload.tax)}`,
    `Shipping: ${payload.shipping > 0 ? formatCurrency(payload.shipping) : "Complimentary"}`,
    `Total: ${formatCurrency(payload.total)}`,
    "",
    `Items:\n${renderItems(payload.items)}`,
    "",
    `Shipping to:\n${renderAddress(payload.shippingAddress)}`,
  ].join("\n");
}

function buildOrderSummaryHtml(payload: OrderEmailPayload) {
  return `
    <p>
      <strong>Invoice:</strong> ${escapeHtml(payload.invoiceNumber)} (${escapeHtml(
        formatInvoiceDate(payload.invoiceIssuedAt)
      )})<br />
      <strong>Order reference:</strong> #${escapeHtml(payload.orderNumber)}<br />
      <strong>Status:</strong> ${escapeHtml(getOrderStatusLabel(payload.status))}<br />
      <strong>Payment:</strong> ${escapeHtml(formatPaymentMethod(payload.paymentMethod))} (${escapeHtml(
        formatPaymentStatus(payload.paymentStatus)
      )})
    </p>
    <h3 style="margin-bottom: 0.5rem;">Order details</h3>
    <p>
      <strong>Subtotal:</strong> ${formatCurrency(payload.subtotal)}<br />
      <strong>Tax:</strong> ${formatCurrency(payload.tax)}<br />
      <strong>Shipping:</strong> ${
        payload.shipping > 0 ? formatCurrency(payload.shipping) : "Complimentary"
      }<br />
      <strong>Total:</strong> ${formatCurrency(payload.total)}
    </p>
    <h3 style="margin-bottom: 0.5rem;">Items</h3>
    <ul style="padding-left: 1.2rem;">
      ${renderItemsHtml(payload.items)}
    </ul>
    <h3 style="margin-bottom: 0.5rem;">Shipping to</h3>
    <p style="white-space: pre-line;">${escapeHtml(renderAddress(payload.shippingAddress))}</p>
  `;
}

async function sendEmail({
  to,
  subject,
  textBody,
  htmlBody,
}: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}) {
  if (!isEmailConfigured()) {
    console.warn("Email not sent: SMTP credentials are not configured.");
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

export function createOrderEmailPayload(order: OrderSummary): OrderEmailPayload {
  return {
    to: order.customerEmail,
    customerName: order.customerName,
    orderId: order.id,
    orderNumber: order.orderNumber,
    invoiceNumber: order.invoiceNumber,
    invoiceIssuedAt: order.invoiceIssuedAt,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      color: item.color,
      variant: item.variant,
    })),
    shippingAddress: {
      line1: order.shippingAddress.line1,
      line2: order.shippingAddress.line2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
    },
  };
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  const subject = `Order placed · #${payload.orderNumber} · ${brandName}`;
  const textBody = `Hi ${payload.customerName},\n\nThank you for your order. We have received it successfully.\n\n${buildOrderSummaryText(payload)}\n\nWe will keep you updated at every order step.\n\nRegards,\n${brandName}`;
  const htmlBody = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #0f172a;">
    <p>Hi ${escapeHtml(payload.customerName)},</p>
    <p>Thank you for your order. We have received it successfully.</p>
    ${buildOrderSummaryHtml(payload)}
    <p>We will keep you updated at every order step.</p>
    <p style="margin-top: 2rem;">Regards,<br />${escapeHtml(brandName)}</p>
  </body>
</html>`;

  await sendEmail({
    to: payload.to,
    subject,
    textBody,
    htmlBody,
  });
}

export async function sendOrderStatusUpdateEmail(payload: OrderStatusUpdateEmailPayload) {
  const statusLabel = getOrderStatusLabel(payload.status);
  const previousStatusLabel = payload.previousStatus
    ? getOrderStatusLabel(payload.previousStatus)
    : null;
  const statusNote = payload.statusNote?.trim() ?? "";

  const subject = `Order update (${statusLabel}) · #${payload.orderNumber} · ${brandName}`;

  const previousStatusText =
    previousStatusLabel && previousStatusLabel !== statusLabel
      ? `Previous status: ${previousStatusLabel}\n`
      : "";
  const statusNoteText = statusNote ? `Update note: ${statusNote}\n` : "";

  const textBody = `Hi ${payload.customerName},\n\n${getStatusNarrative(
    payload.status
  )}\n\n${previousStatusText}${statusNoteText}${buildOrderSummaryText(payload)}\n\nRegards,\n${brandName}`;

  const previousStatusHtml =
    previousStatusLabel && previousStatusLabel !== statusLabel
      ? `<p><strong>Previous status:</strong> ${escapeHtml(previousStatusLabel)}</p>`
      : "";
  const statusNoteHtml = statusNote
    ? `<p><strong>Update note:</strong> ${escapeHtml(statusNote)}</p>`
    : "";

  const htmlBody = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #0f172a;">
    <p>Hi ${escapeHtml(payload.customerName)},</p>
    <p>${escapeHtml(getStatusNarrative(payload.status))}</p>
    ${previousStatusHtml}
    ${statusNoteHtml}
    ${buildOrderSummaryHtml(payload)}
    <p style="margin-top: 2rem;">Regards,<br />${escapeHtml(brandName)}</p>
  </body>
</html>`;

  await sendEmail({
    to: payload.to,
    subject,
    textBody,
    htmlBody,
  });
}
