"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCartStore,
  type CartItem,
  MAX_CART_QUANTITY,
} from "@/lib/stores/cart-store";
import { formatCurrency } from "@/lib/currency";

interface CartLineItemProps {
  item: CartItem;
}

export function CartLineItem({ item }: CartLineItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/60 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-start gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:size-24">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-[10px] font-medium text-slate-400">
              <span>No image</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {item.category}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {item.condition === "refurbished"
                ? "Certified"
                : "Factory Sealed"}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
            {item.name}
          </h3>
          <p className="text-xs font-medium text-slate-600">
            Unit:{" "}
            <span className="font-semibold text-slate-900">
              {formatCurrency(item.price)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-inner">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Input
            value={String(item.quantity)}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(parsed)) updateQuantity(item.productId, parsed);
            }}
            onBlur={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              updateQuantity(item.productId, Number.isNaN(parsed) ? 1 : parsed);
            }}
            className="h-8 w-12 rounded-full border-0 bg-transparent text-center text-xs font-semibold"
            inputMode="numeric"
            aria-label={`Quantity of ${item.name}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= MAX_CART_QUANTITY}
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Line total
          </p>
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2 text-xs text-slate-500 hover:text-red-600"
          onClick={() => removeItem(item.productId)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Remove
        </Button>
      </div>
    </div>
  );
}
