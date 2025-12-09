import type { FilterQuery, SortOrder } from "mongoose";

import { connectDB } from "@/lib/db";
import type { MasterOptionSummary } from "@/lib/master-constants";
import { listMasterOptions } from "@/lib/master-options";
import type { ProductCondition } from "@/lib/product-constants";
import { ProductModel, type ProductDocument } from "@/models/product";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(value: string | undefined): value is string {
  return typeof value === "string" && objectIdRegex.test(value);
}

export interface ProductVariant {
  label: string;
  price: number;
}

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
  variants: ProductVariant[];
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
  company: MasterOptionSummary | null;
  processor: MasterOptionSummary | null;
  ram: MasterOptionSummary | null;
  storage: MasterOptionSummary | null;
  graphics: MasterOptionSummary | null;
  os: MasterOptionSummary | null;
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
  companyId?: string;
  processorId?: string;
  ramId?: string;
  storageId?: string;
  graphicsId?: string;
  osId?: string;
  sort?:
    | "name-asc"
    | "name-desc"
    | "price-asc"
    | "price-desc"
    | "category-asc"
    | "company-asc"
    | "processor-asc"
    | "ram-asc"
    | "storage-asc"
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
    variants: Array.isArray(product.variants)
      ? product.variants
          .map((variant) => {
            const parsedPrice = Number((variant as any)?.price);
            return {
              label: typeof (variant as any)?.label === "string" ? (variant as any).label.trim() : "",
              price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
            };
          })
          .filter((variant, index, arr) => variant.label.length > 0 && variant.price >= 0 &&
            arr.findIndex((candidate) => candidate.label.toLowerCase() === variant.label.toLowerCase()) === index)
      : [],
    colors: Array.isArray(product.colors)
      ? product.colors
          .map((item) => item.trim())
          .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index)
      : [],
    inStock: Boolean(product.inStock),
    createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString(),
    company: product.companyId
      ? { id: product.companyId.toString(), name: product.companyName ?? "", type: "company" }
      : null,
    processor: product.processorId
      ? { id: product.processorId.toString(), name: product.processorName ?? "", type: "processor" }
      : null,
    ram: product.ramId ? { id: product.ramId.toString(), name: product.ramName ?? "", type: "ram" } : null,
    storage: product.storageId
      ? { id: product.storageId.toString(), name: product.storageName ?? "", type: "storage" }
      : null,
    graphics: product.graphicsId
      ? { id: product.graphicsId.toString(), name: product.graphicsName ?? "", type: "graphics" }
      : null,
    os: product.osId ? { id: product.osId.toString(), name: product.osName ?? "", type: "os" } : null,
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

  if (isValidObjectId(options.companyId)) {
    filters.companyId = options.companyId;
  }

  if (isValidObjectId(options.processorId)) {
    filters.processorId = options.processorId;
  }

  if (isValidObjectId(options.ramId)) {
    filters.ramId = options.ramId;
  }

  if (isValidObjectId(options.storageId)) {
    filters.storageId = options.storageId;
  }

  if (isValidObjectId(options.graphicsId)) {
    filters.graphicsId = options.graphicsId;
  }

  if (isValidObjectId(options.osId)) {
    filters.osId = options.osId;
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
      { companyName: searchRegex },
      { processorName: searchRegex },
      { ramName: searchRegex },
      { storageName: searchRegex },
      { graphicsName: searchRegex },
      { osName: searchRegex },
    ];
  }

  const sortMap: Record<NonNullable<ListProductsOptions["sort"]>, Record<string, SortOrder>> = {
    "name-asc": { name: 1, featured: -1 },
    "name-desc": { name: -1, featured: -1 },
    "price-asc": { price: 1, featured: -1 },
    "price-desc": { price: -1, featured: -1 },
    "category-asc": { category: 1, name: 1 },
    "company-asc": { companyName: 1, name: 1 },
    "processor-asc": { processorName: 1, name: 1 },
    "ram-asc": { ramName: 1, name: 1 },
    "storage-asc": { storageName: 1, name: 1 },
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

export interface ProductFacets {
  categories: string[];
  conditions: ProductCondition[];
  priceRange: { minPrice: number; maxPrice: number };
  companies: MasterOptionSummary[];
  processors: MasterOptionSummary[];
  rams: MasterOptionSummary[];
  storages: MasterOptionSummary[];
  graphics: MasterOptionSummary[];
  operatingSystems: MasterOptionSummary[];
}

export async function getProductFacets(): Promise<ProductFacets> {
  await connectDB();
  const [categories, conditions, priceExtremes, masterOptions] = await Promise.all([
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
    listMasterOptions(["company", "processor", "ram", "storage", "graphics", "os"]),
  ]);

  const priceBounds = priceExtremes[0] ?? { minPrice: 0, maxPrice: 0 };
  const companies = masterOptions.filter((item) => item.type === "company");
  const processors = masterOptions.filter((item) => item.type === "processor");
  const rams = masterOptions.filter((item) => item.type === "ram");
  const storages = masterOptions.filter((item) => item.type === "storage");
  const graphics = masterOptions.filter((item) => item.type === "graphics");
  const operatingSystems = masterOptions.filter((item) => item.type === "os");

  return {
    categories: categories.sort((a, b) => a.localeCompare(b)),
    conditions: conditions.sort((a, b) => a.localeCompare(b)),
    priceRange: priceBounds,
    companies,
    processors,
    rams,
    storages,
    graphics,
    operatingSystems,
  };
}
