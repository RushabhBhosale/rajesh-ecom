import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { productPayloadSchema } from "@/lib/product-validation";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { ProductModel } from "@/models/product";

function sanitizeHighlights(highlights: string[] | undefined) {
  return Array.isArray(highlights)
    ? highlights.map((item) => item.trim()).filter((item) => item.length > 0)
    : [];
}

function sanitizeGallery(images: string[] | undefined) {
  if (!Array.isArray(images)) {
    return [];
  }
  const seen = new Set<string>();
  return images
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
}

function sanitizeColors(colors: string[] | undefined) {
  if (!Array.isArray(colors)) {
    return [];
  }
  const seen = new Set<string>();
  return colors
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }
      if (seen.has(item.toLowerCase())) {
        return false;
      }
      seen.add(item.toLowerCase());
      return true;
    });
}

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

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { params } = context;
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const auth = await ensureAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const payload = productPayloadSchema.parse(await request.json());
    const highlights = sanitizeHighlights(payload.highlights);
    const galleryImages = sanitizeGallery(payload.galleryImages);
    const richDescription = sanitizeRichText(payload.richDescription?.trim() ?? "");
    const colors = sanitizeColors(payload.colors);

    await connectDB();
    const updated = await ProductModel.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: payload.name,
          category: payload.category,
          description: payload.description,
          price: payload.price,
          condition: payload.condition,
          imageUrl: payload.imageUrl ?? "",
          galleryImages,
          richDescription,
          featured: payload.featured ?? false,
          inStock: payload.inStock ?? true,
          highlights,
          colors,
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product updated" });
  } catch (error) {
    console.error("Update product failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const { params } = context;
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const auth = await ensureAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    await connectDB();
    const deleted = await ProductModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product failed", error);
    return NextResponse.json({ error: "Unable to delete product" }, { status: 500 });
  }
}
