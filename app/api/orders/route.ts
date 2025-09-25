import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { listOrders } from "@/lib/orders";

export async function GET() {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await listOrders();
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("List orders failed", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}
