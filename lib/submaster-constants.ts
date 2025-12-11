import type { MasterOptionType } from "@/lib/master-constants";

export interface SubMasterOptionSummary {
  id: string;
  masterId: string;
  masterName: string;
  masterType: MasterOptionType;
  name: string;
  description?: string;
  sortOrder?: number;
}

export type SubMasterOptionsByType = Record<MasterOptionType, SubMasterOptionSummary[]>;
