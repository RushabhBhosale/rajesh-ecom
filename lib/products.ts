import mongoose, { type FilterQuery } from "mongoose";

import { connectDB } from "@/lib/db";
import type { MasterOptionSummary, MasterOptionType } from "@/lib/master-constants";
import type { SubMasterOptionSummary } from "@/lib/submaster-constants";
import { listMasterOptions } from "@/lib/master-options";
import { listSubMasterOptions } from "@/lib/submaster-options";
import type { ProductCondition } from "@/lib/product-constants";
import { ProductModel, type ProductDocument } from "@/models/product";
import { VariantModel, type VariantDocument } from "@/models/variant";
import {
  MasterOptionModel,
  type MasterOptionDocument,
} from "@/models/master-option";
import {
  SubMasterOptionModel,
  type SubMasterOptionDocument,
} from "@/models/sub-master-option";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function isValidObjectId(value: string | undefined): value is string {
  return typeof value === "string" && objectIdRegex.test(value);
}

type LookupCaches = {
  masterLookup: Map<string, MasterOptionSummary>;
  subMasterLookup: Map<string, SubMasterOptionSummary>;
};

function mapMasterRecord(option: MasterOptionDocument): MasterOptionSummary {
  return {
    id: option._id.toString(),
    name: option.name ?? "",
    type: option.type as MasterOptionType,
    description: option.description ?? "",
    sortOrder: typeof option.sortOrder === "number" ? option.sortOrder : 0,
  };
}

function mapSubMasterRecord(
  subMaster: SubMasterOptionDocument,
  master?: MasterOptionSummary
): SubMasterOptionSummary {
  return {
    id: subMaster._id.toString(),
    masterId: subMaster.masterId.toString(),
    masterName: master?.name ?? "",
    masterType: subMaster.masterType as MasterOptionType,
    name: subMaster.name ?? "",
    parentId: subMaster.parentId ? subMaster.parentId.toString() : null,
    description: subMaster.description ?? "",
    sortOrder: typeof subMaster.sortOrder === "number" ? subMaster.sortOrder : 0,
  };
}

async function buildLookupCaches(
  products: ProductDocument[],
  variants: VariantDocument[]
): Promise<LookupCaches> {
  const masterIds = new Set<string>();
  const subMasterIds = new Set<string>();

  products.forEach((product) => {
    if (product.companyId) {
      masterIds.add(product.companyId.toString());
    }
    if (product.companySubmasterId) {
      subMasterIds.add(product.companySubmasterId.toString());
    }
  });

  variants.forEach((variant) => {
    const maybeAdd = (id: unknown) => {
      if (typeof id === "string") {
        masterIds.add(id);
      } else if (id && typeof (id as any).toString === "function") {
        masterIds.add((id as any).toString());
      }
    };
    maybeAdd(variant.processorId);
    maybeAdd(variant.ramId);
    maybeAdd(variant.storageId);
    maybeAdd(variant.graphicsId);
    maybeAdd(variant.osId);

    const maybeAddSub = (id: unknown) => {
      if (typeof id === "string") {
        subMasterIds.add(id);
      } else if (id && typeof (id as any).toString === "function") {
        subMasterIds.add((id as any).toString());
      }
    };
    maybeAddSub(variant.processorSubmasterId);
    maybeAddSub(variant.ramSubmasterId);
    maybeAddSub(variant.storageSubmasterId);
    maybeAddSub(variant.graphicsSubmasterId);
    maybeAddSub(variant.osSubmasterId);
  });

  const masterRecords = masterIds.size
    ? await MasterOptionModel.find({ _id: { $in: Array.from(masterIds) } })
        .select({ name: 1, type: 1, description: 1, sortOrder: 1 })
        .lean<MasterOptionDocument[]>()
    : [];

  const masterLookup = new Map<string, MasterOptionSummary>(
    masterRecords.map((record) => [record._id.toString(), mapMasterRecord(record)])
  );

  const subMasterRecords = subMasterIds.size
    ? await SubMasterOptionModel.find({ _id: { $in: Array.from(subMasterIds) } })
        .select({ name: 1, masterId: 1, masterType: 1, description: 1, sortOrder: 1 })
        .lean<SubMasterOptionDocument[]>()
    : [];

  const missingMasterIds = new Set<string>();
  subMasterRecords.forEach((record) => {
    const id = record.masterId?.toString?.();
    if (id && !masterLookup.has(id)) {
      missingMasterIds.add(id);
    }
  });

  if (missingMasterIds.size > 0) {
    const missingMasters = await MasterOptionModel.find({ _id: { $in: Array.from(missingMasterIds) } })
      .select({ name: 1, type: 1, description: 1, sortOrder: 1 })
      .lean<MasterOptionDocument[]>();
    missingMasters.forEach((record) => {
      masterLookup.set(record._id.toString(), mapMasterRecord(record));
    });
  }

  const subMasterLookup = new Map<string, SubMasterOptionSummary>();
  subMasterRecords.forEach((record) => {
    const master = masterLookup.get(record.masterId.toString());
    subMasterLookup.set(record._id.toString(), mapSubMasterRecord(record, master));
  });

  return { masterLookup, subMasterLookup };
}

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  originalPrice: number;
  discountedPrice: number | null;
  onSale: boolean;
  sku: string;
  stock: number;
  description: string;
  condition: ProductCondition;
  imageUrl: string | null;
  galleryImages: string[];
  richDescription: string | null;
  highlights: string[];
  featured: boolean;
  color: string | null;
  colors: string[];
  inStock: boolean;
  isDefault: boolean;
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

