import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductSummary } from "@/lib/products";
import { formatCurrency } from "@/lib/currency";
import { Package, TrendingDown } from "lucide-react";

interface ProductCardProps {
  product: ProductSummary;
  href?: string;
}

export function ProductCard({ product, href }: ProductCardProps) {
  const detailsHref = href ?? `/products/${product.id}`;
  const img = product.imageUrl || product.galleryImages?.[0] || "";
  const condition =
    product.condition === "refurbished"
      ? "Enterprise Certified"
      : "Factory Sealed";
  const taxonomy = [product.company?.name, product.category]
    .filter(Boolean)
    .join(" • ");
  const quickSpecs = [
    product.processor?.name,
    product.ram?.name,
    product.storage?.name,
  ]
    .filter(Boolean)
    .join(" • ");

  const variantPrices =
    product.variants
      ?.map((variant) => variant.price)
      .filter((price) => Number.isFinite(price)) ?? [];
  const primaryPrice =
    variantPrices.length > 0
      ? Math.min(product.price, ...variantPrices)
      : product.price;

  const discounted =
    typeof product.discountedPrice === "number" && product.discountedPrice > 0
      ? product.discountedPrice
      : null;
  const original =
    typeof product.originalPrice === "number" && product.originalPrice > 0
      ? product.originalPrice
      : primaryPrice;
  const showSale = discounted !== null && discounted < original;

  const displayedPrice = showSale ? discounted : primaryPrice;
  const originalPrice = showSale ? original : null;

  const savingsPercent =
    showSale && originalPrice
      ? Math.round(((originalPrice - displayedPrice) / originalPrice) * 100)
      : 0;

  return (
    <Link href={detailsHref} className="group block">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col min-h-[500px]">
        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          {showSale && (
            <Badge className="absolute top-2 left-2 z-10 bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 text-xs shadow-lg">
              Sale
            </Badge>
          )}

          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="w-16 h-16 text-slate-300" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex flex-col flex-1 p-4">
          {/* Category/Brand */}
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">
            {taxonomy || product.category}
          </p>

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Quick Specs */}
          {quickSpecs && (
            <p className="text-[11px] text-slate-600 line-clamp-1 mb-3">
              {quickSpecs}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price Section - Compact */}
          <div className="border-t border-slate-200 pt-3 mt-2">
            <div className="flex items-end justify-between mb-2">
              <div>
                {showSale && originalPrice && (
                  <p className="text-[11px] text-slate-500 line-through font-medium mb-0.5">
                    {formatCurrency(originalPrice)}
                  </p>
                )}
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(displayedPrice)}
                </p>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className="text-[10px] font-medium border-slate-300 text-slate-700 px-2 py-0.5"
              >
                {condition}
              </Badge>
              {/* <Badge
                variant={product.inStock ? "default" : "secondary"}
                className={
                  product.inStock
                    ? "bg-green-100 text-green-800 hover:bg-green-200 text-[10px] font-medium px-2 py-0.5"
                    : "bg-slate-200 text-slate-600 text-[10px] font-medium px-2 py-0.5"
                }
              >
                {product.inStock ? "In Stock" : "Unavailable"}
              </Badge> */}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
