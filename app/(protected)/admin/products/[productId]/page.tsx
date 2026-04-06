import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { getProductById } from "@/lib/products";

export const metadata: Metadata = {
  title: "Product details | Rajesh Control",
};

interface AdminProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminProductDetailPage({
  params,
}: AdminProductDetailPageProps) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const stockTotal = product.variants.reduce((total, variant) => {
    return total + Math.max(0, Number(variant.stock) || 0);
  }, 0);

  const priceValues = product.variants.map((variant) => variant.price);
  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : product.price;
  const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : product.price;

  return (
    <section className="space-y-6 overflow-x-hidden">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Product details
          </p>
          <h1
            title={product.name}
            className="line-clamp-2 break-words text-3xl font-semibold text-foreground [overflow-wrap:anywhere]"
          >
            {product.name}
          </h1>
          <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {product.category} - Updated {formatDate(product.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products">Back to products</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/products/${product.id}/edit`}>Edit product</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide">Category</dt>
                <dd className="break-words font-medium text-foreground [overflow-wrap:anywhere]">
                  {product.category}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide">Company</dt>
                <dd className="break-words font-medium text-foreground [overflow-wrap:anywhere]">
                  {product.company?.name ?? "N/A"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide">Price range</dt>
                <dd className="font-medium text-foreground">
                  {formatCurrency(minPrice)}
                  {minPrice !== maxPrice ? ` to ${formatCurrency(maxPrice)}` : ""}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide">Total stock</dt>
                <dd className="font-medium text-foreground">
                  {stockTotal} unit{stockTotal === 1 ? "" : "s"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Created</dt>
                <dd className="font-medium text-foreground">{formatDate(product.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Variants</dt>
                <dd className="font-medium text-foreground">{product.variants.length}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {product.description || "No short description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={product.inStock ? "secondary" : "destructive"}>
                {product.inStock ? "In stock" : "Out of stock"}
              </Badge>
              {product.featured ? <Badge>Featured</Badge> : null}
              <Badge variant="outline">{product.condition}</Badge>
            </div>

            {product.highlights.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Highlights
                </p>
                <ul className="min-w-0 space-y-1 text-sm text-muted-foreground">
                  {product.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="break-words [overflow-wrap:anywhere]"
                    >
                      * {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {product.variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No variants found.</p>
            ) : (
              <ul className="space-y-3">
                {product.variants.map((variant) => (
                  <li
                    key={variant.id}
                    className="min-w-0 overflow-hidden rounded-xl border border-border p-3"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p
                          title={variant.label}
                          className="truncate font-medium text-foreground"
                        >
                          {variant.label}
                        </p>
                        <p
                          title={variant.sku || "N/A"}
                          className="truncate text-xs text-muted-foreground"
                        >
                          SKU: {variant.sku || "N/A"}
                        </p>
                        {variant.color ? (
                          <p
                            title={variant.color}
                            className="truncate text-xs text-muted-foreground"
                          >
                            Colour: {variant.color}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(variant.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {variant.stock} unit{variant.stock === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{variant.condition}</Badge>
                      {variant.isDefault ? <Badge>Default</Badge> : null}
                      {variant.featured ? <Badge variant="secondary">Featured</Badge> : null}
                      <Badge variant={variant.inStock ? "secondary" : "destructive"}>
                        {variant.inStock ? "In stock" : "Out of stock"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
