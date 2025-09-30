"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsTable } from "@/components/admin/products-table";
import type { ProductSummary } from "@/lib/products";

interface ProductManagerProps {
  products: ProductSummary[];
}

export function ProductManager({ products }: ProductManagerProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error ?? "Unable to delete product";
        toast.error(message);
        return;
      }

      toast.success("Product removed");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Unable to reach the server. Please try again.");
    }
  }

  async function handleDuplicate(product: ProductSummary) {
    try {
      const payload = {
        name: `${product.name} (Copy)`,
        category: product.category,
        description: product.description,
        price: product.price,
        condition: product.condition,
        imageUrl: product.imageUrl ?? "",
        galleryImages: product.galleryImages ?? [],
        richDescription: product.richDescription ?? "",
        featured: product.featured,
        inStock: product.inStock,
        highlights: product.highlights ?? [],
        colors: product.colors ?? [],
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.error ?? "Unable to duplicate product";
        toast.error(typeof message === "string" ? message : "Unable to duplicate product");
        return;
      }

      toast.success("Product duplicated");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Unable to duplicate product. Please try again.");
    }
  }

  return (
    <section className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Inventory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage the devices that appear on the landing page and catalogue.
          </p>
        </CardHeader>
        <CardContent>
          <ProductsTable
            data={products}
            onEdit={(product) => router.push(`/admin/products/${product.id}/edit`)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </CardContent>
      </Card>
    </section>
  );
}
