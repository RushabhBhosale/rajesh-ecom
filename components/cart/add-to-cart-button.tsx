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
  selectedColor?: string | null;
  requireColor?: boolean;
  onMissingColor?: () => void;
  selectedVariant?: string | null;
  requireVariant?: boolean;
  onMissingVariant?: () => void;
  displayVariant?: string | null;
}

export function AddToCartButton({
  product,
  size = "default",
  variant = "default",
  selectedColor,
  requireColor = false,
  onMissingColor,
  selectedVariant,
  requireVariant = false,
  onMissingVariant,
  displayVariant,
}: AddToCartButtonProps) {
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

        const normalizedColor = selectedColor?.trim() ?? "";
        if (requireColor && !normalizedColor) {
          toast.error("Please select a colour before adding to cart.");
          onMissingColor?.();
          return;
        }

        const normalizedVariant = selectedVariant?.trim() ?? "";
        if (requireVariant && !normalizedVariant) {
          toast.error("Please select a configuration before adding to cart.");
          onMissingVariant?.();
          return;
        }
        const normalizedDisplayVariant =
          displayVariant?.trim() ?? normalizedVariant;
        const truncate = (value: string, max = 60) =>
          value.length > max ? `${value.slice(0, max - 3)}...` : value;
        const variantSnippet =
          normalizedDisplayVariant &&
          normalizedDisplayVariant.toLowerCase() !== product.name.toLowerCase()
            ? normalizedDisplayVariant
            : "";
        const detailParts = [variantSnippet, normalizedColor || ""]
          .map((part) => part.trim())
          .filter(Boolean);
        const detailText = detailParts.length
          ? ` — ${truncate(detailParts.join(" • "), 50)}`
          : "";

        startTransition(() => {
          addItem(
            {
              productId: product.id,
              color: normalizedColor || null,
              variant: normalizedVariant || null,
              displayVariant: normalizedDisplayVariant || null,
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