export interface ProductSummary {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number;
  discountedPrice: number | null;
  onSale: boolean;
  condition: ProductCondition;
  imageUrl: string | null;
  galleryImages: string[];
  richDescription: string | null;
  highlights: string[];
  featured: boolean;
  colors: string[];
  variants: ProductVariant[];
  inStock: boolean;
  sku: string;
  stock: number;
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
  companySubMasterId?: string;
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

function parseDateValue(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortSummaries(
  products: ProductSummary[],
  sort?: ListProductsOptions["sort"]
): ProductSummary[] {
  const sorted = [...products];
  sorted.sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.name.localeCompare(b.name) || parseDateValue(b.createdAt) - parseDateValue(a.createdAt);
      case "name-desc":
        return b.name.localeCompare(a.name) || parseDateValue(b.createdAt) - parseDateValue(a.createdAt);
      case "price-asc":
        return a.price - b.price || a.name.localeCompare(b.name);
      case "price-desc":
        return b.price - a.price || a.name.localeCompare(b.name);
      case "category-asc":
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      case "company-asc": {
        const companyA = a.company?.name ?? "";
        const companyB = b.company?.name ?? "";
        return companyA.localeCompare(companyB) || a.name.localeCompare(b.name);
      }
      case "processor-asc": {
        const processorA = a.processor?.name ?? "";
        const processorB = b.processor?.name ?? "";
        return processorA.localeCompare(processorB) || a.name.localeCompare(b.name);
      }
      case "ram-asc": {
        const ramA = a.ram?.name ?? "";
        const ramB = b.ram?.name ?? "";
        return ramA.localeCompare(ramB) || a.name.localeCompare(b.name);
      }
      case "storage-asc": {
        const storageA = a.storage?.name ?? "";
        const storageB = b.storage?.name ?? "";
        return storageA.localeCompare(storageB) || a.name.localeCompare(b.name);
      }
      case "created-desc":
      default: {
        const featuredDelta = Number(b.featured) - Number(a.featured);
        if (featuredDelta !== 0) {
          return featuredDelta;
        }
        return parseDateValue(b.createdAt) - parseDateValue(a.createdAt);
      }
    }
  });
  return sorted;
}

