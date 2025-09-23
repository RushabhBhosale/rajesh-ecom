import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listCategories } from "@/lib/categories";
import { categoryPayloadSchema } from "@/lib/category-validation";
import { CategoryModel } from "@/models/category";

export async function GET() {
  try {
    const categories = await listCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to list categories", error);
    return NextResponse.json({ error: "Unable to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = categoryPayloadSchema.parse(await request.json());

    await connectDB();
    const existing = await CategoryModel.findOne({ name: payload.name }).lean();
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    await CategoryModel.create({
      name: payload.name,
      description: payload.description ?? "",
    });

    return NextResponse.json({ message: "Category created" }, { status: 201 });
  } catch (error) {
    console.error("Create category failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create category" }, { status: 500 });
  }
}
