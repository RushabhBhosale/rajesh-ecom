import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, PackageCheck, ShieldCheck } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { ProductDetailInteractive } from "@/components/products/product-detail-interactive";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { Button } from "@/components/ui/button";
import { getProductById, listProducts } from "@/lib/products";
import { brandName } from "@/utils/variable";

interface ProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductById(productId);

  console.log("dcds", product)

  if (!product) {
    return {
      title: `Product not found | ${brandName}`,
      description: "The requested product could not be located in our catalog.",
    };
  }

  return {
    title: `${product.name} | ${brandName}`,
    description: product.description,
    alternates: {
      canonical: `/products/${product.id}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const related = (await listProducts({
    category: product.category,
    inStockOnly: true,
    sort: "price-asc",
    limit: 5,
  }))
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const valueProps = [
    {
      icon: ShieldCheck,
      title: "Assured Protection",
      description:
        "6-month coverage with advance replacement and on-call enterprise support.",
    },
    {
      icon: PackageCheck,
      title: "Deployment Ready",
      description:
        "Pre-configured imaging, asset tags, and quality checks tailored to your rollout.",
    },
    {
      icon: Award,
      title: "Certified Quality",
      description:
        "Only the top 5% of received devices pass our strict component inspection process.",
    },
  ];

  const richContent = product.richDescription
    ? sanitizeRichText(product.richDescription)
    : "";

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-16">
      <section className="border-b border-slate-200/70 bg-white/90 py-10 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
          <Button asChild variant="ghost" className="w-fit text-slate-500 hover:text-slate-900">
            <Link href="/products" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to catalog
            </Link>
          </Button>

          <ProductDetailInteractive product={product} />
        </div>
      </section>

      {richContent ? (
        <section className="mx-auto mt-12 w-full max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm overflow-hidden">
            <div
              className="rich-text space-y-4 text-slate-700"
              dangerouslySetInnerHTML={{ __html: richContent }}
            />
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm sm:grid-cols-3">
          {valueProps.map(({ icon: Icon, title, description }) => (
            <div key={title} className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Icon className="h-4 w-4" />
                {title}
              </div>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length ? (
        <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                You may also like
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                Related devices in {product.category}
              </h2>
            </div>
            <Button asChild variant="ghost" className="text-slate-500 hover:text-slate-900">
              <Link href="/products">View all</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
