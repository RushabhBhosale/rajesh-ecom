import type { FilterQuery, SortOrder } from "mongoose";

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
  galleryImages: string[];
  richDescription: string | null;
  highlights: string[];
  featured: boolean;
  colors: string[];
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsOptions {
  limit?: number;
  featuredOnly?: boolean;
  inStockOnly?: boolean;
  search?: string;
  category?: string;
  condition?: ProductCondition | "all";
  minPrice?: number;
  maxPrice?: number;
  sort?:
    | "name-asc"
    | "name-desc"
    | "price-asc"
    | "price-desc"
    | "category-asc"
    | "created-desc";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages.filter((item): item is string => Boolean(item && item.trim()))
      : [],
    richDescription: product.richDescription || null,
    highlights: Array.isArray(product.highlights)
      ? product.highlights.filter((item): item is string => Boolean(item && item.trim()))
      : [],
    featured: Boolean(product.featured),
    colors: Array.isArray(product.colors)
      ? product.colors
          .map((item) => item.trim())
          .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index)
      : [],
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

  if (options.category && options.category !== "all") {
    filters.category = options.category;
  }

  if (options.condition && options.condition !== "all") {
    filters.condition = options.condition;
  }

  const priceFilters: FilterQuery<ProductDocument>["price"] = {};
  if (typeof options.minPrice === "number" && !Number.isNaN(options.minPrice)) {
    priceFilters.$gte = Math.max(0, options.minPrice);
  }
  if (typeof options.maxPrice === "number" && !Number.isNaN(options.maxPrice)) {
    priceFilters.$lte = Math.max(0, options.maxPrice);
  }
  if (Object.keys(priceFilters).length > 0) {
    filters.price = priceFilters;
  }

  if (options.search) {
    const searchRegex = new RegExp(escapeRegExp(options.search), "i");
    filters.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
    ];
  }

  const sortMap: Record<NonNullable<ListProductsOptions["sort"]>, Record<string, SortOrder>> = {
    "name-asc": { name: 1, featured: -1 },
    "name-desc": { name: -1, featured: -1 },
    "price-asc": { price: 1, featured: -1 },
    "price-desc": { price: -1, featured: -1 },
    "category-asc": { category: 1, name: 1 },
    "created-desc": { featured: -1, createdAt: -1 },
  };

  const defaultSort: Record<string, SortOrder> = { featured: -1, createdAt: -1 };
  const sort = options.sort ? sortMap[options.sort] ?? defaultSort : defaultSort;

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

export async function getProductFacets() {
  await connectDB();
  const [categories, conditions, priceExtremes] = await Promise.all([
    ProductModel.distinct("category") as Promise<string[]>,
    ProductModel.distinct("condition") as Promise<ProductCondition[]>,
    ProductModel.aggregate<{ minPrice: number; maxPrice: number }>([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]),
  ]);

  const priceBounds = priceExtremes[0] ?? { minPrice: 0, maxPrice: 0 };

  return {
    categories: categories.sort((a, b) => a.localeCompare(b)),
    conditions: conditions.sort((a, b) => a.localeCompare(b)),
    priceRange: priceBounds,
  };
}
