import type { FilterQuery } from "mongoose";

import { connectDB } from "@/lib/db";
import type { ProductCondition } from "@/lib/product-constants";
import { ProductModel, type ProductDocument } from "@/models/product";

export interface ProductSummary {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  condition: ProductCondition;
  imageUrl: string | null;
  highlights: string[];
  featured: boolean;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsOptions {
  limit?: number;
  featuredOnly?: boolean;
  inStockOnly?: boolean;
}

function mapProduct(product: ProductDocument): ProductSummary {
  return {
    id: product._id.toString(),
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    condition: product.condition,
    imageUrl: product.imageUrl || null,
    highlights: Array.isArray(product.highlights)
      ? product.highlights.filter((item): item is string => Boolean(item && item.trim()))
      : [],
    featured: Boolean(product.featured),
    inStock: Boolean(product.inStock),
    createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export async function listProducts(options: ListProductsOptions = {}): Promise<ProductSummary[]> {
  await connectDB();

  const filters: FilterQuery<ProductDocument> = {};
  if (options.featuredOnly) {
    filters.featured = true;
  }
  if (options.inStockOnly) {
    filters.inStock = true;
  }

  let query = ProductModel.find(filters).sort({ featured: -1, createdAt: -1 });
  if (typeof options.limit === "number" && Number.isFinite(options.limit)) {
    query = query.limit(Math.max(0, options.limit));
  }

  const products = (await query.lean()) as unknown as ProductDocument[];
  return products.map(mapProduct);
}

export async function getProductById(id: string): Promise<ProductSummary | null> {
  await connectDB();
  const product = await ProductModel.findById(id).lean<ProductDocument | null>();
  if (!product) {
    return null;
  }
  return mapProduct(product);
}
