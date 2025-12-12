import { connectDB } from "@/lib/db";
import { normalizeStoreSettings, defaultStoreSettings, type StoreSettings } from "@/lib/store-settings";
import { StoreSettingModel, type StoreSettingDocument } from "@/models/store-setting";

function mapDocument(doc: Partial<StoreSettingDocument> | null | undefined): StoreSettings {
  return normalizeStoreSettings({
    gstEnabled: doc?.gstEnabled,
    gstRate: doc?.gstRate,
    shippingEnabled: doc?.shippingEnabled,
    shippingAmount: doc?.shippingAmount,
  });
}

export async function getStoreSettings(): Promise<StoreSettings> {
  await connectDB();
  const settings = await StoreSettingModel.findOne({ key: "store" }).lean<StoreSettingDocument | null>();
  if (!settings) {
    return defaultStoreSettings;
  }
  return mapDocument(settings);
}

export async function updateStoreSettings(input: Partial<StoreSettings>): Promise<StoreSettings> {
  await connectDB();
  const normalized = mapDocument({ ...defaultStoreSettings, ...input });

  const result = await StoreSettingModel.findOneAndUpdate(
    { key: "store" },
    { key: "store", ...normalized },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<StoreSettingDocument | null>();

  return mapDocument(result);
}
