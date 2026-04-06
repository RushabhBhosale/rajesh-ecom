import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { listCategories } from "@/lib/categories";
import { listProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Category details | Rajesh Control",
};

interface AdminCategoryDetailPageProps {
  params: Promise<{ categoryId: string }>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminCategoryDetailPage({
  params,
}: AdminCategoryDetailPageProps) {
  const { categoryId } = await params;
  const categories = await listCategories();
  const category = categories.find((item) => item.id === categoryId);

  if (!category) {
    notFound();
  }

  const products = await listProducts({
    category: category.name,
    sort: "name-asc",
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Category details
          </p>
          <h1 className="text-3xl font-semibold text-foreground">{category.name}</h1>
          <p className="text-sm text-muted-foreground">
            Updated {formatDate(category.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/categories">Back to categories</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/categories/${category.id}/edit`}>Edit category</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide">Products</dt>
              <dd className="font-medium text-foreground">{products.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Created</dt>
              <dd className="font-medium text-foreground">{formatDate(category.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide">Updated</dt>
              <dd className="font-medium text-foreground">{formatDate(category.updatedAt)}</dd>
            </div>
          </dl>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="text-sm text-muted-foreground">
              {category.description || "No description provided."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products in this category</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products are currently assigned to this category.
            </p>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {product.company?.name ?? "No company"} - {product.variants.length} variant
                      {product.variants.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(product.price)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
