import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { productConditions } from "@/lib/product-constants";
import { ProductModel } from "@/models/product";
import { CategoryModel } from "@/models/category";

const seedCategories = [
  "Laptops",
  "Desktops",
  "Tablets",
  "Accessories",
  "Networking",
  "Audio",
  "Monitors",
  "Servers",
];

const highlightPool = [
  "Battery health above 85%",
  "Latest firmware applied",
  "Fresh thermal paste and cleaning",
  "SSD storage upgrade included",
  "Ships with genuine charger",
  "Undergoes 50-point QA testing",
  "Comes with 6-month warranty",
  "Ready for enterprise deployment",
];

function buildHighlights(index: number) {
  const highlights: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const highlight = highlightPool[(index + i) % highlightPool.length];
    highlights.push(highlight);
  }
  return highlights;
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

    const batchId = Date.now();

    await Promise.all(
      seedCategories.map((name) =>
        CategoryModel.updateOne(
          { name },
          {
            $setOnInsert: {
              description: `${name} devices available through Rajesh Control's refurbishment programme.`,
            },
          },
          { upsert: true },
        ),
      ),
    );

    const dummyProducts = Array.from({ length: 50 }, (_, index) => {
      const categoryName = seedCategories[index % seedCategories.length];
      const condition = productConditions[index % productConditions.length];
      const productNumber = index + 1;
      const name = `${categoryName} Batch ${batchId}-${productNumber}`;
      const price = Math.round(18000 + index * 550 + (index % 7) * 950);
      const description = `${name} has been professionally refurbished with genuine parts, endurance tested, and prepared for instant deployment in business environments.`;
      const imageUrl = `https://picsum.photos/seed/rajesh-${batchId}-${productNumber}/800/600`;
      const highlights = buildHighlights(index);
      const featured = index % 10 === 0;
      const inStock = index % 6 !== 0;

      return {
        name,
        category: categoryName,
        description,
        price,
        condition,
        imageUrl,
        featured,
        inStock,
        highlights,
      };
    });

    await ProductModel.insertMany(dummyProducts, { ordered: false });

    return NextResponse.json(
      { message: `Created ${dummyProducts.length} dummy products` },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to seed products", error);
    return NextResponse.json({ error: "Unable to seed products" }, { status: 500 });
  }
}
