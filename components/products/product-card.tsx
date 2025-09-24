import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package } from "lucide-react";
import type { ProductSummary } from "@/lib/products";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ProductCardProps {
  product: ProductSummary;
  showCta?: boolean;
}

export function ProductCard({ product, showCta = true }: ProductCardProps) {
  const conditionLabel =
    product.condition === "refurbished"
      ? "Enterprise Certified"
      : "Factory Sealed";

  const conditionColor =
    product.condition === "refurbished"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-blue-100 text-blue-800 border-blue-200";

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
            <div className="text-center">
              <Package className="mx-auto h-8 w-8 mb-2 text-slate-400" />
              <span className="text-sm font-medium">Product Image</span>
              <p className="text-xs text-slate-400 mt-1">Coming Soon</p>
            </div>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute left-3 top-3">
          <Badge
            className={`${conditionColor} text-xs font-semibold border shadow-sm`}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            {conditionLabel}
          </Badge>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Starting at</p>
            <p className="text-2xl font-semibold text-primary">{formatCurrency(product.price)}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddToCartButton product={product} className="rounded-full px-6" />
            {showCta ? (
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href={`/products#${product.id}`}>View details</Link>
              </Button>
            ) : null}
          </div>
        </div>
    </Card>
  );
}
