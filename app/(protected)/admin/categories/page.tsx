import { Metadata } from "next";

import { CategoriesTable } from "@/components/admin/categories-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategories } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categories | Rajesh Control",
};

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground">Category library</h1>
        <p className="max-w-2xl text-muted-foreground">
          Track the distribution of devices across product categories. Use search and sorting to surface
          focus areas for merchandising or sourcing.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">All categories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each category aggregates the latest product count and refresh timestamp from the catalogue.
          </p>
        </CardHeader>
        <CardContent>
          <CategoriesTable data={categories} />
        </CardContent>
      </Card>
    </section>
  );
}
