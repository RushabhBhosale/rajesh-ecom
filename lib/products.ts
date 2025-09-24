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
  category?: string;
  searchQuery?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  minPrice?: number;
  maxPrice?: number;
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

  if (options.category) {
    filters.category = options.category;
  }

  if (typeof options.minPrice === "number" || typeof options.maxPrice === "number") {
    filters.price = {};
    if (typeof options.minPrice === "number") {
      filters.price.$gte = Math.max(0, options.minPrice);
    }
    if (typeof options.maxPrice === "number") {
      filters.price.$lte = Math.max(0, options.maxPrice);
    }
  }

  if (options.searchQuery) {
    const escaped = escapeRegExp(options.searchQuery);
    const pattern = new RegExp(escaped, "i");
    filters.$or = [
      { name: pattern },
      { description: pattern },
      { category: pattern },
      { highlights: { $elemMatch: pattern } },
    ];
  }

  const sort: Record<string, 1 | -1> = {};
  if (options.sort === "price-asc") {
    sort.featured = -1;
    sort.price = 1;
    sort.createdAt = -1;
  } else if (options.sort === "price-desc") {
    sort.featured = -1;
    sort.price = -1;
    sort.createdAt = -1;
  } else {
    sort.featured = -1;
    sort.createdAt = -1;
  }

  let query = ProductModel.find(filters).sort(sort);
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

export async function listProductCategories(): Promise<string[]> {
  await connectDB();
  const categories = await ProductModel.distinct("category");
  return categories
    .map((category) => String(category).trim())
    .filter((category) => category.length > 0)
    .sort((a, b) => a.localeCompare(b));
}

function escapeRegExp(value: string) {
  const regex = /[-/\\^$*+?.()|[\]{}]/g;
  return value.replace(regex, "\\$&");
}
