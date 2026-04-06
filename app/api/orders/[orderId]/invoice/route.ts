import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { renderInvoiceHtml } from "@/lib/invoice";
import { getOrderById, getOrderForUser } from "@/lib/orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const order =
      actor.role === "admin" || actor.role === "superadmin"
        ? await getOrderById(orderId)
        : await getOrderForUser(orderId, actor.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const html = renderInvoiceHtml(order);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="invoice-${order.invoiceNumber}.html"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Invoice generation failed", error);
    return NextResponse.json({ error: "Unable to generate invoice" }, { status: 500 });
  }
}
