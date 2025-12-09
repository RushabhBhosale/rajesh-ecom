import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveProductMasters } from "@/lib/master-options";
import { productPayloadSchema } from "@/lib/product-validation";
import { listProducts } from "@/lib/products";
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

function sanitizeVariants(
  variants: { label: string; price: number }[] | undefined
) {
  if (!Array.isArray(variants)) {
    return [];
  }
  const seen = new Set<string>();
  return variants
    .map((variant) => ({
      label: typeof variant.label === "string" ? variant.label.trim() : "",
      price: Number.isFinite(Number((variant as any)?.price))
        ? Number((variant as any)?.price)
        : Number.NaN,
    }))
    .filter((variant) => {
      if (!variant.label || Number.isNaN(variant.price) || variant.price < 0) {
        return false;
      }
      const key = variant.label.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const featuredOnly = url.searchParams.get("featured") === "true";
    const inStockOnly = url.searchParams.get("inStock") === "true";

    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const products = await listProducts({
      limit: Number.isNaN(limit) ? undefined : limit,
      featuredOnly,
      inStockOnly,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to list products", error);
    return NextResponse.json({ error: "Unable to load products" }, { status: 500 });
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

    const payload = productPayloadSchema.parse(await request.json());
    const highlights = sanitizeHighlights(payload.highlights);
    const galleryImages = sanitizeGallery(payload.galleryImages);
    const richDescription = sanitizeRichText(payload.richDescription?.trim() ?? "");
    const colors = sanitizeColors(payload.colors);
    const variants = sanitizeVariants(payload.variants);

    const masterResult = await resolveProductMasters({
      companyId: payload.companyId,
      processorId: payload.processorId,
      ramId: payload.ramId,
      storageId: payload.storageId,
      graphicsId: payload.graphicsId,
      osId: payload.osId,
    });

    if (!masterResult.ok) {
      return NextResponse.json({ error: masterResult.message }, { status: 400 });
    }

    await connectDB();
    await ProductModel.create({
      name: payload.name,
      category: payload.category,
      description: payload.description,
      price: payload.price,
      condition: payload.condition,
      companyId: masterResult.selection.company?.id ?? null,
      companyName: masterResult.selection.company?.name ?? "",
      processorId: masterResult.selection.processor?.id ?? null,
      processorName: masterResult.selection.processor?.name ?? "",
      ramId: masterResult.selection.ram?.id ?? null,
      ramName: masterResult.selection.ram?.name ?? "",
      storageId: masterResult.selection.storage?.id ?? null,
      storageName: masterResult.selection.storage?.name ?? "",
      graphicsId: masterResult.selection.graphics?.id ?? null,
      graphicsName: masterResult.selection.graphics?.name ?? "",
      osId: masterResult.selection.os?.id ?? null,
      osName: masterResult.selection.os?.name ?? "",
      imageUrl: payload.imageUrl ?? "",
      galleryImages,
      richDescription,
      featured: payload.featured ?? false,
      inStock: payload.inStock ?? true,
      highlights,
      variants,
      colors,
    });

    return NextResponse.json({ message: "Product created" }, { status: 201 });
  } catch (error) {
    console.error("Create product failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create product" }, { status: 500 });
  }
}
