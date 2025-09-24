import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    product.condition === "refurbished" ? "Certified refurbished" : "Factory sealed";

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/70 bg-card/90 backdrop-blur">
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-secondary/80 via-secondary to-secondary/40">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/70 text-sm font-medium text-muted-foreground">
            Visual coming soon
          </div>
        )}
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
          {conditionLabel}
        </span>
        {!product.inStock ? (
          <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-destructive/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            Out of stock
          </span>
        ) : null}
      </div>
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold text-foreground">{product.name}</CardTitle>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-6">
        <div className="space-y-3">
          <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
          {product.highlights.length ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {product.highlights.slice(0, 3).map((highlight) => (
                <li key={highlight} className="flex items-center gap-2">
                  <span className="inline-flex size-1.5 rounded-full bg-primary/80" aria-hidden />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : null}
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
      </CardContent>
    </Card>
  );
}
