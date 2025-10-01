"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Plus, Minus } from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import {
  useCartHydration,
  useCartStore,
  selectQuantityByVariant,
  MAX_CART_QUANTITY,
} from "@/lib/stores/cart-store";
import type { ProductSummary } from "@/lib/products";
import { cn } from "@/lib/utils";

interface ProductPurchaseSectionProps {
  product: ProductSummary & { inStock: boolean };
}

export function ProductPurchaseSection({ product }: ProductPurchaseSectionProps) {
  const hasHydrated = useCartHydration();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const colorOptionsKey = product.colors.join("|");

  useEffect(() => {
    if (product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(null);
    }
  }, [product.id, colorOptionsKey]);

  const normalizedColor = selectedColor?.trim() ?? "";
  const colorForCart = normalizedColor || null;
  const quantitySelector = useMemo(
    () => selectQuantityByVariant(product.id, colorForCart),
    [product.id, colorForCart]
  );
  const quantity = useCartStore(quantitySelector);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const showQuantity = hasHydrated && quantity > 0;

  const handleDecrease = () => {
    if (quantity <= 1) {
      removeItem(product.id, colorForCart);
      return;
    }
    updateQuantity(product.id, colorForCart, quantity - 1);
  };

  const handleIncrease = () => {
    if (!product.inStock || quantity >= MAX_CART_QUANTITY) {
      return;
    }
    addItem(
      {
        productId: product.id,
        color: colorForCart,
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
          {product.colors.length > 0 ? (
            <div className="flex flex-col gap-1 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Colour
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isSelected = color === selectedColor;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
                        isSelected
                          ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      )}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="size-5 rounded-full border border-slate-200"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
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
                    removeItem(product.id, colorForCart);
                    return;
                  }
                  updateQuantity(product.id, colorForCart, parsed);
                }}
                onBlur={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(parsed) || parsed <= 0) {
                    removeItem(product.id, colorForCart);
                    return;
                  }
                  updateQuantity(product.id, colorForCart, parsed);
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
              selectedColor={colorForCart}
              requireColor={product.colors.length > 0}
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
