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
import { listProducts } from "@/lib/products";
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
  baseSku: string,
  productName: string
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

  const baseProcessorSubmaster = getMatchingSubmaster(
    payload.processorId,
    subMasterSelection.processorSubMaster
  );
  const baseRamSubmaster = getMatchingSubmaster(payload.ramId, subMasterSelection.ramSubMaster);
  const baseStorageSubmaster = getMatchingSubmaster(payload.storageId, subMasterSelection.storageSubMaster);
  const baseGraphicsSubmaster = getMatchingSubmaster(
    payload.graphicsId,
    subMasterSelection.graphicsSubMaster
  );
  const baseOsSubmaster = getMatchingSubmaster(payload.osId, subMasterSelection.osSubMaster);

  const labelParts = [
    subMasterSelection.companySubMaster?.name,
    masterSelection.processor?.name,
    subMasterSelection.processorSubMaster?.name,
    masterSelection.ram?.name,
    subMasterSelection.ramSubMaster?.name,
    masterSelection.storage?.name,
    subMasterSelection.storageSubMaster?.name,
    masterSelection.graphics?.name,
    subMasterSelection.graphicsSubMaster?.name,
    masterSelection.os?.name,
    subMasterSelection.osSubMaster?.name,
  ].filter(Boolean);
  const baseVariantLabel =
    productName.trim() ||
    (labelParts.length > 0 ? labelParts.join(" • ") : "Base configuration");
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

  const baseOriginalPrice = Number.isFinite(payload.originalPrice)
    ? Math.max(0, Number(payload.originalPrice))
    : payload.price;
  const baseDiscountedPriceRaw = Number.isFinite(payload.discountedPrice)
    ? Math.max(0, Number(payload.discountedPrice))
    : undefined;
  const baseDiscountedPrice =
    typeof baseDiscountedPriceRaw === "number" && baseDiscountedPriceRaw > 0
      ? baseDiscountedPriceRaw
      : baseOriginalPrice;
  const baseOnSale =
    Boolean(payload.onSale) &&
    typeof baseDiscountedPrice === "number" &&
    baseDiscountedPrice < baseOriginalPrice;
  const basePrice = baseOnSale && typeof baseDiscountedPrice === "number" ? baseDiscountedPrice : payload.price;

  const baseVariant: VariantInput = {
    label: baseVariantLabel,
    price: basePrice,
    originalPrice: baseOriginalPrice,
    discountedPrice: baseDiscountedPrice,
    onSale: baseOnSale,
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
    const variantOriginalPrice = Number.isFinite(variant.originalPrice)
      ? Math.max(0, Number(variant.originalPrice))
      : baseOriginalPrice;
    const variantDiscountedPriceRaw = Number.isFinite(variant.discountedPrice)
      ? Math.max(0, Number(variant.discountedPrice))
      : undefined;
    const variantDiscountedPrice =
      typeof variantDiscountedPriceRaw === "number" && variantDiscountedPriceRaw > 0
        ? variantDiscountedPriceRaw
        : variantOriginalPrice;
    const variantOnSale =
      Boolean(variant.onSale) &&
      typeof variantDiscountedPrice === "number" &&
      variantDiscountedPrice < variantOriginalPrice;
    const variantPrice =
      variantOnSale && typeof variantDiscountedPrice === "number"
        ? variantDiscountedPrice
        : Number.isFinite(variant.price)
        ? variant.price
        : basePrice;

    return {
      label: variantLabel,
      price: variantPrice,
      originalPrice: variantOriginalPrice,
      discountedPrice: variantDiscountedPrice,
      onSale: variantOnSale,
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const featuredOnly = url.searchParams.get("featured") === "true";
    const inStockOnly = url.searchParams.get("inStock") === "true";
    const searchParam = url.searchParams.get("search") ?? url.searchParams.get("q");
    const search = searchParam?.trim() || undefined;

    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const products = await listProducts({
      limit: Number.isNaN(limit) ? undefined : limit,
      featuredOnly,
      inStockOnly,
      search,
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

    const autoName = generateProductName(
      payload,
      masterResult.selection,
      subMasterResult.selection
    );
    const finalName =
      typeof payload.name === "string" && payload.name.trim().length >= 3
        ? payload.name.trim()
        : autoName;
    const baseSku = buildBaseSku(finalName);

    const variantInputs = buildVariantInputs(
      payload,
      colors,
      masterResult.selection,
      subMasterResult.selection,
      galleryImages,
      richDescription,
      highlights,
      baseSku,
      finalName
    );

    await connectDB();
    const product = await ProductModel.create({
      name: finalName,
      category: payload.category,
      companyId: masterResult.selection.company?.id ?? null,
      companySubmasterId: subMasterResult.selection.companySubMaster?.id ?? null,
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

    const message = error instanceof Error ? error.message : "Unable to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
