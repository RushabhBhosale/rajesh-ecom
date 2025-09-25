import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { listTransactions } from "@/lib/transactions";

export async function GET() {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const transactions = await listTransactions();
    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error("List transactions failed", error);
    return NextResponse.json({ error: "Unable to load transactions" }, { status: 500 });
  }
}
