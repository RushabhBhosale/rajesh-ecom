import Link from "next/link";
import { Metadata } from "next";

import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Add product | Rajesh Control",
};

export default function NewProductPage() {
  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">Add a product</h1>
          <p className="max-w-2xl text-muted-foreground">
            Provide detailed information so the storefront and buyers see accurate pricing, condition, and
            highlights.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products">Back to products</Link>
        </Button>
      </div>
      <ProductForm mode="create" redirectTo="/admin/products" />
    </section>
  );
}
