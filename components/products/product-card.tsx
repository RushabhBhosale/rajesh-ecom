import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ProductSummary } from "@/lib/products";
import { formatCurrency } from "@/lib/currency";
import { Package } from "lucide-react";

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

  return (
    <Link href={detailsHref} className="block">
      <Card className="group overflow-hidden border-slate-200 min-h-[340px] bg-white transition hover:shadow-md">
        {/* Image */}
        <div className="relative h-40 w-full bg-slate-50">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width:768px) 100vw, (max-width:1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <div className="text-center text-xs">
                <Package className="mx-auto mb-1 h-6 w-6" />
                No image
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {product.category}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {product.name}
          </h3>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(product.price)}
              </div>
              <div className="text-[11px] text-slate-500">{condition}</div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  product.inStock ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span className="text-[11px] font-medium text-slate-600">
                {product.inStock ? "In stock" : "Unavailable"}
              </span>
            </div>
          </div>

          {product.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
              {product.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
