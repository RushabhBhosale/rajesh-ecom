"use client";

import Link from "next/link";

import { Plus, Minus } from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import {
  useCartHydration,
  useCartStore,
  selectQuantityById,
  MAX_CART_QUANTITY,
} from "@/lib/stores/cart-store";
import type { ProductSummary } from "@/lib/products";

interface ProductPurchaseSectionProps {
  product: ProductSummary & { inStock: boolean };
}

export function ProductPurchaseSection({ product }: ProductPurchaseSectionProps) {
  const hasHydrated = useCartHydration();
  const quantity = useCartStore(selectQuantityById(product.id));
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const showQuantity = hasHydrated && quantity > 0;

  const handleDecrease = () => {
    if (quantity <= 1) {
      removeItem(product.id);
      return;
    }
    updateQuantity(product.id, quantity - 1);
  };

  const handleIncrease = () => {
    if (!product.inStock || quantity >= MAX_CART_QUANTITY) {
      return;
    }
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        condition: product.condition,
      },
      1
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Starting at
          </p>
          <p className="text-4xl font-bold text-slate-900">
            {formatCurrency(product.price)}
          </p>
          <p className="text-xs text-slate-500">
            Volume pricing and configuration add-ons available on request.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {showQuantity ? (
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-inner">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                onClick={handleDecrease}
                disabled={quantity <= 0}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                value={String(quantity)}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(parsed)) {
                    return;
                  }
                  if (parsed <= 0) {
                    removeItem(product.id);
                    return;
                  }
                  updateQuantity(product.id, parsed);
                }}
                onBlur={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(parsed) || parsed <= 0) {
                    removeItem(product.id);
                    return;
                  }
                  updateQuantity(product.id, parsed);
                }}
                inputMode="numeric"
                className="h-9 w-16 rounded-full border-0 bg-transparent text-center text-sm font-semibold"
                aria-label="Quantity"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                onClick={handleIncrease}
                disabled={!product.inStock || quantity >= MAX_CART_QUANTITY}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                category: product.category,
                condition: product.condition,
                inStock: product.inStock,
              }}
              size="lg"
            />
          )}
          <Button asChild variant="outline" size="lg" className="rounded-md border-slate-300">
            <Link href="/register">Request custom quote</Link>
          </Button>
        </div>
      </div>

      {showQuantity ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            In cart: {quantity}
          </div>
          <Button asChild size="sm" variant="ghost" className="rounded-full text-emerald-700 hover:text-emerald-800">
            <Link href="/cart">View cart</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
