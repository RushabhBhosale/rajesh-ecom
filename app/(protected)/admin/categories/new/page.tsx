import Link from "next/link";
import { Metadata } from "next";

import { CategoryForm } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Add category | Rajesh Control",
};

export default function NewCategoryPage() {
  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">Create a category</h1>
          <p className="max-w-2xl text-muted-foreground">
            Define a category before adding products so the catalogue stays organised and easier to browse.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/categories">Back to categories</Link>
        </Button>
      </div>
      <CategoryForm redirectTo="/admin/categories" />
    </section>
  );
}
