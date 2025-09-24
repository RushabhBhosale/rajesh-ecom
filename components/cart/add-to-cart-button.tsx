"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import type { ProductSummary } from "@/lib/products";

import { useCart } from "./cart-provider";

interface AddToCartButtonProps {
  product: ProductSummary;
  className?: string;
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [pending, startTransition] = useTransition();

  const disabled = !product.inStock || pending;

  return (
    <Button
      type="button"
      onClick={() =>
        startTransition(() => {
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1,
            condition: product.condition,
          });
          toast.success(`${product.name} added to cart`);
        })
      }
      disabled={disabled}
      className={className}
    >
      {product.inStock ? "Add to cart" : "Out of stock"}
    </Button>
  );
}

