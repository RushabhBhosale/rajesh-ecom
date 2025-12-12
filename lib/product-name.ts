import type { ProductMasterSelection } from "@/lib/master-options";
import type { ProductPayload } from "@/lib/product-validation";

function formatCondition(condition?: string) {
  if (!condition) {
    return "";
  }
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

export function generateProductName(payload: ProductPayload, masterSelection: ProductMasterSelection): string {
  const company = masterSelection.company?.name?.trim();
  const processor = masterSelection.processor?.name?.trim();
  const ram = masterSelection.ram?.name?.trim();
  const storage = masterSelection.storage?.name?.trim();
  const graphics = masterSelection.graphics?.name?.trim();

  const specParts = [processor, ram, storage, graphics].filter((part): part is string => Boolean(part));
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
