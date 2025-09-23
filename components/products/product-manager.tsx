"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Condition</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Featured</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length ? (
                products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="space-y-1">
                        <span>{product.name}</span>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{product.condition}</td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(product.price)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.featured ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.inStock ? "Available" : "Out of stock"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                    Add your first product to populate the storefront.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
