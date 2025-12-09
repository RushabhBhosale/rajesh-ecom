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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const colorOptionsKey = product.colors.join("|");
  const variantOptionsKey = product.variants.map((variant) => `${variant.label}:${variant.price}`).join("|");
  const baseLabel = useMemo(() => {
    const parts = [
      product.processor?.name,
      product.ram?.name,
      product.storage?.name,
      product.graphics?.name,
    ].filter(Boolean);
    return parts.length ? parts.join(" • ") : "Base configuration";
  }, [product.processor?.name, product.ram?.name, product.storage?.name, product.graphics?.name]);
  const configurationOptions = useMemo(() => {
    const options = [
      { label: baseLabel, price: product.price, isBase: true },
      ...product.variants.map((variant) => ({ ...variant, isBase: false })),
    ];
    const seen = new Set<string>();
    return options.filter((option) => {
      const key = `${option.isBase ? "__base" : option.label.toLowerCase()}:${option.price}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [product.price, variantOptionsKey, baseLabel]);
  const requiresVariantSelection =
    product.variants.length > 0 && !(Number.isFinite(product.price) && product.price > 0);

  useEffect(() => {
    if (product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(null);
    }
  }, [product.id, colorOptionsKey]);

  useEffect(() => {
    if (configurationOptions.length === 0) {
      setSelectedVariant(null);
      return;
    }
    const cheapest =
      configurationOptions.reduce((best, current) =>
        current.price < best.price ? current : best
      ) ?? configurationOptions[0];
    setSelectedVariant(cheapest.isBase ? null : cheapest.label);
  }, [product.id, product.price, variantOptionsKey, configurationOptions]);

  const normalizedColor = selectedColor?.trim() ?? "";
  const colorForCart = normalizedColor || null;
  const variantForCart = (selectedVariant ?? "").trim() || null;
  const activeVariant = variantForCart
    ? product.variants.find(
        (variant) => variant.label.toLowerCase() === variantForCart.toLowerCase()
      )
    : undefined;
  const displayPrice = activeVariant ? activeVariant.price : product.price;
  const quantitySelector = useMemo(
    () => selectQuantityByVariant(product.id, variantForCart, colorForCart),
    [product.id, variantForCart, colorForCart]
  );
  const quantity = useCartStore(quantitySelector);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const showQuantity = hasHydrated && quantity > 0;

  const handleDecrease = () => {
    if (quantity <= 1) {
      removeItem(product.id, variantForCart, colorForCart);
      return;
    }
    updateQuantity(product.id, variantForCart, colorForCart, quantity - 1);
  };

  const handleIncrease = () => {
    if (!product.inStock || quantity >= MAX_CART_QUANTITY) {
      return;
    }
    addItem(
      {
        productId: product.id,
        color: colorForCart,
        variant: variantForCart,
        name: product.name,
        price: displayPrice,
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
            {product.variants.length > 0 ? "Selected price" : "Price"}
          </p>
          <p className="text-4xl font-bold text-slate-900">
            {formatCurrency(displayPrice)}
          </p>
          <p className="text-xs text-slate-500">
            Volume pricing and configuration add-ons available on request.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {product.variants.length > 0 ? (
            <div className="flex flex-col gap-1 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Configuration
              </p>
              <div className="flex flex-wrap gap-2">
                {configurationOptions.map((variant) => {
                  const isBase = (variant as any).isBase;
                  const isSelected = isBase
                    ? variantForCart === null
                    : variant.label.toLowerCase() === (variantForCart ?? "").toLowerCase();
                  return (
                    <button
                      key={variant.label}
                      type="button"
                      onClick={() => setSelectedVariant(isBase ? null : variant.label)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
                        isSelected
                          ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      )}
                      aria-pressed={isSelected}
                    >
                      <span>{variant.label}</span>
                      <span className="text-xs text-slate-500">
                        {formatCurrency(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
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
                    removeItem(product.id, variantForCart, colorForCart);
                    return;
                  }
                  updateQuantity(product.id, variantForCart, colorForCart, parsed);
                }}
                onBlur={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(parsed) || parsed <= 0) {
                    removeItem(product.id, variantForCart, colorForCart);
                    return;
                  }
                  updateQuantity(product.id, variantForCart, colorForCart, parsed);
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
                price: displayPrice,
                imageUrl: product.imageUrl,
                category: product.category,
                condition: product.condition,
                inStock: product.inStock,
              }}
              selectedColor={colorForCart}
              requireColor={product.colors.length > 0}
              selectedVariant={variantForCart}
              requireVariant={requiresVariantSelection}
              displayVariant={variantForCart || baseLabel}
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
