import { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/products/product-form";
import { getProductById } from "@/lib/products";

export const metadata: Metadata = {
  title: "Edit product | Rajesh Control",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Edit product</h1>
        <p className="text-sm text-muted-foreground">
          Update product information and save to instantly reflect changes in the catalogue.
        </p>
      </div>
      <ProductForm mode="update" product={product} redirectTo="/admin/products" />
    </section>
  );
}
