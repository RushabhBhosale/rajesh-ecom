import type { FilterQuery, SortOrder } from "mongoose";

import { connectDB } from "@/lib/db";
import type { MasterOptionSummary } from "@/lib/master-constants";
import type { SubMasterOptionSummary } from "@/lib/submaster-constants";
import { listMasterOptions } from "@/lib/master-options";
import type { ProductCondition } from "@/lib/product-constants";
import { ProductModel, type ProductDocument } from "@/models/product";
import { VariantModel, type VariantDocument } from "@/models/variant";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(value: string | undefined): value is string {
  return typeof value === "string" && objectIdRegex.test(value);
}

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  color: string | null;
  isDefault: boolean;
  processor: MasterOptionSummary | null;
  ram: MasterOptionSummary | null;
  storage: MasterOptionSummary | null;
  graphics: MasterOptionSummary | null;
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
  companySubmaster: SubMasterOptionSummary | null;
  processor: MasterOptionSummary | null;
  processorSubmaster: SubMasterOptionSummary | null;
  ram: MasterOptionSummary | null;
  ramSubmaster: SubMasterOptionSummary | null;
  storage: MasterOptionSummary | null;
  storageSubmaster: SubMasterOptionSummary | null;
  graphics: MasterOptionSummary | null;
  graphicsSubmaster: SubMasterOptionSummary | null;
  os: MasterOptionSummary | null;
  osSubmaster: SubMasterOptionSummary | null;
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

function mapVariantDocument(variant: VariantDocument): ProductVariant {
  const price = Number.isFinite(Number((variant as any)?.price))
    ? Number((variant as any)?.price)
    : 0;
  const color =
    typeof variant.color === "string" && variant.color.trim().length > 0
      ? variant.color.trim()
      : null;

  return {
    id: variant._id.toString(),
    label: typeof variant.label === "string" ? variant.label.trim() : "",
    price,
    color,
    isDefault: Boolean(variant.isDefault),
    processor: variant.processorId
      ? { id: variant.processorId.toString(), name: variant.processorName ?? "", type: "processor" }
      : null,
    ram: variant.ramId ? { id: variant.ramId.toString(), name: variant.ramName ?? "", type: "ram" } : null,
    storage: variant.storageId
      ? { id: variant.storageId.toString(), name: variant.storageName ?? "", type: "storage" }
      : null,
    graphics: variant.graphicsId
      ? { id: variant.graphicsId.toString(), name: variant.graphicsName ?? "", type: "graphics" }
      : null,
  };
}

function buildFallbackVariant(product: ProductDocument): ProductVariant {
  const labelParts = [
    product.processorName,
    product.ramName,
    product.storageName,
    product.graphicsName,
  ]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);

  const color =
    Array.isArray(product.colors) && product.colors.length === 1
      ? product.colors[0]?.trim() || null
      : null;

  return {
    id: `${product._id.toString()}-base`,
    label: labelParts.length > 0 ? labelParts.join(" • ") : "Base configuration",
    price: Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
    color,
    isDefault: true,
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
  };
}

function mapVariantsForProduct(
  product: ProductDocument,
  variantDocs: VariantDocument[] | undefined
): ProductVariant[] {
  const variants = Array.isArray(variantDocs) && variantDocs.length > 0
    ? variantDocs.map(mapVariantDocument)
    : [buildFallbackVariant(product)];

  const hasDefault = variants.some((variant) => variant.isDefault);
  if (!hasDefault && variants.length > 0) {
    variants[0].isDefault = true;
  }

  return variants;
}

