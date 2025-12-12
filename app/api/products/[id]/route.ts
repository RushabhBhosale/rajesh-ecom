import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  resolveProductMasters,
  type ProductMasterSelection,
} from "@/lib/master-options";
import { generateProductName } from "@/lib/product-name";
import { productPayloadSchema } from "@/lib/product-validation";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { resolveProductSubMasters, type ProductSubMasterSelection } from "@/lib/submaster-options";
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

function buildBaseSku(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function buildVariantSku({
  baseSku,
  companyName,
  category,
  variantLabel,
}: {
  baseSku: string;
  companyName?: string | null;
  category?: string;
  variantLabel?: string;
}) {
  const prefix = companyName?.trim() || category?.trim() || "";
  const label = variantLabel?.trim() ?? "";
  const combined = [prefix, label].filter(Boolean).join(" ");
  if (!combined) {
    return baseSku;
  }
  const generated = buildBaseSku(combined);
  return generated || baseSku;
}

function buildVariantInputs(
  payload: ReturnType<typeof productPayloadSchema.parse>,
  colors: string[],
  masterSelection: ProductMasterSelection,
  subMasterSelection: ProductSubMasterSelection,
  galleryImages: string[],
  richDescription: string,
  highlights: string[],
  baseSku: string
): VariantInput[] {
  const getMatchingSubmaster = (
    variantMasterId: string | undefined,
    selection: { id?: string; masterId?: string; name?: string } | undefined
  ) => {
    if (!variantMasterId || !selection?.id) {
      return { id: undefined, name: undefined };
    }
    return selection.masterId === variantMasterId ? { id: selection.id, name: selection.name } : { id: undefined, name: undefined };
  };

  const baseProcessorSubmaster = getMatchingSubmaster(payload.processorId, subMasterSelection.processorSubMaster);
  const baseRamSubmaster = getMatchingSubmaster(payload.ramId, subMasterSelection.ramSubMaster);
  const baseStorageSubmaster = getMatchingSubmaster(payload.storageId, subMasterSelection.storageSubMaster);
  const baseGraphicsSubmaster = getMatchingSubmaster(payload.graphicsId, subMasterSelection.graphicsSubMaster);
  const baseOsSubmaster = getMatchingSubmaster(payload.osId, subMasterSelection.osSubMaster);

  const labelParts = [
    masterSelection.processor?.name,
    masterSelection.ram?.name,
    masterSelection.storage?.name,
    masterSelection.graphics?.name,
  ].filter(Boolean);
  const baseVariantLabel =
    labelParts.length > 0 ? labelParts.join(" • ") : "Base configuration";
  const baseVariantSku =
    payload.sku?.trim() ||
    (labelParts.length > 0
      ? buildVariantSku({
          baseSku,
          companyName: masterSelection.company?.name,
          category: payload.category,
          variantLabel: baseVariantLabel,
        })
      : baseSku);

  const baseVariant: VariantInput = {
    label: baseVariantLabel,
    price: payload.price,
    description: payload.description,
    condition: payload.condition,
    sku: baseVariantSku,
    stock: payload.stock ?? 0,
    processorId: payload.processorId,
    processorSubmasterId: baseProcessorSubmaster.id,
    ramId: payload.ramId,
    ramSubmasterId: baseRamSubmaster.id,
    storageId: payload.storageId,
    storageSubmasterId: baseStorageSubmaster.id,
    graphicsId: payload.graphicsId,
    graphicsSubmasterId: baseGraphicsSubmaster.id,
    osId: payload.osId,
    osSubmasterId: baseOsSubmaster.id,
    imageUrl: payload.imageUrl ?? "",
    galleryImages,
    richDescription,
    highlights,
    featured: payload.featured ?? false,
    color: colors.length === 1 ? colors[0] : undefined,
    colors,
    inStock: payload.inStock ?? true,
    isDefault: true,
  };

  const additionalVariants: VariantInput[] = (payload.variants ?? []).map((variant) => {
    const processorSubmaster = getMatchingSubmaster(variant.processorId, subMasterSelection.processorSubMaster);
    const ramSubmaster = getMatchingSubmaster(variant.ramId, subMasterSelection.ramSubMaster);
    const storageSubmaster = getMatchingSubmaster(variant.storageId, subMasterSelection.storageSubMaster);
    const graphicsSubmaster = getMatchingSubmaster(variant.graphicsId, subMasterSelection.graphicsSubMaster);
    const variantGallery = sanitizeGallery(variant.galleryImages);
    const variantLabel = variant.label?.trim() ?? "";
    const variantColor = variant.color?.trim() || undefined;

    return {
      label: variantLabel,
      price: variant.price,
      description: variant.description?.trim() || payload.description,
      condition: variant.condition ?? payload.condition,
      sku:
        variant.sku?.trim() ||
        buildVariantSku({
          baseSku,
          companyName: masterSelection.company?.name,
          category: payload.category,
          variantLabel,
        }),
      stock: variant.stock ?? 0,
      processorId: variant.processorId,
      processorSubmasterId: processorSubmaster.id,
      ramId: variant.ramId,
      ramSubmasterId: ramSubmaster.id,
      storageId: variant.storageId,
      storageSubmasterId: storageSubmaster.id,
      graphicsId: variant.graphicsId,
      graphicsSubmasterId: graphicsSubmaster.id,
      osId: payload.osId,
      osSubmasterId: baseOsSubmaster.id,
      imageUrl: variant.imageUrl?.trim() || payload.imageUrl || "",
      galleryImages: variantGallery.length > 0 ? variantGallery : galleryImages,
      richDescription,
      highlights,
      featured: payload.featured ?? false,
      color: variantColor,
      colors,
      inStock: payload.inStock ?? true,
      isDefault: false,
    };
  });

  return [baseVariant, ...additionalVariants];
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
    if (colors.length > 1) {
      return NextResponse.json(
        { error: "Only one colour allowed. Add more colours as variants." },
        { status: 400 }
      );
    }

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

    const autoName = generateProductName(payload, masterResult.selection);
    const finalName =
      typeof payload.name === "string" && payload.name.trim().length >= 3
        ? payload.name.trim()
        : autoName;
    const baseSku = buildBaseSku(finalName);

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

    const variantInputs = buildVariantInputs(
      payload,
      colors,
      masterResult.selection,
      subMasterResult.selection,
      galleryImages,
      richDescription,
      highlights,
      baseSku
    );

    await connectDB();
    const exists = await ProductModel.exists({ _id: params.id });
    if (!exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    try {
      await replaceProductVariants(params.id, variantInputs);
    } catch (error) {
      if (error instanceof VariantValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const updated = await ProductModel.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: finalName,
          category: payload.category,
          companyId: masterResult.selection.company?.id ?? null,
          companySubmasterId: subMasterResult.selection.companySubMaster?.id ?? null,
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
