import mongoose from "mongoose";
import type { QueryFilter } from "mongoose";

import { connectDB } from "@/lib/db";
import { masterTypes, type MasterOptionType } from "@/lib/master-constants";
import type { ProductMasterSelection } from "@/lib/master-options";
import type { SubMasterOptionSummary, SubMasterOptionsByType } from "@/lib/submaster-constants";
import { MasterOptionModel, type MasterOptionDocument } from "@/models/master-option";
import {
  SubMasterOptionModel,
  type SubMasterOptionDocument,
} from "@/models/sub-master-option";

function mapSubMasterOption(
  subMaster: SubMasterOptionDocument,
  master: MasterOptionDocument
): SubMasterOptionSummary {
  return {
    id: subMaster._id.toString(),
    masterId: master._id.toString(),
    masterName: master.name,
    masterType: master.type as MasterOptionType,
    name: subMaster.name,
    parentId: subMaster.parentId ? subMaster.parentId.toString() : null,
    description: subMaster.description ?? "",
    sortOrder: typeof subMaster.sortOrder === "number" ? subMaster.sortOrder : 0,
  };
}

function normalizeIds(input?: string | string[]): string[] {
  if (!input) {
    return [];
  }
  const values = Array.isArray(input) ? input : [input];
  return values
    .map((value) => value.trim())
    .filter((value) => mongoose.Types.ObjectId.isValid(value));
}

