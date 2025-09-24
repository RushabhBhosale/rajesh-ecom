"use client";

import { useTransition } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    category: string;
    condition: string;
    inStock: boolean;
  };
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
}

export function AddToCartButton({ product, size = "default", variant = "default" }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={isPending || !product.inStock}
      className="rounded-md font-semibold"
      onClick={() => {
        if (!product.inStock) {
          toast.error("This item is currently unavailable");
          return;
        }

        startTransition(() => {
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
          toast.success("Added to cart", {
            description: `${product.name} was added to your cart`,
          });
        });
      }}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {product.inStock ? "Add to cart" : "Out of stock"}
    </Button>
  );
}
