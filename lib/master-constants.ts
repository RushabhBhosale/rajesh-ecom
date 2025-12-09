export const masterTypes = ["company", "processor", "ram", "storage", "graphics", "os"] as const;

export type MasterOptionType = (typeof masterTypes)[number];

export interface MasterOptionSummary {
  id: string;
  name: string;
  type: MasterOptionType;
  description?: string;
  sortOrder?: number;
}

export const masterTypeLabels: Record<MasterOptionType, string> = {
  company: "Company",
  processor: "Processor",
  ram: "RAM",
  storage: "Storage",
  graphics: "Graphics",
  os: "Operating system",
};
