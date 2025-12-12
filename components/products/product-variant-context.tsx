"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ProductSummary, ProductVariant } from "@/lib/products";

interface ProductVariantContextValue {
  product: ProductSummary & { inStock: boolean };
  configurationOptions: ProductVariant[];
  defaultVariant: ProductVariant | null;
  selectedVariant: string | null;
  setSelectedVariant: (label: string | null) => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  activeVariant: ProductVariant | null;
  displayPrice: number;
  availableColors: string[];
}

const ProductVariantContext = createContext<ProductVariantContextValue | null>(
  null
);

interface ProductVariantProviderProps {
  product: ProductSummary & { inStock: boolean };
  children: ReactNode;
}

export function ProductVariantProvider({
  product,
  children,
}: ProductVariantProviderProps) {
  const variantOptionsKey = useMemo(
    () =>
      product.variants
        .map(
          (variant) =>
            `${variant.label}:${variant.price}:${variant.isDefault ? "1" : "0"}`
        )
        .join("|"),
    [product.variants]
  );

  const configurationOptions = useMemo(() => {
    const seen = new Set<string>();
    return product.variants
      .filter((variant) => variant.label.trim().length > 0)
      .filter((variant) => {
        const key = variant.label.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.price - b.price;
      });
  }, [variantOptionsKey, product.variants]);

  const defaultVariant =
    configurationOptions.find((variant) => variant.isDefault) ??
    configurationOptions[0] ??
    null;

  const [selectedVariant, setSelectedVariantState] = useState<string | null>(
    defaultVariant?.label ?? null
  );
  const [selectedColor, setSelectedColorState] = useState<string | null>(
    product.colors[0] ?? null
  );

  useEffect(() => {
    const exists = configurationOptions.some(
      (variant) =>
        variant.label.toLowerCase() === (selectedVariant ?? "").toLowerCase()
    );
    if (!exists) {
      setSelectedVariantState(defaultVariant?.label ?? null);
    }
  }, [product.id, variantOptionsKey, configurationOptions, selectedVariant, defaultVariant?.label]);

  useEffect(() => {
    if (product.colors.length > 0) {
      setSelectedColorState(product.colors[0]);
    } else {
      setSelectedColorState(null);
    }
  }, [product.id, product.colors.join("|")]);

  const activeVariant = useMemo(() => {
    if (!selectedVariant) {
      return defaultVariant;
    }
    return (
      configurationOptions.find(
        (variant) =>
          variant.label.toLowerCase() === selectedVariant.toLowerCase()
      ) ?? defaultVariant
    );
  }, [selectedVariant, configurationOptions, defaultVariant]);

  useEffect(() => {
    if (activeVariant?.color) {
      setSelectedColorState(activeVariant.color);
    }
  }, [activeVariant?.color]);

  const displayPrice = activeVariant?.price ?? product.price;
  const availableColors = useMemo(() => {
    const seen = new Set<string>();
    const variant = activeVariant ?? defaultVariant;
    const variantColors = (() => {
      if (variant?.color) {
        return [variant.color];
      }
      if (Array.isArray(variant?.colors) && variant.colors.length > 0) {
        return variant.colors;
      }
      return [];
    })();

    const source =
      variantColors.length > 0
        ? variantColors
        : product.colors;

    return source
      .map((color) => color.trim())
      .filter((color) => {
        if (!color) return false;
        const key = color.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [activeVariant, defaultVariant, product.colors]);

  useEffect(() => {
    if (availableColors.length === 0) {
      setSelectedColorState(null);
      return;
    }
    const current = selectedColor ?? "";
    const hasCurrent = current
      ? availableColors.some((color) => color.toLowerCase() === current.toLowerCase())
      : false;
    if (!hasCurrent) {
      setSelectedColorState(availableColors[0]);
    }
  }, [product.id, availableColors, selectedColor]);

  const setSelectedVariant = (label: string | null) => {
    setSelectedVariantState(label?.trim() || null);
  };

  const setSelectedColor = (color: string | null) => {
    setSelectedColorState(color?.trim() || null);
  };

  const value: ProductVariantContextValue = {
    product,
    configurationOptions,
    defaultVariant,
    selectedVariant,
    setSelectedVariant,
    selectedColor,
    setSelectedColor,
    activeVariant,
    displayPrice,
    availableColors,
  };

  return (
    <ProductVariantContext.Provider value={value}>
      {children}
    </ProductVariantContext.Provider>
  );
}

export function useProductVariant() {
  const context = useContext(ProductVariantContext);
  if (!context) {
    throw new Error("useProductVariant must be used within a ProductVariantProvider");
  }
  return context;
}

export function useOptionalProductVariant() {
  return useContext(ProductVariantContext);
}
