import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, CheckCircle, PackageCheck, ShieldCheck } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { ProductMediaGallery } from "@/components/products/product-media-gallery";
import { ProductPurchaseSection } from "@/components/products/product-purchase-section";
import { formatCurrency } from "@/lib/currency";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProductById, listProducts } from "@/lib/products";

interface ProductDetailPageProps {
  params: {
    productId: string;
  };
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProductById(params.productId);

  console.log("dcds", product)

  if (!product) {
    return {
      title: "Product not found | Rajesh Renewed",
      description: "The requested product could not be located in our catalog.",
    };
  }

  return {
    title: `${product.name} | Rajesh Renewed`,
    description: product.description,
    alternates: {
      canonical: `/products/${product.id}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProductById(params.productId);

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

  const conditionLabel =
    product.condition === "refurbished" ? "Enterprise Certified" : "Factory Sealed";

  const productHighlights = product.highlights.length
    ? product.highlights
    : [
        "Thorough 50-point refurbishment with enterprise QA",
        "Deployment-ready imaging and asset tagging support",
        "Nationwide logistics with rapid fulfillment",
      ];

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

  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ?? product.variants[0] ?? null;
  const hasVariants = product.variants.length > 1;
  const configurationOptions = hasVariants
    ? [...product.variants].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.price - b.price;
      })
    : [];

  const specSheet = [
    { label: "Company", value: product.company?.name },
    { label: "Processor", value: product.processor?.name },
    { label: "Memory", value: product.ram?.name },
    { label: "Storage", value: product.storage?.name },
    { label: "Graphics", value: product.graphics?.name },
    { label: "Operating system", value: product.os?.name },
  ].filter((item) => Boolean(item.value));

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

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary">{product.category}</Badge>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  <CheckCircle className="mr-1 h-3.5 w-3.5" /> {conditionLabel}
                </Badge>
              </div>
              <ProductMediaGallery
                name={product.name}
                primaryImage={product.imageUrl}
                galleryImages={product.galleryImages}
              />
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Enterprise device</span>
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>{product.inStock ? "In stock" : "Backorder"}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {product.name}
                </h1>
                <p className="text-base leading-7 text-slate-600">{product.description}</p>
                {!hasVariants && specSheet.length ? (
                  <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Key configuration
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {specSheet.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-start justify-between gap-3 text-sm text-slate-600"
                        >
                          <span className="font-semibold text-slate-700">{item.label}</span>
                          <span className="text-right">{item.value ?? ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {/* {hasVariants ? (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Available configurations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {configurationOptions.map((variant) => (
                        <span
                          key={variant.label}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm"
                        >
                          <span>{variant.label}</span>
                          <span className="text-xs text-slate-500">{formatCurrency(variant.price)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null} */}
              </div>

              <ProductPurchaseSection product={product} />

              {/* <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Highlights
                </h2>
                <ul className="grid gap-3">
                  {productHighlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {richContent ? (
        <section className="mx-auto mt-12 w-full max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
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
