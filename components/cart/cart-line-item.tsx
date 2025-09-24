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
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white/60 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-start gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 md:size-28">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-xs font-medium text-slate-400">
              <span>No image</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {item.category}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {item.condition === "refurbished" ? "Certified" : "Factory Sealed"}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
          <p className="text-sm font-medium text-slate-600">
            Unit price: <span className="font-semibold text-slate-900">{formatCurrency(item.price)}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-inner">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            value={String(item.quantity)}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              if (Number.isNaN(parsed)) {
                return;
              }
              updateQuantity(item.productId, parsed);
            }}
            onBlur={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              updateQuantity(item.productId, Number.isNaN(parsed) ? 1 : parsed);
            }}
            className="h-9 w-16 rounded-full border-0 bg-transparent text-center text-sm font-semibold"
            inputMode="numeric"
            aria-label={`Quantity of ${item.name}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= MAX_CART_QUANTITY}
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Line total
          </p>
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(item.price * item.quantity)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="text-slate-500 hover:text-red-600"
          onClick={() => removeItem(item.productId)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}
