import mongoose from "mongoose";

import { masterTypeLabels, type MasterOptionType } from "@/lib/master-constants";
import { productConditions, type ProductCondition } from "@/lib/product-constants";
import { MasterOptionModel, type MasterOptionDocument } from "@/models/master-option";
import { VariantModel, type VariantDocument } from "@/models/variant";

export interface VariantInput {
  label: string;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  onSale?: boolean;
  description: string;
  condition: ProductCondition;
  sku?: string;
  stock?: number;
  processorId?: string;
  processorSubmasterId?: string;
  ramId?: string;
  ramSubmasterId?: string;
  storageId?: string;
  storageSubmasterId?: string;
  graphicsId?: string;
  graphicsSubmasterId?: string;
  osId?: string;
  osSubmasterId?: string;
  imageUrl?: string;
  galleryImages?: string[];
  richDescription?: string;
  highlights?: string[];
  colors?: string[];
  featured?: boolean;
  inStock?: boolean;
  color?: string;
  isDefault?: boolean;
}

type VariantMasterField =
  | "processorId"
  | "ramId"
  | "storageId"
  | "graphicsId"
  | "osId";

const variantMasterToType: Record<VariantMasterField, MasterOptionType> = {
  processorId: "processor",
  ramId: "ram",
  storageId: "storage",
  graphicsId: "graphics",
  osId: "os",
};

export class VariantValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VariantValidationError";
  }
}

function normalizeVariantInput(variant: VariantInput): VariantInput {
  const price = Number.isFinite(variant.price) ? Math.max(0, variant.price) : 0;
  const originalPrice = Number.isFinite(variant.originalPrice)
    ? Math.max(0, Number(variant.originalPrice))
    : price;
  const discountedPrice = Number.isFinite(variant.discountedPrice)
    ? Math.max(0, Number(variant.discountedPrice))
    : undefined;
  const onSale =
    Boolean(variant.onSale) &&
    typeof discountedPrice === "number" &&
    discountedPrice < originalPrice;
  const effectivePrice = onSale && typeof discountedPrice === "number" ? discountedPrice : price;
  const stockValue = Number.isFinite(Number(variant.stock)) ? Math.max(0, Number(variant.stock)) : 1;
  const normalizedCondition = productConditions.includes(variant.condition)
    ? variant.condition
    : "refurbished";
  return {
    label: variant.label.trim(),
    price: effectivePrice,
    originalPrice,
    discountedPrice,
    onSale,
    description: variant.description?.trim() ?? "",
    condition: normalizedCondition,
    sku: variant.sku?.trim() || "",
    stock: stockValue,
    processorId: variant.processorId || undefined,
    processorSubmasterId: variant.processorSubmasterId || undefined,
    ramId: variant.ramId || undefined,
    ramSubmasterId: variant.ramSubmasterId || undefined,
    storageId: variant.storageId || undefined,
    storageSubmasterId: variant.storageSubmasterId || undefined,
    graphicsId: variant.graphicsId || undefined,
    graphicsSubmasterId: variant.graphicsSubmasterId || undefined,
    osId: variant.osId || undefined,
    osSubmasterId: variant.osSubmasterId || undefined,
    imageUrl: variant.imageUrl?.trim() || "",
    galleryImages: Array.isArray(variant.galleryImages)
      ? variant.galleryImages.map((item) => item.trim()).filter((item) => item.length > 0)
      : [],
    richDescription: variant.richDescription?.trim?.() ?? "",
    highlights: Array.isArray(variant.highlights)
      ? variant.highlights.map((item) => item.trim()).filter((item) => item.length > 0)
      : [],
    colors: Array.isArray(variant.colors)
      ? variant.colors
          .map((item) => item.trim())
          .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index)
      : [],
    featured: Boolean(variant.featured),
    inStock: typeof variant.inStock === "boolean" ? variant.inStock : stockValue > 0,
    color: variant.color?.trim() || undefined,
    isDefault: Boolean(variant.isDefault),
  };
}

async function resolveVariantMasters(
  variants: VariantInput[],
  variantLabelLookup: Map<string, string>
) {
  const ids = new Set<string>();
  variants.forEach((variant) => {
    (Object.keys(variantMasterToType) as VariantMasterField[]).forEach((field) => {
      const value = variant[field];
      if (value) {
        ids.add(value);
      }
    });
  });

  if (ids.size === 0) {
    return new Map<string, MasterOptionDocument>();
  }

  const options = await MasterOptionModel.find({ _id: { $in: Array.from(ids) } })
    .select({ name: 1, type: 1 })
    .lean<MasterOptionDocument[]>();

  const lookup = new Map<string, MasterOptionDocument>();
  options.forEach((option) => {
    lookup.set(option._id.toString(), option);
  });

  (Object.keys(variantMasterToType) as VariantMasterField[]).forEach((field) => {
    const expectedType = variantMasterToType[field];
    variants.forEach((variant) => {
      const value = variant[field];
      if (!value) {
        return;
      }
      const option = lookup.get(value);
      const label = variantLabelLookup.get(variant.label.toLowerCase()) ?? variant.label;
      if (!option) {
        throw new VariantValidationError(
          `${masterTypeLabels[expectedType]} not found for variant "${label}"`
        );
      }
      if (option.type !== expectedType) {
        throw new VariantValidationError(
          `Variant "${label}" must use a ${masterTypeLabels[expectedType]} option`
        );
      }
    });
  });

  return lookup;
}

