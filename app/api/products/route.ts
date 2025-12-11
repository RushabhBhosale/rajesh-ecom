import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  resolveProductMasters,
  type ProductMasterSelection,
} from "@/lib/master-options";
import { productPayloadSchema } from "@/lib/product-validation";
import { listProducts } from "@/lib/products";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { resolveProductSubMasters } from "@/lib/submaster-options";
import {
  replaceProductVariants,
  type VariantInput,
  VariantValidationError,
} from "@/lib/product-variants";
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

function buildVariantInputs(
  payload: ReturnType<typeof productPayloadSchema.parse>,
  colors: string[],
  masterSelection: ProductMasterSelection
): VariantInput[] {
  const labelParts = [
    masterSelection.processor?.name,
    masterSelection.ram?.name,
    masterSelection.storage?.name,
    masterSelection.graphics?.name,
  ].filter(Boolean);

  const baseVariant: VariantInput = {
    label: labelParts.length > 0 ? labelParts.join(" • ") : "Base configuration",
    price: payload.price,
    processorId: payload.processorId,
    ramId: payload.ramId,
    storageId: payload.storageId,
    graphicsId: payload.graphicsId,
    color: colors.length === 1 ? colors[0] : undefined,
    isDefault: true,
  };

  const additionalVariants: VariantInput[] = (payload.variants ?? []).map((variant) => ({
    label: variant.label,
    price: variant.price,
    processorId: variant.processorId,
    ramId: variant.ramId,
    storageId: variant.storageId,
    graphicsId: variant.graphicsId,
    color: variant.color,
    isDefault: false,
  }));

  return [baseVariant, ...additionalVariants];
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

    const subMasterResult = await resolveProductSubMasters(
      {
        companySubMasterId: payload.companySubMasterId,
        processorSubMasterId: payload.processorSubMasterId,
        ramSubMasterId: payload.ramSubMasterId,
        storageSubMasterId: payload.storageSubMasterId,
        graphicsSubMasterId: payload.graphicsSubMasterId,
        osSubMasterId: payload.osSubMasterId,
      },
      masterResult.selection
    );

    if (!subMasterResult.ok) {
      return NextResponse.json({ error: subMasterResult.message }, { status: 400 });
    }

    const variantInputs = buildVariantInputs(payload, colors, masterResult.selection);

    await connectDB();
    const product = await ProductModel.create({
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
      companySubmasterId: subMasterResult.selection.companySubMaster?.id ?? null,
      companySubmasterName: subMasterResult.selection.companySubMaster?.name ?? "",
      processorSubmasterId: subMasterResult.selection.processorSubMaster?.id ?? null,
      processorSubmasterName: subMasterResult.selection.processorSubMaster?.name ?? "",
      ramSubmasterId: subMasterResult.selection.ramSubMaster?.id ?? null,
      ramSubmasterName: subMasterResult.selection.ramSubMaster?.name ?? "",
      storageSubmasterId: subMasterResult.selection.storageSubMaster?.id ?? null,
      storageSubmasterName: subMasterResult.selection.storageSubMaster?.name ?? "",
      graphicsSubmasterId: subMasterResult.selection.graphicsSubMaster?.id ?? null,
      graphicsSubmasterName: subMasterResult.selection.graphicsSubMaster?.name ?? "",
      osSubmasterId: subMasterResult.selection.osSubMaster?.id ?? null,
      osSubmasterName: subMasterResult.selection.osSubMaster?.name ?? "",
      imageUrl: payload.imageUrl ?? "",
      galleryImages,
      richDescription,
      featured: payload.featured ?? false,
      inStock: payload.inStock ?? true,
      highlights,
      variants: [],
      colors,
    });

    try {
      await replaceProductVariants(product._id.toString(), variantInputs);
    } catch (error) {
      await ProductModel.findByIdAndDelete(product._id).catch(() => null);
      if (error instanceof VariantValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ message: "Product created" }, { status: 201 });
  } catch (error) {
    console.error("Create product failed", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create product" }, { status: 500 });
  }
}
