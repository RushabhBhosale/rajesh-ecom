export interface StoreSettings {
  gstEnabled: boolean;
  gstRate: number; // percentage (e.g. 18 for 18%)
  shippingEnabled: boolean;
  shippingAmount: number;
  topBarEnabled: boolean;
  topBarMessage: string;
  topBarCtaText: string;
  topBarCtaHref: string;
}

export const defaultStoreSettings: StoreSettings = {
  gstEnabled: true,
  gstRate: 18,
  shippingEnabled: false,
  shippingAmount: 0,
  topBarEnabled: true,
  topBarMessage: "Free 2-day shipping on business orders over $499",
  topBarCtaText: "Browse featured inventory",
  topBarCtaHref: "/products",
};

export function normalizeStoreSettings(settings?: Partial<StoreSettings>): StoreSettings {
  const normalizeText = (value: unknown, fallback: string, maxLength: number) => {
    if (typeof value !== "string") {
      return fallback;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }
    return trimmed.slice(0, maxLength);
  };

  const gstRate = Number.isFinite(Number(settings?.gstRate))
    ? Math.min(100, Math.max(0, Number(settings?.gstRate)))
    : defaultStoreSettings.gstRate;
  const shippingAmount = Number.isFinite(Number(settings?.shippingAmount))
    ? Math.max(0, Number(settings?.shippingAmount))
    : defaultStoreSettings.shippingAmount;
  const topBarMessage = normalizeText(settings?.topBarMessage, defaultStoreSettings.topBarMessage, 140);
  const topBarCtaText = normalizeText(settings?.topBarCtaText, defaultStoreSettings.topBarCtaText, 60);
  const normalizedHref = normalizeText(settings?.topBarCtaHref, defaultStoreSettings.topBarCtaHref, 300);
  const topBarCtaHref = normalizedHref.startsWith("/") ? normalizedHref : defaultStoreSettings.topBarCtaHref;

  return {
    gstEnabled: Boolean(settings?.gstEnabled ?? defaultStoreSettings.gstEnabled),
    gstRate,
    shippingEnabled: Boolean(settings?.shippingEnabled ?? defaultStoreSettings.shippingEnabled),
    shippingAmount,
    topBarEnabled: Boolean(settings?.topBarEnabled ?? defaultStoreSettings.topBarEnabled),
    topBarMessage,
    topBarCtaText,
    topBarCtaHref,
  };
}
