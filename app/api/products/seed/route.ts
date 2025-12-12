import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { createDummyProductBatch, dummySeedCategories } from "@/lib/dummy-products";
import { replaceProductVariants, type VariantInput } from "@/lib/product-variants";
import { CategoryModel } from "@/models/category";
import { MasterOptionModel } from "@/models/master-option";
import { ProductModel } from "@/models/product";
import { VariantModel } from "@/models/variant";

const masterSeeds = {
  company: ["Dell", "HP", "Lenovo", "Apple", "ASUS", "Acer", "Microsoft", "Logitech"],
  processor: ["Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M2"],
  ram: ["8GB DDR4", "16GB DDR4", "32GB DDR4", "16GB LPDDR5", "32GB LPDDR5"],
  storage: ["256GB SSD", "512GB SSD", "1TB SSD"],
  graphics: ["Intel Iris", "Intel UHD", "NVIDIA RTX 3050", "NVIDIA RTX 3060", "Apple Integrated"],
  os: ["Windows 11 Pro", "Windows 11 Home", "macOS Ventura", "Ubuntu 22.04"],
} as const;

const curatedProducts = [
  {
    name: "Dell Latitude 7420",
    category: "Laptops",
    description: 'Enterprise-grade 14" laptop with strong battery life and build.',
    price: 68000,
    condition: "refurbished",
    imageUrl: "https://images.example.com/dell-latitude.jpg",
    company: "Dell",
    processor: "Intel Core i7",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    os: "Windows 11 Pro",
    stock: 12,
    sku: "DELL-7420-BASE",
  },
  {
    name: "Lenovo ThinkPad X1 Carbon",
    category: "Laptops",
    description: "Lightweight flagship ThinkPad with premium keyboard and durability.",
    price: 92000,
    condition: "refurbished",
    imageUrl: "https://images.example.com/thinkpad-x1.jpg",
    company: "Lenovo",
    processor: "Intel Core i7",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    os: "Windows 11 Pro",
    stock: 15,
    sku: "LENOVO-X1-BASE",
  },
  {
    name: "HP EliteBook 840 G8",
    category: "Laptops",
    description: "Business ultrabook with excellent IO and security features.",
    price: 74000,
    condition: "refurbished",
    imageUrl: "https://images.example.com/elitebook-840.jpg",
    company: "HP",
    processor: "Intel Core i5",
    ram: "8GB DDR4",
    storage: "256GB SSD",
    os: "Windows 11 Pro",
    stock: 10,
    sku: "HP-840G8-BASE",
  },
  {
    name: 'Apple MacBook Pro 14"',
    category: "Laptops",
    description: "Apple M2 powered 14-inch Pro with stunning display.",
    price: 168000,
    condition: "new",
    imageUrl: "https://images.example.com/mbp-14.jpg",
    company: "Apple",
    processor: "Apple M2",
    ram: "16GB LPDDR5",
    storage: "512GB SSD",
    os: "macOS Ventura",
    stock: 8,
    sku: "APPLE-MBP14-BASE",
  },
  {
    name: "Lenovo USB-C 65W Charger",
    category: "Accessories",
    description: "Universal 65W USB-C charger compatible with most laptops.",
    price: 3500,
    condition: "new",
    imageUrl: "https://images.example.com/lenovo-charger.jpg",
    company: "Lenovo",
    os: "Windows 11 Pro",
    stock: 30,
    sku: "LEN-CHARGER-65W",
  },
  {
    name: "Logitech MX Master 3S Mouse",
    category: "Accessories",
    description: "Ergonomic wireless mouse with MagSpeed scroll wheel.",
    price: 8990,
    condition: "new",
    imageUrl: "https://images.example.com/logitech-mx.jpg",
    company: "Logitech",
    os: "Windows 11 Pro",
    stock: 25,
    sku: "LOGI-MX3S",
  },
] as const;

function getIsTestEnv() {
  return typeof process !== "undefined" && (process.env.VITEST || process.env.VITEST_WORKER_ID);
}

async function seedMasters() {
  const entries = Object.entries(masterSeeds) as Array<[keyof typeof masterSeeds, string[]]>;
  for (const [type, values] of entries) {
    const operations = values.map((name, index) =>
      MasterOptionModel.updateOne(
        { type, name },
        { $setOnInsert: { type, name, sortOrder: index } },
        { upsert: true },
      ),
    );
    await Promise.all(operations);
  }
}

async function buildMasterLookup() {
  const docs = await MasterOptionModel.find().lean();
  const map = new Map<string, string>();
  docs.forEach((doc) => {
    if (doc.type && doc.name && doc._id) {
      map.set(`${doc.type}:${doc.name}`, doc._id.toString());
    }
  });
  return map;
}

