"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const MAX_CART_QUANTITY = 10;

export interface CartItem {
  productId: string;
  color: string | null;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  condition: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, color?: string | null) => void;
  updateQuantity: (productId: string, color: string | null, quantity: number) => void;
  clearCart: () => void;
  setHasHydrated: (state: boolean) => void;
}

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(MAX_CART_QUANTITY, Math.max(1, Math.trunc(value)));
}

function normalizeColor(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      addItem: (item, quantity = 1) => {
        const normalizedQuantity = clampQuantity(quantity);
        const normalizedColor = normalizeColor(item.color);
        const items = get()
          .items
          .map((entry) => ({ ...entry, color: normalizeColor(entry.color) }));
        const existing = items.find(
          (entry) => entry.productId === item.productId && entry.color === normalizedColor
        );
        if (existing) {
          set({
            items: items.map((entry) =>
              entry.productId === item.productId && entry.color === normalizedColor
                ? {
                    ...entry,
                    color: normalizedColor,
                    quantity: clampQuantity(entry.quantity + normalizedQuantity),
                  }
                : entry
            ),
            hasHydrated: true,
          });
          return;
        }

        set({
          items: [
            ...items,
            {
              ...item,
              color: normalizedColor,
              quantity: normalizedQuantity,
            },
          ],
          hasHydrated: true,
        });
      },
      removeItem: (productId, color) => {
        const normalizedColor = normalizeColor(color);
        const items = get()
          .items
          .map((entry) => ({ ...entry, color: normalizeColor(entry.color) }));
        set({
          items: items.filter((item) => {
            if (item.productId !== productId) {
              return true;
            }
            return item.color !== normalizedColor;
          }),
          hasHydrated: true,
        });
      },
      updateQuantity: (productId, color, quantity) => {
        const normalized = clampQuantity(quantity);
        const normalizedColor = normalizeColor(color);
        const items = get()
          .items
          .map((entry) => ({ ...entry, color: normalizeColor(entry.color) }));
        const exists = items.some(
          (item) => item.productId === productId && item.color === normalizedColor
        );
        if (!exists) {
          return;
        }
        set({
          items: items.map((item) =>
            item.productId === productId && item.color === normalizedColor
              ? { ...item, quantity: normalized }
              : item
          ),
          hasHydrated: true,
        });
      },
      clearCart: () => set({ items: [], hasHydrated: true }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "rajesh-renewed-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const selectCartItems = (state: CartState) =>
  state.items.map((item) => ({ ...item, color: normalizeColor(item.color) }));
export const selectItemCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);
export const selectSubtotal = (state: CartState) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectQuantityById = (productId: string) => (state: CartState) => {
  return state.items
    .filter((item) => item.productId === productId)
    .reduce((total, item) => total + item.quantity, 0);
};

export const selectQuantityByVariant = (productId: string, color: string | null) =>
  (state: CartState) => {
    const normalizedColor = normalizeColor(color);
    const entry = state.items.find(
      (item) => item.productId === productId && normalizeColor(item.color) === normalizedColor
    );
    return entry?.quantity ?? 0;
  };

export function useCartHydration() {
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);
  return hasHydrated;
}
