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
    <section className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Product catalogue
          </h1>
        </div>
        <Button asChild size="lg" className="sm:ml-auto">
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>
      <ProductManager products={products} />
    </section>
  );
}
