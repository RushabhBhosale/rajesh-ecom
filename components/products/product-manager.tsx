"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsTable } from "@/components/admin/products-table";
import type { ProductSummary } from "@/lib/products";

import { ProductForm } from "./product-form";

interface ProductManagerProps {
  products: ProductSummary[];
}

export function ProductManager({ products }: ProductManagerProps) {
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<ProductSummary | null>(null);

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

  return (
    <section className="space-y-8">
      <ProductForm mode="create" onSuccess={() => router.refresh()} />

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
            onEdit={(product) => setEditingProduct(product)}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {editingProduct ? (
        <ProductForm
          key={editingProduct.id}
          mode="update"
          product={editingProduct}
          onSuccess={() => {
            setEditingProduct(null);
            router.refresh();
          }}
          onCancel={() => setEditingProduct(null)}
        />
      ) : null}
    </section>
  );
}
