import mongoose from "mongoose";

import { masterTypeLabels, type MasterOptionType } from "@/lib/master-constants";
import { MasterOptionModel, type MasterOptionDocument } from "@/models/master-option";
import { VariantModel, type VariantDocument } from "@/models/variant";

export interface VariantInput {
  label: string;
  price: number;
  processorId?: string;
  ramId?: string;
  storageId?: string;
  graphicsId?: string;
  color?: string;
  isDefault?: boolean;
}

type VariantMasterField =
  | "processorId"
  | "ramId"
  | "storageId"
  | "graphicsId";

const variantMasterToType: Record<VariantMasterField, MasterOptionType> = {
  processorId: "processor",
  ramId: "ram",
  storageId: "storage",
  graphicsId: "graphics",
};

export class VariantValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VariantValidationError";
  }
}

function normalizeVariantInput(variant: VariantInput): VariantInput {
  return {
    label: variant.label.trim(),
    price: Number.isFinite(variant.price) ? variant.price : 0,
    processorId: variant.processorId || undefined,
    ramId: variant.ramId || undefined,
    storageId: variant.storageId || undefined,
    graphicsId: variant.graphicsId || undefined,
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
    processorName: doc.processorName ?? "",
    ramName: doc.ramName ?? "",
    storageName: doc.storageName ?? "",
    graphicsName: doc.graphicsName ?? "",
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
      processorId: null,
      processorName: "",
      ramId: null,
      ramName: "",
      storageId: null,
      storageName: "",
      graphicsId: null,
      graphicsName: "",
      color: variant.color ?? "",
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
      const nameKey = (field.replace("Id", "Name") ?? "") as keyof VariantDocument;
      (doc as any)[idKey] = option._id;
      (doc as any)[nameKey] = option.name;
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