export async function listSubMasterOptions(options?: {
  types?: readonly MasterOptionType[];
  masterId?: string | string[];
}): Promise<SubMasterOptionSummary[]> {
  await connectDB();

  const allowedTypes =
    Array.isArray(options?.types) && options?.types.length ? options.types : masterTypes;

  const masterIds = normalizeIds(options?.masterId);
  if (options?.masterId && masterIds.length === 0) {
    return [];
  }
  const masterQuery: QueryFilter<MasterOptionDocument> = {
    type: { $in: allowedTypes },
  };
  if (masterIds.length > 0) {
    masterQuery._id = { $in: masterIds };
  }

  const masters = await MasterOptionModel.find(masterQuery)
    .select({ name: 1, type: 1 })
    .sort({ type: 1, sortOrder: 1, name: 1 })
    .lean<MasterOptionDocument[]>();

  const masterLookup = new Map(masters.map((record) => [record._id.toString(), record]));

  const subMasters: SubMasterOptionDocument[] = [];
  const seenSubMasterIds = new Set<string>();
  let queueIds = new Set<string>();

  const baseMasterIds = masterLookup.size ? Array.from(masterLookup.keys()) : masterIds;

  if (!baseMasterIds.length) {
    return [];
  }

  const initial = await SubMasterOptionModel.find({
    masterId: { $in: baseMasterIds },
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean<SubMasterOptionDocument[]>();

  initial.forEach((record) => {
    const id = record._id.toString();
    if (!seenSubMasterIds.has(id)) {
      seenSubMasterIds.add(id);
      subMasters.push(record);
      if (record.parentId) {
        queueIds.add(record.parentId.toString());
      }
    }
  });

  // Fetch ancestors so paths can be built even if parents weren't in the base query.
  while (queueIds.size) {
    const toFetch = Array.from(queueIds).filter((id) => !seenSubMasterIds.has(id));
    queueIds = new Set<string>();
    if (!toFetch.length) break;
    const ancestors = await SubMasterOptionModel.find({ _id: { $in: toFetch } })
      .sort({ sortOrder: 1, name: 1 })
      .lean<SubMasterOptionDocument[]>();
    ancestors.forEach((record) => {
      const id = record._id.toString();
      if (seenSubMasterIds.has(id)) return;
      seenSubMasterIds.add(id);
      subMasters.push(record);
      if (record.parentId) {
        queueIds.add(record.parentId.toString());
      }
    });
  }

  // Ensure masters include any referenced by fetched ancestors.
  const neededMasterIds = Array.from(
    new Set(subMasters.map((record) => record.masterId.toString()))
  ).filter((id) => !masterLookup.has(id));
  if (neededMasterIds.length) {
    const extraMasters = await MasterOptionModel.find({ _id: { $in: neededMasterIds } })
      .select({ name: 1, type: 1 })
      .lean<MasterOptionDocument[]>();
    extraMasters.forEach((master) => {
      masterLookup.set(master._id.toString(), master);
    });
  }

  return subMasters
    .map((subMaster) => {
      const master = masterLookup.get(subMaster.masterId.toString());
      if (!master) {
        return null;
      }
      return mapSubMasterOption(subMaster, master);
    })
    .filter((record): record is SubMasterOptionSummary => Boolean(record));
}

export async function getSubMasterOptionById(
  id: string
): Promise<SubMasterOptionSummary | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();
  const subMaster = await SubMasterOptionModel.findById(
    id
  ).lean<SubMasterOptionDocument | null>();
  if (!subMaster) {
    return null;
  }

  const master = await MasterOptionModel.findById(subMaster.masterId)
    .select({ name: 1, type: 1 })
    .lean<MasterOptionDocument | null>();
  if (!master) {
    return null;
  }

  return mapSubMasterOption(subMaster, master);
}

export function groupSubMasterOptions(
  options: SubMasterOptionSummary[]
): SubMasterOptionsByType {
  const grouped = Object.fromEntries(masterTypes.map((type) => [type, []])) as unknown as
    SubMasterOptionsByType;
  for (const option of options) {
    grouped[option.masterType].push(option);
  }
  return grouped;
}

export interface ProductSubMasterIds {
  companySubMasterId?: string;
  processorSubMasterId?: string;
  ramSubMasterId?: string;
  storageSubMasterId?: string;
  graphicsSubMasterId?: string;
  osSubMasterId?: string;
}

export interface ProductSubMasterSelection {
  companySubMaster?: SubMasterOptionSummary;
  processorSubMaster?: SubMasterOptionSummary;
  ramSubMaster?: SubMasterOptionSummary;
  storageSubMaster?: SubMasterOptionSummary;
  graphicsSubMaster?: SubMasterOptionSummary;
  osSubMaster?: SubMasterOptionSummary;
}

const subMasterFieldToType: Record<keyof ProductSubMasterIds, MasterOptionType> = {
  companySubMasterId: "company",
  processorSubMasterId: "processor",
  ramSubMasterId: "ram",
  storageSubMasterId: "storage",
  graphicsSubMasterId: "graphics",
  osSubMasterId: "os",
};

const subMasterFieldToParentKey: Record<
  keyof ProductSubMasterIds,
  keyof ProductMasterSelection
> = {
  companySubMasterId: "company",
  processorSubMasterId: "processor",
  ramSubMasterId: "ram",
  storageSubMasterId: "storage",
  graphicsSubMasterId: "graphics",
  osSubMasterId: "os",
};

const subMasterFieldToSelectionKey: Record<
  keyof ProductSubMasterIds,
  keyof ProductSubMasterSelection
> = {
  companySubMasterId: "companySubMaster",
  processorSubMasterId: "processorSubMaster",
  ramSubMasterId: "ramSubMaster",
  storageSubMasterId: "storageSubMaster",
  graphicsSubMasterId: "graphicsSubMaster",
  osSubMasterId: "osSubMaster",
};

export async function resolveProductSubMasters(
  ids: ProductSubMasterIds,
  masters: ProductMasterSelection
): Promise<
  | { ok: true; selection: ProductSubMasterSelection }
  | { ok: false; message: string }
> {
  const entries = Object.entries(ids).filter(
    (item): item is [keyof ProductSubMasterIds, string] => Boolean(item[1])
  );

  if (!entries.length) {
    return { ok: true, selection: {} };
  }

  await connectDB();
  const lookupIds = Array.from(new Set(entries.map(([, value]) => value)));
  const subMasters = await SubMasterOptionModel.find({ _id: { $in: lookupIds } })
    .select({ name: 1, masterId: 1, masterType: 1 })
    .lean<SubMasterOptionDocument[]>();

  const selection: ProductSubMasterSelection = {};

  for (const [field, id] of entries) {
    const record = subMasters.find((item) => item._id.toString() === id);
    const expectedType = subMasterFieldToType[field];
    const parentKey = subMasterFieldToParentKey[field];
    const parentMaster = masters[parentKey];

    if (!parentMaster) {
      return {
        ok: false,
        message: `Select a ${expectedType} before choosing a submaster.`,
      };
    }

    if (!record) {
      return {
        ok: false,
        message: `Selected submaster for ${expectedType} not found`,
      };
    }

    if (record.masterType !== expectedType) {
      return {
        ok: false,
        message: `Selected submaster is not a ${expectedType}`,
      };
    }

    if (record.masterId.toString() !== parentMaster.id) {
      return {
        ok: false,
        message: `Selected submaster does not belong to the chosen ${expectedType}`,
      };
    }

    const selectionKey = subMasterFieldToSelectionKey[field];
    selection[selectionKey] = {
      id: record._id.toString(),
      masterId: record.masterId.toString(),
      masterName: parentMaster.name,
      masterType: expectedType,
      name: record.name,
    };
  }

  return { ok: true, selection };
}