function mapProduct(product: ProductDocument, variants: ProductVariant[]): ProductSummary {
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  return {
    id: product._id.toString(),
    name: product.name,
    category: product.category,
    description: product.description,
    price: defaultVariant?.price ?? product.price,
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
    variants,
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
    companySubmaster: product.companySubmasterId
      ? {
          id: product.companySubmasterId.toString(),
          masterId: product.companyId?.toString() ?? "",
          masterName: product.companyName ?? "",
          masterType: "company",
          name: product.companySubmasterName ?? "",
        }
      : null,
    processor: defaultVariant?.processor
      ? defaultVariant.processor
      : product.processorId
      ? { id: product.processorId.toString(), name: product.processorName ?? "", type: "processor" }
      : null,
    processorSubmaster: product.processorSubmasterId
      ? {
          id: product.processorSubmasterId.toString(),
          masterId: product.processorId?.toString() ?? "",
          masterName: product.processorName ?? "",
          masterType: "processor",
          name: product.processorSubmasterName ?? "",
        }
      : null,
    ram: defaultVariant?.ram
      ? defaultVariant.ram
      : product.ramId
      ? { id: product.ramId.toString(), name: product.ramName ?? "", type: "ram" }
      : null,
    ramSubmaster: product.ramSubmasterId
      ? {
          id: product.ramSubmasterId.toString(),
          masterId: product.ramId?.toString() ?? "",
          masterName: product.ramName ?? "",
          masterType: "ram",
          name: product.ramSubmasterName ?? "",
        }
      : null,
    storage: defaultVariant?.storage
      ? defaultVariant.storage
      : product.storageId
      ? { id: product.storageId.toString(), name: product.storageName ?? "", type: "storage" }
      : null,
    storageSubmaster: product.storageSubmasterId
      ? {
          id: product.storageSubmasterId.toString(),
          masterId: product.storageId?.toString() ?? "",
          masterName: product.storageName ?? "",
          masterType: "storage",
          name: product.storageSubmasterName ?? "",
        }
      : null,
    graphics: defaultVariant?.graphics
      ? defaultVariant.graphics
      : product.graphicsId
      ? { id: product.graphicsId.toString(), name: product.graphicsName ?? "", type: "graphics" }
      : null,
    graphicsSubmaster: product.graphicsSubmasterId
      ? {
          id: product.graphicsSubmasterId.toString(),
          masterId: product.graphicsId?.toString() ?? "",
          masterName: product.graphicsName ?? "",
          masterType: "graphics",
          name: product.graphicsSubmasterName ?? "",
        }
      : null,
    os: product.osId ? { id: product.osId.toString(), name: product.osName ?? "", type: "os" } : null,
    osSubmaster: product.osSubmasterId
      ? {
          id: product.osSubmasterId.toString(),
          masterId: product.osId?.toString() ?? "",
          masterName: product.osName ?? "",
          masterType: "os",
          name: product.osSubmasterName ?? "",
        }
      : null,
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

  if (isValidObjectId(options.osId)) {
    filters.osId = options.osId;
  }

  const processorFilterId = isValidObjectId(options.processorId) ? options.processorId : undefined;
  const ramFilterId = isValidObjectId(options.ramId) ? options.ramId : undefined;
  const storageFilterId = isValidObjectId(options.storageId) ? options.storageId : undefined;
  const graphicsFilterId = isValidObjectId(options.graphicsId) ? options.graphicsId : undefined;
  const needsVariantFiltering =
    Boolean(processorFilterId) ||
    Boolean(ramFilterId) ||
    Boolean(storageFilterId) ||
    Boolean(graphicsFilterId);

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
  const productIds = products.map((product) => product._id);
  const variantDocs = productIds.length
    ? await VariantModel.find({ productId: { $in: productIds } })
        .sort({ isDefault: -1, price: 1 })
        .lean<VariantDocument[]>()
    : [];

  const variantMap = new Map<string, VariantDocument[]>();
  variantDocs.forEach((variant) => {
    const key = typeof variant.productId === "string" ? variant.productId : variant.productId?.toString();
    if (!key) {
      return;
    }
    if (!variantMap.has(key)) {
      variantMap.set(key, []);
    }
    variantMap.get(key)?.push(variant);
  });

  const masterOptionsForFilter = needsVariantFiltering
    ? await listMasterOptions(
        [
          processorFilterId ? "processor" : null,
          ramFilterId ? "ram" : null,
          storageFilterId ? "storage" : null,
          graphicsFilterId ? "graphics" : null,
        ].filter((item): item is Exclude<typeof item, null> => Boolean(item))
      )
    : [];

  const filterOptionNameById = new Map(masterOptionsForFilter.map((item) => [item.id, item.name ?? ""]));

  const matchesField = (
    selectedId: string | undefined,
    variantId: unknown,
    variantName: string | null | undefined
  ) => {
    if (!selectedId) {
      return true;
    }
    const variantIdString = typeof variantId === "string" ? variantId : (variantId as any)?.toString?.();
    if (variantIdString === selectedId) {
      return true;
    }
    const targetName = filterOptionNameById.get(selectedId)?.trim().toLowerCase();
    if (!targetName) {
      return false;
    }
    const normalizedVariantName = variantName?.trim().toLowerCase() ?? "";
    return normalizedVariantName === targetName;
  };

  const matchesVariantFilters = (product: ProductDocument, variantsForProduct: VariantDocument[]) => {
    if (!needsVariantFiltering) {
      return true;
    }
    const candidates = variantsForProduct.length > 0 ? variantsForProduct : [product];
    return candidates.some((variant) =>
      matchesField(processorFilterId, (variant as any).processorId, (variant as any).processorName) &&
      matchesField(ramFilterId, (variant as any).ramId, (variant as any).ramName) &&
      matchesField(storageFilterId, (variant as any).storageId, (variant as any).storageName) &&
      matchesField(graphicsFilterId, (variant as any).graphicsId, (variant as any).graphicsName)
    );
  };

  const filteredProducts = products.filter((product) => {
    const variantsForProduct = variantMap.get(product._id.toString()) ?? [];
    return matchesVariantFilters(product, variantsForProduct);
  });

  return filteredProducts.map((product) => {
    const variants = mapVariantsForProduct(product, variantMap.get(product._id.toString()));
    return mapProduct(product, variants);
  });
}

export async function getProductById(id: string): Promise<ProductSummary | null> {
  await connectDB();
  const product = await ProductModel.findById(id).lean<ProductDocument | null>();
  if (!product) {
    return null;
  }

  const variantDocs = await VariantModel.find({ productId: product._id })
    .sort({ isDefault: -1, price: 1 })
    .lean<VariantDocument[]>();
  const variants = mapVariantsForProduct(product, variantDocs);

  return mapProduct(product, variants);
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
