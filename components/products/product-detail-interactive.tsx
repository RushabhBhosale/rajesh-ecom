"use client";

import { useMemo } from "react";
import { CheckCircle } from "lucide-react";

import { ProductMediaGallery } from "@/components/products/product-media-gallery";
import { ProductPurchaseSection } from "@/components/products/product-purchase-section";
import {
  ProductVariantProvider,
  useProductVariant,
} from "@/components/products/product-variant-context";
import { Badge } from "@/components/ui/badge";
import type { ProductSummary } from "@/lib/products";

interface ProductDetailInteractiveProps {
  product: ProductSummary & { inStock: boolean };
}

function buildDisplayName(baseName: string, variantLabel?: string | null) {
  const label = variantLabel?.trim();
  return label || baseName;
}

function VariantMedia({ product }: ProductDetailInteractiveProps) {
  const { activeVariant, defaultVariant } = useProductVariant();
  const variantForDisplay = activeVariant ?? defaultVariant ?? null;

  const primaryImage = useMemo(() => {
    if (variantForDisplay?.imageUrl) {
      return variantForDisplay.imageUrl;
    }
    if (variantForDisplay?.galleryImages?.length) {
      return variantForDisplay.galleryImages[0];
    }
    return product.imageUrl ?? product.galleryImages[0] ?? null;
  }, [
    variantForDisplay?.imageUrl,
    variantForDisplay?.galleryImages,
    product.imageUrl,
    product.galleryImages,
  ]);

  const galleryImages = variantForDisplay?.galleryImages?.length
    ? variantForDisplay.galleryImages
    : product.galleryImages;

  const conditionLabel =
    (variantForDisplay?.condition ?? product.condition) === "refurbished"
      ? "Enterprise Certified"
      : "Brand New";

  const colorLabel =
    variantForDisplay?.color ||
    (variantForDisplay?.colors?.length ? variantForDisplay.colors[0] : null) ||
    (product.colors && product.colors.length
      ? product.colors.join(", ")
      : null);

  const displayName = buildDisplayName(product.name, variantForDisplay?.label);

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/10 text-primary">{product.category}</Badge>
        {product.company?.name ? (
          <Badge variant="outline" className="border-slate-300 text-slate-700">
            Brand: {product.company.name}
          </Badge>
        ) : null}
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          <CheckCircle className="mr-1 h-3.5 w-3.5" /> {conditionLabel}
        </Badge>
        {colorLabel ? (
          <Badge variant="outline" className="border-slate-300 text-slate-700">
            Color: {colorLabel}
          </Badge>
        ) : null}
      </div>
      <ProductMediaGallery
        name={displayName}
        primaryImage={primaryImage}
        galleryImages={galleryImages}
      />
    </div>
  );
}

