import { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/categories/category-form";
import { getCategoryById } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Edit category | Rajesh Control",
};

export default async function EditCategoryPage({ params }: { params: { categoryId: string } }) {
  const category = await getCategoryById(params.categoryId);

  if (!category) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Edit category</h1>
        <p className="text-sm text-muted-foreground">
          Update category name or description and keep your taxonomy tidy.
        </p>
      </div>
      <CategoryForm
        redirectTo="/admin/categories"
        mode="edit"
        categoryId={category.id}
        initialValues={{
          name: category.name,
          description: category.description,
        }}
      />
    </section>
  );
}
