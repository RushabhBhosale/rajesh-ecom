import Link from "next/link";
import { Metadata } from "next";

import { ProductManager } from "@/components/products/product-manager";
import { listProducts } from "@/lib/products";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Product catalogue | Rajesh Control",
};

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">Product catalogue</h1>
          <p className="max-w-2xl text-muted-foreground">
            Browse every item currently listed on the storefront. Use the search and sorting tools to find
            specific devices, update existing entries, or remove discontinued stock.
          </p>
        </div>
        <Button asChild size="lg" className="sm:ml-auto">
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>
      <ProductManager products={products} />
    </section>
  );
}
