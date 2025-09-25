import Link from "next/link";
import { Metadata } from "next";

import { CategoriesTable } from "@/components/admin/categories-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategories } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categories | Rajesh Control",
};

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">
            Category library
          </h1>
        </div>
        <Button asChild size="lg" className="sm:ml-auto">
          <Link href="/admin/categories/new">Add category</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            All categories
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Category records are maintained separately so teams can prepare the
            taxonomy before adding products.
          </p>
        </CardHeader>
        <CardContent>
          <CategoriesTable data={categories} />
        </CardContent>
      </Card>
    </section>
  );
}
