import { connectDB } from "@/lib/db";
import { ProductModel } from "@/models/product";
import { CategoryModel, type CategoryDocument } from "@/models/category";

export interface CategorySummary {
  id: string;
  name: string;
  description: string;
  productCount: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductCategoryStat {
  _id: string | null;
  productCount: number;
  lastUpdated: Date | null;
}

export async function listCategories(): Promise<CategorySummary[]> {
  await connectDB();

  const [categories, stats] = await Promise.all([
    CategoryModel.find().sort({ name: 1 }).lean<CategoryDocument[]>(),
    ProductModel.aggregate<ProductCategoryStat>([
      {
        $group: {
          _id: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$category", null] },
                  { $eq: ["$category", ""] },
                ],
              },
              then: "Uncategorized",
              else: "$category",
            },
          },
          productCount: { $sum: 1 },
          lastUpdated: { $max: { $ifNull: ["$updatedAt", "$createdAt"] } },
        },
      },
    ]).exec(),
  ]);

  const statMap = new Map<string, ProductCategoryStat>();
  for (const stat of stats ?? []) {
    if (typeof stat._id === "string" && stat._id.length > 0) {
      statMap.set(stat._id, stat);
    }
  }

  return (categories ?? []).map((category) => {
    const stat = statMap.get(category.name);
    const createdAt = category.createdAt ? category.createdAt.toISOString() : new Date().toISOString();
    const updatedAt = category.updatedAt ? category.updatedAt.toISOString() : createdAt;
    return {
      id: category._id.toString(),
      name: category.name,
      description: category.description ?? "",
      productCount: stat?.productCount ?? 0,
      lastUpdated: stat?.lastUpdated?.toISOString() ?? updatedAt,
      createdAt,
      updatedAt,
    };
  });
}

export async function getCategoryById(id: string): Promise<CategorySummary | null> {
  await connectDB();
  const category = await CategoryModel.findById(id).lean<CategoryDocument | null>();
  if (!category) {
    return null;
  }

  const createdAt = category.createdAt ? category.createdAt.toISOString() : new Date().toISOString();
  const updatedAt = category.updatedAt ? category.updatedAt.toISOString() : createdAt;

  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description ?? "",
    productCount: 0,
    lastUpdated: updatedAt,
    createdAt,
    updatedAt,
  };
}
