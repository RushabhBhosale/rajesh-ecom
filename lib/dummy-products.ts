import { productConditions } from "@/lib/product-constants";

export const dummySeedCategories = ["Laptops", "Desktops", "Accessories"];

interface DummyProduct {
  name: string;
  category: string;
  description: string;
  price: number;
  condition: (typeof productConditions)[number];
  imageUrl: string;
  featured: boolean;
  inStock: boolean;
  highlights: string[];
  sku: string;
  stock: number;
}

export function createDummyProductBatch(count = 50, batchId = Date.now()): DummyProduct[] {
  const products: DummyProduct[] = [];
  for (let index = 0; index < count; index += 1) {
    const category = dummySeedCategories[index % dummySeedCategories.length];
    const condition = productConditions[index % productConditions.length];
    const name = `${category} Batch ${batchId}-${index + 1}`;
    const price = 12000 + index * 250;
    const featured = index % 5 === 0;
    const inStock = index % 7 !== 0;
    const stock = inStock ? Math.max(1, 20 - (index % 10)) : 0;
    const sku = `SKU-${batchId}-${index + 1}`;
    const highlights =
      category === "Laptops"
        ? ["8GB RAM", "256GB SSD"]
        : category === "Desktops"
        ? ["16GB RAM", "512GB SSD"]
        : ["Brand-compatible", "Includes warranty"];

    products.push({
      name,
      category,
      description: `${category} description`,
      price,
      condition,
      imageUrl: `https://example.com/${category.toLowerCase()}.jpg`,
      featured,
      inStock,
      highlights,
      sku,
      stock,
    });
  }
  return products;
}
