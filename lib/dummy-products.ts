import { productConditions } from "@/lib/product-constants";

export const dummySeedCategories = [
  "Laptops",
  "Desktops",
  "Tablets",
  "Accessories",
  "Networking",
  "Audio",
  "Monitors",
  "Servers",
] as const;

const highlightPool = [
  "Battery health above 85%",
  "Latest firmware applied",
  "Fresh thermal paste and cleaning",
  "SSD storage upgrade included",
  "Ships with genuine charger",
  "Undergoes 50-point QA testing",
  "Comes with 6-month warranty",
  "Ready for enterprise deployment",
] as const;

export interface DummyProductSeed {
  name: string;
  category: string;
  description: string;
  price: number;
  condition: (typeof productConditions)[number];
  imageUrl: string;
  featured: boolean;
  inStock: boolean;
  highlights: string[];
}

function buildHighlights(index: number) {
  const highlights: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const highlight = highlightPool[(index + i) % highlightPool.length];
    highlights.push(highlight);
  }
  return highlights;
}

export function createDummyProductBatch(count = 50, batchId = Date.now()): DummyProductSeed[] {
  return Array.from({ length: count }, (_, index) => {
    const categoryName = dummySeedCategories[index % dummySeedCategories.length];
    const condition = productConditions[index % productConditions.length];
    const productNumber = index + 1;
    const name = `${categoryName} Batch ${batchId}-${productNumber}`;
    const price = Math.round(18000 + index * 550 + (index % 7) * 950);
    const description = `${name} has been professionally refurbished with genuine parts, endurance tested, and prepared for instant deployment in business environments.`;
    const imageUrl = `https://picsum.photos/seed/rajesh-${batchId}-${productNumber}/800/600`;
    const highlights = buildHighlights(index);
    const featured = index % 10 === 0;
    const inStock = index % 6 !== 0;

    return {
      name,
      category: categoryName,
      description,
      price,
      condition,
      imageUrl,
      featured,
      inStock,
      highlights,
    };
  });
}
