import { connectDB } from "@/lib/db";
import { ProductModel } from "@/models/product";

export interface CategorySummary {
  name: string;
  productCount: number;
  lastUpdated: string;
}

interface RawCategorySummary {
  name: string;
  productCount: number;
  lastUpdated: Date | null;
}

export async function listCategories(): Promise<CategorySummary[]> {
  await connectDB();

  const categories = (await ProductModel.aggregate<RawCategorySummary>([
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
    {
      $project: {
        _id: 0,
        name: "$_id",
        productCount: 1,
        lastUpdated: 1,
      },
    },
    { $sort: { name: 1 } },
  ]).exec()) ?? [];

  return categories.map((category) => ({
    name: category.name,
    productCount: category.productCount,
    lastUpdated: (category.lastUpdated ?? new Date()).toISOString(),
  }));
}