function VariantInfo({ product }: ProductDetailInteractiveProps) {
  const { activeVariant, defaultVariant } = useProductVariant();
  const effectiveVariant = activeVariant ?? defaultVariant ?? null;
  const displayName = buildDisplayName(product.name, effectiveVariant?.label);
  const availableStock = effectiveVariant?.stock ?? product.stock ?? 0;
  const variantInStock = Boolean(
    (effectiveVariant?.inStock ?? product.inStock) && availableStock > 0
  );

  const description =
    effectiveVariant?.description && effectiveVariant.description.trim().length
      ? effectiveVariant.description
      : product.description;

  const currentCondition = effectiveVariant?.condition ?? product.condition;
  const basePrice = effectiveVariant?.price ?? product.price ?? 0;
  const currentOriginalPrice =
    typeof effectiveVariant?.originalPrice === "number" && effectiveVariant.originalPrice > 0
      ? effectiveVariant.originalPrice
      : typeof product.originalPrice === "number" && product.originalPrice > 0
      ? product.originalPrice
      : basePrice;
  const currentDiscountedPrice =
    typeof effectiveVariant?.discountedPrice === "number" && effectiveVariant.discountedPrice > 0
      ? effectiveVariant.discountedPrice
      : typeof product.discountedPrice === "number" && product.discountedPrice > 0
      ? product.discountedPrice
      : null;
  const hasCurrentDiscount =
    currentDiscountedPrice !== null && currentDiscountedPrice < currentOriginalPrice;
  const currentPrice = hasCurrentDiscount ? currentDiscountedPrice : basePrice;
  const currentOnSale = hasCurrentDiscount;
  const currentSku = effectiveVariant?.sku ?? product.sku;
  const currentStock = effectiveVariant?.stock ?? product.stock ?? 0;
  const currentColor =
    effectiveVariant?.color ||
    (effectiveVariant?.colors?.length ? effectiveVariant.colors[0] : null) ||
    (product.colors && product.colors.length
      ? product.colors.join(", ")
      : null);

  const specSheet = [
    { label: "Brand", value: product.company?.name },
    {
      label: "Processor",
      value: effectiveVariant?.processor?.name ?? product.processor?.name,
    },
    {
      label: "Memory",
      value: effectiveVariant?.ram?.name ?? product.ram?.name,
    },
    {
      label: "Storage",
      value: effectiveVariant?.storage?.name ?? product.storage?.name,
    },
    {
      label: "Graphics",
      value: effectiveVariant?.graphics?.name ?? product.graphics?.name,
    },
    {
      label: "Condition",
      value: currentCondition === "new" ? "New" : "Refurbished",
    },
  ].filter((item) => Boolean(item.value));

  const hasVariants = product.variants.length > 1;

  const effectiveHighlights =
    (effectiveVariant?.highlights && effectiveVariant.highlights.length
      ? effectiveVariant.highlights
      : product.highlights) ?? [];

  return (
    <div className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span>Enterprise device</span>
          <span className="h-px flex-1 bg-slate-200" />
          <span>{variantInStock ? "In stock" : "Out of stock"}</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {displayName}
        </h1>

        <div className="space-y-1">
          <p className="text-sm text-slate-500">Price</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-slate-900">
              ₹{currentPrice.toLocaleString("en-IN")}
            </p>
            {hasCurrentDiscount ? (
              <span className="text-base text-slate-500 line-through">
                ₹{currentOriginalPrice.toLocaleString("en-IN")}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            Taxes and shipping calculated at checkout
          </p>
        </div>

        <p className="text-base leading-7 text-slate-600">{description}</p>

        {effectiveHighlights.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Key highlights
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {effectiveHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {specSheet.length ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Technical details
            </p>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {specSheet.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-3 text-sm text-slate-600"
                >
                  <span className="font-semibold text-slate-700">
                    {item.label}
                  </span>
                  <span className="text-right">{item.value ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {hasVariants ? (
          <p className="text-xs text-slate-500">
            Multiple configurations available. Select your preferred processor,
            memory, and storage in the purchase panel.
          </p>
        ) : null}
      </div>

      <ProductPurchaseSection
        product={{
          ...product,
          name: displayName,
          description,
          price: currentPrice,
          originalPrice: currentOriginalPrice,
          discountedPrice: currentDiscountedPrice,
          onSale: currentOnSale,
          condition: currentCondition,
          inStock: variantInStock,
          stock: availableStock,
          imageUrl: effectiveVariant?.imageUrl ?? product.imageUrl,
          galleryImages:
            effectiveVariant?.galleryImages ?? product.galleryImages,
          richDescription:
            effectiveVariant?.richDescription ?? product.richDescription,
          highlights: effectiveVariant?.highlights ?? product.highlights,
          sku: currentSku ?? product.sku,
        }}
      />
    </div>
  );
}

export function ProductDetailInteractive({
  product,
}: ProductDetailInteractiveProps) {
  return (
    <ProductVariantProvider product={product}>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <VariantMedia product={product} />
        <VariantInfo product={product} />
      </div>
    </ProductVariantProvider>
  );
}
