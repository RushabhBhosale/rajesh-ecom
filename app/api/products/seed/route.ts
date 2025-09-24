import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { createDummyProductBatch, dummySeedCategories } from "@/lib/dummy-products";
import { ProductModel } from "@/models/product";
import { CategoryModel } from "@/models/category";

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

    await Promise.all(
      dummySeedCategories.map((name) =>
        CategoryModel.updateOne(
          { name },
          {
            $setOnInsert: {
              name,
              description: `${name} devices available through Rajesh Control's refurbishment programme.`,
            },
          },
          { upsert: true },
        ),
      ),
    );

    const batchId = Date.now();
    const dummyProducts = createDummyProductBatch(50, batchId);

    const operations = dummyProducts.map((product) => ({
      updateOne: {
        filter: { name: product.name },
        update: { $setOnInsert: product },
        upsert: true,
      },
    }));

    const result = await ProductModel.bulkWrite(operations, { ordered: false });
    const inserted = result.upsertedCount ?? 0;
    const message =
      inserted > 0
        ? `Created ${inserted} dummy products`
        : "Dummy products already exist";

    return NextResponse.json(
      {
        message,
        batchId,
        inserted,
        matched: result.matchedCount ?? 0,
      },
      { status: inserted > 0 ? 201 : 200 },
    );
  } catch (error) {
    console.error("Failed to seed products", error);
    return NextResponse.json({ error: "Unable to seed products" }, { status: 500 });
  }
}
