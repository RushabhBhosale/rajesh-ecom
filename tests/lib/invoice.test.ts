import { describe, expect, it } from "vitest";

import {
  buildInvoiceNumber,
  resolveInvoiceDetails,
  renderInvoiceHtml,
} from "@/lib/invoice";

describe("invoice utilities", () => {
  it("builds deterministic invoice numbers from order id and issue date", () => {
    const invoiceNumber = buildInvoiceNumber({
      orderId: "65f0a0bc1234abcd9876ef01",
      issuedAt: "2026-02-16T08:00:00.000Z",
    });

    expect(invoiceNumber).toBe("INV-20260216-9876EF01");
  });

  it("resolves invoice fields when persisted values are missing", () => {
    const resolved = resolveInvoiceDetails({
      orderId: "65f0a0bc1234abcd9876ef01",
      issuedAt: "2026-02-16T08:00:00.000Z",
      invoiceNumber: "",
      invoiceIssuedAt: null,
    });

    expect(resolved.invoiceNumber).toBe("INV-20260216-9876EF01");
    expect(resolved.invoiceIssuedAt.toISOString()).toBe("2026-02-16T08:00:00.000Z");
  });

  it("renders invoice html with invoice and order references", () => {
    const html = renderInvoiceHtml({
      id: "order-id",
      orderNumber: "ABC123",
      invoiceNumber: "INV-20260216-ABC12345",
      invoiceIssuedAt: "2026-02-16T08:00:00.000Z",
      customerName: "Rajesh",
      customerEmail: "rajesh@example.com",
      customerPhone: "9999999999",
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "placed",
      subtotal: 10000,
      tax: 1800,
      shipping: 200,
      total: 12000,
      currency: "INR",
      itemCount: 1,
      createdAt: "2026-02-16T08:00:00.000Z",
      updatedAt: "2026-02-16T08:00:00.000Z",
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpaySignature: null,
      shippingAddress: {
        line1: "123 Main Street",
        line2: "",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      },
      items: [
        {
          productId: "prod-1",
          name: "Laptop",
          price: 10000,
          quantity: 1,
          total: 10000,
          imageUrl: null,
          category: "Laptops",
          condition: "refurbished",
          color: "Silver",
          variant: "16GB RAM",
        },
      ],
    });

    expect(html).toContain("INV-20260216-ABC12345");
    expect(html).toContain("#ABC123");
    expect(html).toContain("Laptop");
  });
});
