export const productConditions = ["refurbished", "new"] as const;

export type ProductCondition = (typeof productConditions)[number];

export const MAX_PRODUCT_HIGHLIGHTS = 6;