function mapVariantDocument(doc: VariantDocument): VariantDocument {
  return {
    ...doc,
    sku: doc.sku ?? "",
    originalPrice: Number.isFinite(Number((doc as any).originalPrice))
      ? Math.max(0, Number((doc as any).originalPrice))
      : doc.price ?? 0,
    discountedPrice: Number.isFinite(Number((doc as any).discountedPrice))
      ? Math.max(0, Number((doc as any).discountedPrice))
      : doc.price ?? 0,
    onSale: Boolean((doc as any).onSale),
    imageUrl: doc.imageUrl ?? "",
    galleryImages: Array.isArray(doc.galleryImages) ? doc.galleryImages : [],
    richDescription: doc.richDescription ?? "",
    highlights: Array.isArray(doc.highlights) ? doc.highlights : [],
    colors: Array.isArray((doc as any).colors)
      ? (doc as any).colors
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter((item: string, index: number, arr: string[]) => item.length > 0 && arr.indexOf(item) === index)
      : [],
    color: doc.color ?? "",
  };
}

export async function replaceProductVariants(
  productId: string,
  variants: VariantInput[]
): Promise<VariantDocument[]> {
  const normalized = variants
    .map((variant) => normalizeVariantInput(variant))
    .filter((variant) => variant.label.length > 0 && variant.price >= 0);

  const seen = new Set<string>();
  const deduped: VariantInput[] = [];
  const labelLookup = new Map<string, string>();

  for (const variant of normalized) {
    const key = variant.label.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    labelLookup.set(key, variant.label);
    deduped.push(variant);
  }

  if (deduped.length === 0) {
    throw new VariantValidationError("At least one variant is required.");
  }

  const hasDefault = deduped.some((variant) => variant.isDefault);
  if (!hasDefault) {
    deduped[0].isDefault = true;
  }

  const masterLookup = await resolveVariantMasters(deduped, labelLookup);
  const productObjectId = new mongoose.Types.ObjectId(productId);

  const variantDocs = deduped.map((variant) => {
    const doc: Partial<VariantDocument> = {
      productId: productObjectId,
      label: variant.label,
      price: variant.price,
      originalPrice: Number.isFinite(Number(variant.originalPrice))
        ? Number(variant.originalPrice)
        : variant.price,
      discountedPrice: Number.isFinite(Number(variant.discountedPrice))
        ? Number(variant.discountedPrice)
        : variant.price,
      onSale: Boolean(variant.onSale),
      description: variant.description,
      condition: variant.condition,
      sku: variant.sku ?? "",
      stock: typeof variant.stock === "number" ? variant.stock : 1,
      processorId: null,
      processorSubmasterId: variant.processorSubmasterId
        ? new mongoose.Types.ObjectId(variant.processorSubmasterId)
        : null,
      ramId: null,
      ramSubmasterId: variant.ramSubmasterId ? new mongoose.Types.ObjectId(variant.ramSubmasterId) : null,
      storageId: null,
      storageSubmasterId: variant.storageSubmasterId
        ? new mongoose.Types.ObjectId(variant.storageSubmasterId)
        : null,
      graphicsId: null,
      graphicsSubmasterId: variant.graphicsSubmasterId
        ? new mongoose.Types.ObjectId(variant.graphicsSubmasterId)
        : null,
      osId: null,
      osSubmasterId: variant.osSubmasterId ? new mongoose.Types.ObjectId(variant.osSubmasterId) : null,
      imageUrl: variant.imageUrl ?? "",
      galleryImages: variant.galleryImages ?? [],
      richDescription: variant.richDescription ?? "",
      highlights: variant.highlights ?? [],
      featured: Boolean(variant.featured),
      colors: variant.colors ?? [],
      color: variant.color ?? "",
      inStock: Boolean(variant.inStock),
      isDefault: Boolean(variant.isDefault),
    };

    (Object.keys(variantMasterToType) as VariantMasterField[]).forEach((field) => {
      const id = variant[field];
      if (!id) {
        return;
      }
      const option = masterLookup.get(id);
      if (!option) {
        return;
      }
      const idKey = field as keyof VariantDocument;
      (doc as any)[idKey] = option._id;
    });

    return doc as VariantDocument;
  });

  await VariantModel.deleteMany({ productId: productObjectId });
  if (variantDocs.length > 0) {
    await VariantModel.insertMany(variantDocs, { ordered: true });
  }

  const saved = await VariantModel.find({ productId: productObjectId })
    .sort({ isDefault: -1, price: 1 })
    .lean<VariantDocument[]>();

  return saved.map(mapVariantDocument);
}
