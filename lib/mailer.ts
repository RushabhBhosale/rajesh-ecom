import nodemailer from "nodemailer";

import { formatCurrency } from "@/lib/currency";
import { getOrderStatusLabel } from "@/lib/order-status";

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

interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  color?: string | null;
}

interface OrderEmailPayload {
  to: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
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

function renderAddress(address: OrderEmailPayload["shippingAddress"]) {
  const parts = [address.line1];
  if (address.line2) {
    parts.push(address.line2);
  }
  parts.push(`${address.city}, ${address.state} ${address.postalCode}`);
  parts.push(address.country);
  return parts.filter(Boolean).join("\n");
}

function renderItems(items: OrderEmailItem[]) {
  return items
    .map(
      (item) =>
        `${item.name}${item.color ? ` (${item.color})` : ""} (x${item.quantity}) — ${formatCurrency(item.total)}`
    )
    .join("\n");
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  if (!isEmailConfigured()) {
    console.warn("Email not sent: SMTP credentials are not configured.");
    return;
  }

  const transporter = getTransporter();
  const statusLabel = getOrderStatusLabel(payload.status);
  const subject = `Your Rajesh Renewed order #${payload.orderNumber}`;

  const textBody = `Hi ${payload.customerName},\n\nThank you for your order!\n\nOrder reference: #${payload.orderNumber}\nStatus: ${statusLabel}\nPayment: ${payload.paymentMethod} (${payload.paymentStatus})\nTotal: ${formatCurrency(payload.total)}\n\nItems:\n${renderItems(payload.items)}\n\nShipping to:\n${renderAddress(payload.shippingAddress)}\n\nOur operations team will be in touch with scheduling details.\n\nRegards,\nRajesh Renewed`;

  const htmlBody = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #0f172a;">
    <p>Hi ${payload.customerName},</p>
    <p>Thank you for your order!</p>
    <p>
      <strong>Order reference:</strong> #${payload.orderNumber}<br />
      <strong>Status:</strong> ${statusLabel}<br />
      <strong>Payment:</strong> ${payload.paymentMethod} (${payload.paymentStatus})<br />
      <strong>Total:</strong> ${formatCurrency(payload.total)}
    </p>
    <h3 style="margin-bottom: 0.5rem;">Items</h3>
    <ul style="padding-left: 1.2rem;">
      ${payload.items
        .map(
          (item) =>
            `<li><strong>${item.name}</strong>${item.color ? ` (${item.color})` : ""} (x${item.quantity}) — ${formatCurrency(item.total)}</li>`
        )
        .join("")}
    </ul>
    <h3 style="margin-bottom: 0.5rem;">Shipping to</h3>
    <p style="white-space: pre-line;">${renderAddress(payload.shippingAddress)}</p>
    <p>Our operations team will be in touch with scheduling details.</p>
    <p style="margin-top: 2rem;">Regards,<br />Rajesh Renewed</p>
  </body>
</html>`;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: payload.to,
    subject,
    text: textBody,
    html: htmlBody,
  });
}
