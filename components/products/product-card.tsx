import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package } from "lucide-react";
import type { ProductSummary } from "@/lib/products";
import { formatCurrency } from "@/lib/currency";

interface ProductCardProps {
  product: ProductSummary;
  href?: string;
}

export function ProductCard({ product, href }: ProductCardProps) {
  const conditionLabel =
    product.condition === "refurbished"
      ? "Enterprise Certified"
      : "Factory Sealed";

  const conditionColor =
    product.condition === "refurbished"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-blue-100 text-blue-800 border-blue-200";

  const detailsHref = href ?? `/products/${product.id}`;
  const heroImage = product.imageUrl || product.galleryImages[0] || null;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={detailsHref}
        aria-label={`View details for ${product.name}`}
        className="absolute inset-0 z-10"
      />

      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
            <div className="text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <span className="text-sm font-medium">Product Image</span>
              <p className="mt-1 text-xs text-slate-400">Coming Soon</p>
            </div>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute left-3 top-3">
          <Badge className={`${conditionColor} border text-xs font-semibold shadow-sm`}>
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            {conditionLabel}
          </Badge>
        </div>

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute right-3 top-3">
            <Badge className="border-red-200 bg-red-100 text-xs font-semibold text-red-800 shadow-sm">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <CardHeader className="space-y-3 pb-4">
        <Badge variant="outline" className="w-fit border-slate-300 text-xs font-medium text-slate-600">
          {product.category}
        </Badge>
        <CardTitle className="line-clamp-2 text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-slate-800">
          {product.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-0">
        <div className="space-y-3">
          {product.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          )}

          {product.highlights.length > 0 && (
            <ul className="space-y-1.5">
              {product.highlights.slice(0, 3).map((highlight, index) => (
                <li key={`${highlight}-${index}`} className="text-sm text-slate-600">
                  • {highlight}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Enterprise Price
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${product.inStock ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <span
              className={`text-xs font-medium ${
                product.inStock ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {product.inStock ? "In Stock - Ready to Ship" : "Currently Unavailable"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
