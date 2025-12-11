import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const connectDB = vi.fn();
const getCurrentUser = vi.fn();
const updateOne = vi.fn(() => Promise.resolve({ acknowledged: true }));
const bulkWrite = vi.fn();
const find = vi.fn(() =>
  ({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
  }) as any,
);
const createDummyProductBatch = vi.fn();
const replaceProductVariants = vi.fn();
const variantDistinct = vi.fn(() => Promise.resolve([]));

vi.mock("@/lib/auth", () => ({
  getCurrentUser,
}));

vi.mock("@/lib/db", () => ({
  connectDB,
}));

vi.mock("@/lib/dummy-products", () => ({
  createDummyProductBatch,
  dummySeedCategories: ["Laptops", "Desktops"],
}));

vi.mock("@/lib/product-variants", () => ({
  replaceProductVariants,
}));

vi.mock("@/models/category", () => ({
  CategoryModel: {
    updateOne,
  },
}));

vi.mock("@/models/product", () => ({
  ProductModel: {
    bulkWrite,
    find,
  },
}));

vi.mock("@/models/variant", () => ({
  VariantModel: {
    distinct: variantDistinct,
  },
}));

describe("POST /api/products/seed", () => {
  let seedProducts: typeof import("@/app/api/products/seed/route") extends infer T
    ? T extends { POST: infer P }
      ? P
      : never
    : never;

  beforeAll(async () => {
    ({ POST: seedProducts } = await import("@/app/api/products/seed/route"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    replaceProductVariants.mockResolvedValue([]);
    variantDistinct.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates dummy products with bulk upsert for admins", async () => {
    getCurrentUser.mockResolvedValueOnce({ role: "admin" });
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const products = [
      {
        name: "Laptops Batch 1700000000000-1",
        category: "Laptops",
        description: "Laptop description",
        price: 12500,
        condition: "refurbished",
        imageUrl: "https://example.com/laptops.jpg",
        featured: false,
        inStock: true,
        highlights: ["Point A", "Point B"],
      },
      {
        name: "Desktops Batch 1700000000000-2",
        category: "Desktops",
        description: "Desktop description",
        price: 18900,
        condition: "new",
        imageUrl: "https://example.com/desktops.jpg",
        featured: true,
        inStock: false,
        highlights: ["Point C", "Point D"],
      },
    ];
    createDummyProductBatch.mockReturnValueOnce(products);
    bulkWrite.mockResolvedValueOnce({ upsertedCount: 2, matchedCount: 0 });

    const response = await seedProducts();
    const body = await response.json();

    expect(connectDB).toHaveBeenCalled();
    expect(updateOne).toHaveBeenCalledTimes(2);
    expect(updateOne).toHaveBeenCalledWith(
      { name: "Laptops" },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          name: "Laptops",
        }),
      }),
      { upsert: true },
    );
    expect(updateOne).toHaveBeenCalledWith(
      { name: "Desktops" },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          name: "Desktops",
        }),
      }),
      { upsert: true },
    );

    expect(createDummyProductBatch).toHaveBeenCalledWith(50, 1_700_000_000_000);
    expect(bulkWrite).toHaveBeenCalledWith(
      products.map((product) => ({
        updateOne: {
          filter: { name: product.name },
          update: { $setOnInsert: product },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    expect(response.status).toBe(201);
    expect(body).toEqual({
      message: "Created 2 dummy products",
      batchId: 1_700_000_000_000,
      inserted: 2,
      matched: 0,
    });

    nowSpy.mockRestore();
  });

  it("returns success without inserting duplicates", async () => {
    getCurrentUser.mockResolvedValueOnce({ role: "superadmin" });
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_123);
    const products = [
      {
        name: "Laptops Batch 1700000000123-1",
        category: "Laptops",
        description: "Laptop description",
        price: 12500,
        condition: "refurbished",
        imageUrl: "https://example.com/laptops.jpg",
        featured: false,
        inStock: true,
        highlights: ["Point A", "Point B"],
      },
    ];
    createDummyProductBatch.mockReturnValueOnce(products);
    bulkWrite.mockResolvedValueOnce({ upsertedCount: 0, matchedCount: 1 });

    const response = await seedProducts();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: "Dummy products already exist",
      batchId: 1_700_000_000_123,
      inserted: 0,
      matched: 1,
    });

    nowSpy.mockRestore();
  });
});