function mapVariantDocument(variant: VariantDocument, lookups: LookupCaches): ProductVariant {
  const rawPrice = Number.isFinite(Number((variant as any)?.price))
    ? Math.max(0, Number((variant as any)?.price))
    : 0;
  const originalPrice = Number.isFinite(Number((variant as any)?.originalPrice))
    ? Math.max(0, Number((variant as any)?.originalPrice))
    : rawPrice;
  const discountedPriceRaw = Number.isFinite(Number((variant as any)?.discountedPrice))
    ? Math.max(0, Number((variant as any)?.discountedPrice))
    : null;
  const discountedPrice =
    discountedPriceRaw !== null && discountedPriceRaw > 0 ? discountedPriceRaw : null;
  const onSale =
    Boolean((variant as any)?.onSale) &&
    discountedPrice !== null &&
    discountedPrice < originalPrice;
  const price = onSale && discountedPrice !== null ? discountedPrice : rawPrice;
  const stock =
    Number.isFinite(Number((variant as any)?.stock)) && Number((variant as any)?.stock) >= 0
      ? Number((variant as any)?.stock)
      : 0;
  const color =
    typeof variant.color === "string" && variant.color.trim().length > 0
      ? variant.color.trim()
      : null;
  const imageUrl =
    typeof (variant as any).imageUrl === "string" && (variant as any).imageUrl.trim().length > 0
      ? (variant as any).imageUrl.trim()
      : null;
  const galleryImages = Array.isArray((variant as any).galleryImages)
    ? (variant as any).galleryImages
        .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
        .filter((item: string, index: number, arr: string[]) => item.length > 0 && arr.indexOf(item) === index)
    : [];
  const highlights = Array.isArray((variant as any).highlights)
    ? (variant as any).highlights
        .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
        .filter((item: string, index: number, arr: string[]) => item.length > 0 && arr.indexOf(item) === index)
    : [];
  const richDescription =
    typeof (variant as any).richDescription === "string" && (variant as any).richDescription.trim().length > 0
      ? (variant as any).richDescription.trim()
      : null;
  const description = typeof (variant as any).description === "string" ? (variant as any).description.trim() : "";
  const condition =
    typeof (variant as any).condition === "string"
      ? ((variant as any).condition as ProductCondition)
      : ("refurbished" as ProductCondition);
  const colors =
    Array.isArray((variant as any).colors)
      ? (variant as any).colors
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter((item: string, index: number, arr: string[]) => item.length > 0 && arr.indexOf(item) === index)
      : [];
  const sku =
    typeof (variant as any).sku === "string" && (variant as any).sku.trim().length > 0
      ? (variant as any).sku.trim()
      : "";
  const inStock =
    typeof (variant as any).inStock === "boolean" ? (variant as any).inStock : stock > 0;
  const featured = Boolean((variant as any).featured);
  const buildMasterSummary = (
    id: mongoose.Types.ObjectId | string | undefined,
    type: MasterOptionType
  ): MasterOptionSummary | null => {
    if (!id) {
      return null;
    }
    const key = typeof id === "string" ? id : id.toString();
    return (
      lookups.masterLookup.get(key) ?? {
        id: key,
        name: "",
        type,
      }
    );
  };
  const getSubMaster = (
    id: mongoose.Types.ObjectId | string | undefined
  ): SubMasterOptionSummary | null => {
    if (!id) {
      return null;
    }
    const key = typeof id === "string" ? id : id.toString();
    return lookups.subMasterLookup.get(key) ?? null;
  };

  return {
    id: variant._id.toString(),
    label: typeof variant.label === "string" ? variant.label.trim() : "",
    price,
    originalPrice,
    discountedPrice,
    onSale,
    sku,
    stock,
    description,
    condition,
    imageUrl,
    galleryImages,
    richDescription,
    highlights,
    featured,
    color,
    colors,
    inStock,
    isDefault: Boolean(variant.isDefault),
    processor: buildMasterSummary(variant.processorId, "processor"),
    processorSubmaster: getSubMaster(variant.processorSubmasterId),
    ram: buildMasterSummary(variant.ramId, "ram"),
    ramSubmaster: getSubMaster(variant.ramSubmasterId),
    storage: buildMasterSummary(variant.storageId, "storage"),
    storageSubmaster: getSubMaster(variant.storageSubmasterId),
    graphics: buildMasterSummary(variant.graphicsId, "graphics"),
    graphicsSubmaster: getSubMaster(variant.graphicsSubmasterId),
    os: buildMasterSummary(variant.osId, "os"),
    osSubmaster: getSubMaster(variant.osSubmasterId),
  };
}

