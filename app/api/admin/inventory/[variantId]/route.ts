import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VariantModel } from "@/models/variant";

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function ensureAdmin() {
  const actor = await getCurrentUser();
  if (!actor) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  if (actor.role !== "admin" && actor.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { actor } as const;
}

export async function PATCH(request: Request, context: { params: { variantId: string } }) {
  const { variantId } = context.params;

  if (!isValidId(variantId)) {
    return NextResponse.json({ error: "Invalid variant id" }, { status: 400 });
  }

  const auth = await ensureAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const payload = (await request.json().catch(() => null)) as { stock?: unknown; inStock?: unknown } | null;
  const stockValue = Number((payload as any)?.stock);

  if (!Number.isFinite(stockValue) || stockValue < 0) {
    return NextResponse.json({ error: "Stock must be a non-negative number" }, { status: 400 });
  }

  const explicitInStock =
    typeof (payload as any)?.inStock === "boolean" ? ((payload as any).inStock as boolean) : undefined;
  const normalizedStock = Math.max(0, Math.floor(stockValue));
  const normalizedInStock = normalizedStock > 0 ? explicitInStock ?? true : false;

  await connectDB();
  const variant = await VariantModel.findById(variantId);

  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  variant.stock = normalizedStock;
  variant.inStock = normalizedInStock;
  await variant.save();

  return NextResponse.json({
    variant: {
      id: variant._id.toString(),
      stock: variant.stock,
      inStock: variant.inStock,
    },
  });
}