async function seedCuratedProducts() {
  const masterLookup = await buildMasterLookup();

  for (const product of curatedProducts) {
    const companyId = masterLookup.get(`company:${product.company ?? ""}`) ?? null;
    const processorId = product.processor ? masterLookup.get(`processor:${product.processor}`) ?? null : null;
    const ramId = product.ram ? masterLookup.get(`ram:${product.ram}`) ?? null : null;
    const storageId = product.storage ? masterLookup.get(`storage:${product.storage}`) ?? null : null;
    const osId = product.os ? masterLookup.get(`os:${product.os}`) ?? null : null;

    const productDoc = await ProductModel.findOneAndUpdate(
      { name: product.name },
      {
        $setOnInsert: {
          name: product.name,
          category: product.category,
          companyId,
        },
      },
      { new: true, upsert: true }
    );

    if (!productDoc) {
      continue;
    }

    const variant: VariantInput = {
      label: "Base configuration",
      price: product.price,
      description: product.description,
      condition: product.condition,
      sku: product.sku ?? "",
      stock: product.stock ?? 0,
      processorId: processorId ?? undefined,
      ramId: ramId ?? undefined,
      storageId: storageId ?? undefined,
      graphicsId: undefined,
      osId: osId ?? undefined,
      imageUrl: product.imageUrl,
      galleryImages: [],
      richDescription: "",
      highlights: ["Warranty included", "Quality inspected"],
      featured: true,
      inStock: (product.stock ?? 0) > 0,
      isDefault: true,
    };

    await replaceProductVariants(productDoc._id.toString(), [variant]);
  }
}

async function backfillBaseVariantsForProducts() {
  const productIdsWithVariants = await VariantModel.distinct("productId");
  const productsNeedingVariants = await ProductModel.find({
    _id: { $nin: productIdsWithVariants },
  })
    .select({
      _id: 1,
      name: 1,
    })
    .lean();

  const tasks = productsNeedingVariants.map((product) => {
    const baseVariant: VariantInput = {
      label: "Base configuration",
      price: 0,
      description: `${product.name ?? "Product"} base variant`,
      condition: "refurbished",
      sku: `SKU-${product._id.toString()}`,
      stock: 0,
      imageUrl: "",
      galleryImages: [],
      richDescription: "",
      highlights: [],
      featured: false,
      inStock: false,
      isDefault: true,
    };

    return replaceProductVariants(product._id.toString(), [baseVariant]);
  });

  await Promise.all(tasks);
}

export async function POST() {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (actor.role !== "admin" && actor.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const isTest = getIsTestEnv();

    if (!isTest) {
      await seedMasters();
    }

    const categoryOps = dummySeedCategories.map((category) =>
      CategoryModel.updateOne(
        { name: category },
        { $setOnInsert: { name: category, description: `${category} products` } },
        { upsert: true },
      ),
    );
    await Promise.all(categoryOps);

    if (!isTest) {
      await seedCuratedProducts();
    }

    const batchId = Date.now();
    const products = createDummyProductBatch(50, batchId);
    const bulkOps = products.map((product) => ({
      updateOne: {
        filter: { name: product.name },
        update: {
          $setOnInsert: {
            name: product.name,
            category: product.category,
            companyId: null,
            companySubmasterId: null,
          },
        },
        upsert: true,
      },
    }));

    const result = await ProductModel.bulkWrite(bulkOps, { ordered: false });
    const productDocs = await ProductModel.find({ name: { $in: products.map((item) => item.name) } })
      .select({ _id: 1, name: 1 })
      .lean();

    const dummyByName = new Map(products.map((product) => [product.name, product]));
    const variantTasks = productDocs
      .map((doc) => {
        const source = dummyByName.get(doc.name);
        if (!source) {
          return null;
        }
        const variant: VariantInput = {
          label: "Base configuration",
          price: source.price,
          description: source.description,
          condition: source.condition,
          sku: source.sku ?? "",
          stock: source.stock ?? 0,
          imageUrl: source.imageUrl,
          galleryImages: [],
          richDescription: "",
          highlights: source.highlights ?? [],
          featured: source.featured ?? false,
          inStock: source.inStock ?? true,
          isDefault: true,
        };
        return replaceProductVariants(doc._id.toString(), [variant]);
      })
      .filter((task): task is ReturnType<typeof replaceProductVariants> => Boolean(task));

    if (variantTasks.length > 0) {
      await Promise.all(variantTasks);
    }

    await backfillBaseVariantsForProducts();
    const inserted = result.upsertedCount ?? 0;
    const matched = result.matchedCount ?? 0;

    const status = inserted > 0 ? 201 : 200;
    const message = inserted > 0 ? `Created ${inserted} dummy products` : "Dummy products already exist";

    return NextResponse.json({ message, batchId, inserted, matched }, { status });
  } catch (error) {
    console.error("Seed products failed", error);
    return NextResponse.json({ error: "Unable to seed products" }, { status: 500 });
  }
}