function buildFallbackVariant(product: ProductDocument): ProductVariant {
  return {
    id: `${product._id.toString()}-base`,
    label: "Base configuration",
    price: 0,
    originalPrice: 0,
    discountedPrice: null,
    onSale: false,
    sku: "",
    stock: 0,
    description: "",
    condition: "refurbished",
    imageUrl: null,
    galleryImages: [],
    richDescription: null,
    highlights: [],
    featured: false,
    color: null,
    colors: [],
    inStock: false,
    isDefault: true,
    processor: null,
    processorSubmaster: null,
    ram: null,
    ramSubmaster: null,
    storage: null,
    storageSubmaster: null,
    graphics: null,
    graphicsSubmaster: null,
    os: null,
    osSubmaster: null,
  };
}

function mapVariantsForProduct(
  product: ProductDocument,
  variantDocs: VariantDocument[] | undefined,
  lookups: LookupCaches
): ProductVariant[] {
  const variants = Array.isArray(variantDocs) && variantDocs.length > 0
    ? variantDocs.map((doc) => mapVariantDocument(doc, lookups))
    : [buildFallbackVariant(product)];

  const hasDefault = variants.some((variant) => variant.isDefault);
  if (!hasDefault && variants.length > 0) {
    variants[0].isDefault = true;
  }

  const defaultIndex = variants.findIndex((variant) => variant.isDefault);
  const defaultVariant = defaultIndex >= 0 ? variants[defaultIndex] : variants[0];
  const normalizedProductName = product.name?.trim();
  if (defaultVariant && normalizedProductName) {
    variants[defaultIndex >= 0 ? defaultIndex : 0] = {
      ...defaultVariant,
      label: normalizedProductName,
    };
  }

  return variants;
}

