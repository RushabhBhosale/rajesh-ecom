import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { categoryPayloadSchema } from "@/lib/category-validation";
import { CategoryModel } from "@/models/category";

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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    const auth = await ensureAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const payload = categoryPayloadSchema.parse(await request.json());

    await connectDB();

    const duplicate = await CategoryModel.findOne({
      _id: { $ne: id },
      name: payload.name,
    }).lean();
    if (duplicate) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const updated = await CategoryModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: payload.name,
          description: payload.description ?? "",
        },
      },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category updated" });
  } catch (error) {
    console.error("Update category failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update category" }, { status: 500 });
  }
}
