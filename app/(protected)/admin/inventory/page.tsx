import { Metadata } from "next";

import { InventoryTable, type InventoryItem } from "@/components/admin/inventory-table";
import { listProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Inventory | Rajesh Control",
};

export default async function AdminInventoryPage() {
  const products = await listProducts();

  const items: InventoryItem[] = products
    .flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku || `${product.name} ${variant.label}`.trim(),
        productName: product.name,
        variantLabel: variant.label,
        stock: Math.max(0, Number(variant.stock ?? 0)),
        inStock: Boolean(variant.inStock && (variant.stock ?? 0) > 0),
        category: product.category,
        company: product.company?.name ?? "",
        price: variant.price ?? product.price ?? 0,
      }))
    )
    .sort((a, b) => a.sku.localeCompare(b.sku || "", undefined, { sensitivity: "base" }));

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Track stock levels per SKU. Update counts directly when receiving shipments or fulfilling orders.
        </p>
      </div>
      <InventoryTable items={items} />
    </section>
  );
}