function mapProduct(
  product: ProductDocument,
  variants: ProductVariant[],
  lookups: LookupCaches
): ProductSummary {
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];
  const imageUrl = defaultVariant?.imageUrl?.trim?.() ?? "";
  const galleryImages = Array.isArray(defaultVariant?.galleryImages)
    ? (defaultVariant?.galleryImages ?? []).filter((item): item is string => Boolean(item && item.trim()))
    : [];
  const richDescription = defaultVariant?.richDescription?.trim?.() ?? "";
  const highlights = Array.isArray(defaultVariant?.highlights)
    ? (defaultVariant?.highlights ?? []).filter((item): item is string => Boolean(item && item.trim()))
    : [];
  const colors = variants
    .flatMap((variant) => {
      const entries: string[] = [];
      if (variant.color) {
        entries.push(variant.color);
      }
      if (Array.isArray(variant.colors)) {
        entries.push(...variant.colors);
      }
      return entries;
    })
    .map((item) => item.trim())
    .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);
  const createdAt = product.createdAt ? product.createdAt.toISOString() : new Date().toISOString();
  const updatedAt = product.updatedAt ? product.updatedAt.toISOString() : createdAt;
  const inStock =
    variants.some((variant) => variant.inStock && variant.stock > 0) || Boolean(defaultVariant?.inStock);
  const featured = variants.some((variant) => variant.featured);
  const company = product.companyId
    ? lookups.masterLookup.get(product.companyId.toString()) ?? {
        id: product.companyId.toString(),
        name: "",
        type: "company" as MasterOptionType,
      }
    : null;
  const companySubmaster = product.companySubmasterId
    ? lookups.subMasterLookup.get(product.companySubmasterId.toString()) ?? null
    : null;

  return {
    id: product._id.toString(),
    name: product.name,
    category: product.category,
    description: defaultVariant?.description ?? "",
    price: defaultVariant?.price ?? 0,
    originalPrice: defaultVariant?.originalPrice ?? defaultVariant?.price ?? 0,
    discountedPrice: defaultVariant?.discountedPrice ?? null,
    onSale: Boolean(defaultVariant?.onSale),
    condition: defaultVariant?.condition ?? ("refurbished" as ProductCondition),
    imageUrl: imageUrl || null,
    galleryImages,
    richDescription: richDescription || null,
    highlights,
    featured,
    variants,
    colors,
    inStock,
    sku: defaultVariant?.sku ?? "",
    stock: defaultVariant?.stock ?? 0,
    createdAt,
    updatedAt,
    company,
    companySubmaster,
    processor: defaultVariant?.processor ?? null,
    processorSubmaster: defaultVariant?.processorSubmaster ?? null,
    ram: defaultVariant?.ram ?? null,
    ramSubmaster: defaultVariant?.ramSubmaster ?? null,
    storage: defaultVariant?.storage ?? null,
    storageSubmaster: defaultVariant?.storageSubmaster ?? null,
    graphics: defaultVariant?.graphics ?? null,
    graphicsSubmaster: defaultVariant?.graphicsSubmaster ?? null,
    os: defaultVariant?.os ?? null,
    osSubmaster: defaultVariant?.osSubmaster ?? null,
  };
}

