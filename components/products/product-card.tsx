import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package } from "lucide-react";
import type { ProductSummary } from "@/lib/products";

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

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute right-3 top-3">
            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-semibold border shadow-sm">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <CardHeader className="space-y-3 pb-4">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="text-xs font-medium text-slate-600 border-slate-300 w-fit"
          >
            {product.category}
          </Badge>
          <CardTitle className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-slate-800 transition-colors">
            {product.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-0">
        <div className="space-y-4">
          {product.description && (
            <p className="line-clamp-2 text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          )}

          {product.highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Key Features
              </h4>
              <ul className="space-y-1.5">
                {product.highlights.slice(0, 3).map((highlight, index) => (
                  <li
                    key={`${highlight}-${index}`}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Enterprise Price
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(product.price)}
              </p>
              <p className="text-xs text-slate-500">Starting configuration</p>
            </div>

            {showCta && (
              <div className="flex flex-col gap-2">
                {product.inStock ? (
                  <Button
                    asChild
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                  >
                    <Link href={`/products#${product.id}`}>View Details</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-300 text-slate-500 font-semibold px-4 py-2 rounded-md cursor-not-allowed"
                    disabled
                  >
                    <span>Notify When Available</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                product.inStock ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                product.inStock ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {product.inStock
                ? "In Stock - Ready to Ship"
                : "Currently Unavailable"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
