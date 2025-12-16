import type { ProductMasterSelection } from "@/lib/master-options";
import type { ProductSubMasterSelection } from "@/lib/submaster-options";
import type { ProductPayload } from "@/lib/product-validation";

function formatCondition(condition?: string) {
  if (!condition) {
    return "";
  }
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

function collectSubMasterNames(selection?: ProductSubMasterSelection): string[] {
  if (!selection) return [];
  const names = [
    selection.companySubMaster?.name,
    selection.processorSubMaster?.name,
    selection.ramSubMaster?.name,
    selection.storageSubMaster?.name,
    selection.graphicsSubMaster?.name,
    selection.osSubMaster?.name,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return names;
}

export function generateProductName(
  payload: ProductPayload,
  masterSelection: ProductMasterSelection,
  subMasterSelection?: ProductSubMasterSelection
): string {
  const company = masterSelection.company?.name?.trim();
  const processor = masterSelection.processor?.name?.trim();
  const ram = masterSelection.ram?.name?.trim();
  const storage = masterSelection.storage?.name?.trim();
  const graphics = masterSelection.graphics?.name?.trim();
  const os = masterSelection.os?.name?.trim();
  const subMasters = collectSubMasterNames(subMasterSelection);

  const specParts = [subMasterSelection?.companySubMaster?.name, processor, ram, storage, graphics, os, ...subMasters].filter(
    (part): part is string => Boolean(part)
  );
  const specsLabel = specParts.join(" • ");

  const base = company || payload.category?.trim() || "Product";
  const condition = formatCondition(payload.condition);

  let name = specsLabel ? `${base} ${specsLabel}` : base;
  if (condition) {
    name = `${name} (${condition})`;
  }

  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "Product";
}