export async function listProducts(options: ListProductsOptions = {}): Promise<ProductSummary[]> {
  await connectDB();

  const filters: FilterQuery<ProductDocument> = {};
  if (options.category && options.category !== "all") {
    filters.category = options.category;
  }

  if (isValidObjectId(options.companyId)) {
    filters.companyId = options.companyId;
  }
  if (isValidObjectId(options.companySubMasterId)) {
    filters.companySubmasterId = options.companySubMasterId;
  }

  let query = ProductModel.find(filters).sort({ createdAt: -1 });
  const limit =
    typeof options.limit === "number" && Number.isFinite(options.limit) ? Math.max(0, options.limit) : undefined;
  if (typeof limit === "number" && limit > 0) {
    query = query.limit(limit * 3);
  }

  const products = (await query.lean()) as unknown as ProductDocument[];
  const productIds = products.map((product) => product._id);
  const variantDocs = productIds.length
    ? await VariantModel.find({ productId: { $in: productIds } })
        .sort({ isDefault: -1, price: 1 })
        .lean<VariantDocument[]>()
    : [];
  const lookups = await buildLookupCaches(products, variantDocs);

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

  const processorFilterId = isValidObjectId(options.processorId) ? options.processorId : undefined;
  const ramFilterId = isValidObjectId(options.ramId) ? options.ramId : undefined;
  const storageFilterId = isValidObjectId(options.storageId) ? options.storageId : undefined;
  const graphicsFilterId = isValidObjectId(options.graphicsId) ? options.graphicsId : undefined;
  const osFilterId = isValidObjectId(options.osId) ? options.osId : undefined;

  const needsVariantFiltering =
    Boolean(processorFilterId) ||
    Boolean(ramFilterId) ||
    Boolean(storageFilterId) ||
    Boolean(graphicsFilterId) ||
    Boolean(osFilterId);

  const masterFilters: MasterOptionType[] = [];
  if (processorFilterId) masterFilters.push("processor");
  if (ramFilterId) masterFilters.push("ram");
  if (storageFilterId) masterFilters.push("storage");
  if (graphicsFilterId) masterFilters.push("graphics");
  if (osFilterId) masterFilters.push("os");

  const masterOptionsForFilter = needsVariantFiltering ? await listMasterOptions(masterFilters) : [];

  const filterOptionNameById = new Map(masterOptionsForFilter.map((item) => [item.id, item.name ?? ""]));

  const matchesOption = (
    selectedId: string | undefined,
    option: MasterOptionSummary | null | undefined
  ) => {
    if (!selectedId) {
      return true;
    }
    if (!option) {
      return false;
    }
    if (option.id === selectedId) {
      return true;
    }
    const targetName = filterOptionNameById.get(selectedId)?.trim().toLowerCase();
    if (!targetName) {
      return false;
    }
    return (option.name ?? "").trim().toLowerCase() === targetName;
  };

  const normalizedSearch = options.search?.trim().toLowerCase();
  const minPrice =
    typeof options.minPrice === "number" && !Number.isNaN(options.minPrice)
      ? Math.max(0, options.minPrice)
      : null;
  const maxPrice =
    typeof options.maxPrice === "number" && !Number.isNaN(options.maxPrice)
      ? Math.max(0, options.maxPrice)
      : null;

  const summaries = products.map((product) => {
    const variants = mapVariantsForProduct(product, variantMap.get(product._id.toString()), lookups);
    return mapProduct(product, variants, lookups);
  });

  const filtered = summaries.filter((summary) => {
    if (options.featuredOnly && !summary.featured) {
      return false;
    }
    if (options.inStockOnly && !summary.inStock) {
      return false;
    }
    if (options.condition && options.condition !== "all") {
      const conditionMatches = summary.variants.some((variant) => variant.condition === options.condition);
      if (!conditionMatches) {
        return false;
      }
    }

    const variantPrices = summary.variants
      .map((variant) => variant.price)
      .filter((value) => typeof value === "number" && !Number.isNaN(value));
    const comparablePrice = variantPrices.length > 0 ? Math.min(...variantPrices) : summary.price;
    if (minPrice !== null && comparablePrice < minPrice) {
      return false;
    }
    if (maxPrice !== null && comparablePrice > maxPrice) {
      return false;
    }

    const optionMatches = summary.variants.some(
      (variant) =>
        matchesOption(processorFilterId, variant.processor) &&
        matchesOption(ramFilterId, variant.ram) &&
        matchesOption(storageFilterId, variant.storage) &&
        matchesOption(graphicsFilterId, variant.graphics) &&
        matchesOption(osFilterId, variant.os)
    );

    if (!optionMatches) {
      return false;
    }

    if (normalizedSearch) {
      const haystack = [
        summary.name,
        summary.category,
        summary.company?.name ?? "",
        summary.description,
        summary.richDescription ?? "",
        ...summary.highlights,
        ...summary.variants.map((variant) => variant.label),
      ];

      const hasMatch = haystack.some(
        (value) => typeof value === "string" && value.toLowerCase().includes(normalizedSearch)
      );
      if (!hasMatch) {
        return false;
      }
    }

    return true;
  });

  const sorted = sortSummaries(filtered, options.sort);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
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
  const lookups = await buildLookupCaches([product], variantDocs);
  const variants = mapVariantsForProduct(product, variantDocs, lookups);

  return mapProduct(product, variants, lookups);
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
  companySubMasters: SubMasterOptionSummary[];
}

export async function getProductFacets(): Promise<ProductFacets> {
  await connectDB();
  const [categories, conditions, priceExtremes, masterOptions, companySubMasters] = await Promise.all([
    ProductModel.distinct("category") as Promise<string[]>,
    VariantModel.distinct("condition") as Promise<ProductCondition[]>,
    VariantModel.aggregate<{ minPrice: number; maxPrice: number }>([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]),
    listMasterOptions(["company", "processor", "ram", "storage", "graphics", "os"]),
    listSubMasterOptions({ types: ["company"] }),
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
    companySubMasters,
  };
}
