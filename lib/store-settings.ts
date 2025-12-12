export interface StoreSettings {
  gstEnabled: boolean;
  gstRate: number; // percentage (e.g. 18 for 18%)
  shippingEnabled: boolean;
  shippingAmount: number;
}

export const defaultStoreSettings: StoreSettings = {
  gstEnabled: true,
  gstRate: 18,
  shippingEnabled: false,
  shippingAmount: 0,
};

export function normalizeStoreSettings(settings?: Partial<StoreSettings>): StoreSettings {
  const gstRate = Number.isFinite(Number(settings?.gstRate))
    ? Math.min(100, Math.max(0, Number(settings?.gstRate)))
    : defaultStoreSettings.gstRate;
  const shippingAmount = Number.isFinite(Number(settings?.shippingAmount))
    ? Math.max(0, Number(settings?.shippingAmount))
    : defaultStoreSettings.shippingAmount;

  return {
    gstEnabled: Boolean(settings?.gstEnabled ?? defaultStoreSettings.gstEnabled),
    gstRate,
    shippingEnabled: Boolean(settings?.shippingEnabled ?? defaultStoreSettings.shippingEnabled),
    shippingAmount,
  };
}
