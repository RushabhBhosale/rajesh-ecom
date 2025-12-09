import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import {
  type MasterOptionSummary,
  type MasterOptionType,
  masterTypeLabels,
  masterTypes,
} from "@/lib/master-constants";
import {
  MasterOptionModel,
  type MasterOptionDocument,
} from "@/models/master-option";

type MasterOptionMap = Record<MasterOptionType, MasterOptionSummary[]>;

function mapMasterOption(option: MasterOptionDocument): MasterOptionSummary {
  return {
    id: option._id.toString(),
    name: option.name,
    type: option.type as MasterOptionType,
    description: option.description ?? "",
    sortOrder: typeof option.sortOrder === "number" ? option.sortOrder : 0,
  };
}

export async function listMasterOptions(
  types?: readonly MasterOptionType[]
): Promise<MasterOptionSummary[]> {
  await connectDB();
  const allowedTypes =
    Array.isArray(types) && types.length > 0 ? types : masterTypes;

  const records = await MasterOptionModel.find({ type: { $in: allowedTypes } })
    .sort({ sortOrder: 1, name: 1 })
    .lean<MasterOptionDocument[]>();

  return records.map(mapMasterOption);
}

export async function getMasterOptionById(
  id: string
): Promise<MasterOptionSummary | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await connectDB();
  const record = await MasterOptionModel.findById(
    id
  ).lean<MasterOptionDocument | null>();
  return record ? mapMasterOption(record) : null;
}

export function groupMasterOptions(
  options: MasterOptionSummary[]
): MasterOptionMap {
  const grouped = Object.fromEntries(
    masterTypes.map((type) => [type, []])
  ) as unknown as MasterOptionMap;
  for (const option of options) {
    grouped[option.type].push(option);
  }
  return grouped;
}

export function masterFieldToLabel(type: MasterOptionType): string {
  return masterTypeLabels[type] ?? "Option";
}

export interface ProductMasterIds {
  companyId?: string;
  processorId?: string;
  ramId?: string;
  storageId?: string;
  graphicsId?: string;
  osId?: string;
}

export interface ProductMasterSelection {
  company?: MasterOptionSummary;
  processor?: MasterOptionSummary;
  ram?: MasterOptionSummary;
  storage?: MasterOptionSummary;
  graphics?: MasterOptionSummary;
  os?: MasterOptionSummary;
}

const idFieldToType: Record<keyof ProductMasterIds, MasterOptionType> = {
  companyId: "company",
  processorId: "processor",
  ramId: "ram",
  storageId: "storage",
  graphicsId: "graphics",
  osId: "os",
};

const idFieldToSelectionKey: Record<
  keyof ProductMasterIds,
  keyof ProductMasterSelection
> = {
  companyId: "company",
  processorId: "processor",
  ramId: "ram",
  storageId: "storage",
  graphicsId: "graphics",
  osId: "os",
};

export async function resolveProductMasters(
  ids: ProductMasterIds
): Promise<
  | { ok: true; selection: ProductMasterSelection }
  | { ok: false; message: string }
> {
  const entries = Object.entries(ids).filter(
    (item): item is [keyof ProductMasterIds, string] => Boolean(item[1])
  );

  if (!entries.length) {
    return { ok: true, selection: {} };
  }

  await connectDB();
  const lookupIds = Array.from(new Set(entries.map(([, value]) => value)));
  const options = await MasterOptionModel.find({ _id: { $in: lookupIds } })
    .select({ name: 1, type: 1 })
    .lean<MasterOptionDocument[]>();

  const selection: ProductMasterSelection = {};

  for (const [field, id] of entries) {
    const option = options.find((record) => record._id.toString() === id);
    const expectedType = idFieldToType[field];
    if (!option) {
      return {
        ok: false,
        message: `${masterFieldToLabel(expectedType)} not found`,
      };
    }
    if (option.type !== expectedType) {
      return {
        ok: false,
        message: `Selected ${masterFieldToLabel(
          expectedType
        )} is not a ${masterFieldToLabel(option.type as MasterOptionType)}`,
      };
    }

    const selectionKey = idFieldToSelectionKey[field];
    selection[selectionKey] = {
      id: option._id.toString(),
      name: option.name,
      type: option.type as MasterOptionType,
    };
  }

  return { ok: true, selection };
}
