"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const MAX_CART_QUANTITY = 10;

export interface CartItem {
  productId: string;
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
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setHasHydrated: (state: boolean) => void;
}

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(MAX_CART_QUANTITY, Math.max(1, Math.trunc(value)));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      addItem: (item, quantity = 1) => {
        const normalizedQuantity = clampQuantity(quantity);
        const items = get().items;
        const existing = items.find((entry) => entry.productId === item.productId);
        if (existing) {
          set({
            items: items.map((entry) =>
              entry.productId === item.productId
                ? {
                    ...entry,
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
              quantity: normalizedQuantity,
            },
          ],
          hasHydrated: true,
        });
      },
      removeItem: (productId) => {
        const items = get().items;
        set({ items: items.filter((item) => item.productId !== productId), hasHydrated: true });
      },
      updateQuantity: (productId, quantity) => {
        const normalized = clampQuantity(quantity);
        const items = get().items;
        const exists = items.some((item) => item.productId === productId);
        if (!exists) {
          return;
        }
        set({
          items: items.map((item) =>
            item.productId === productId ? { ...item, quantity: normalized } : item
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

export const selectCartItems = (state: CartState) => state.items;
export const selectItemCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0);
export const selectSubtotal = (state: CartState) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectQuantityById = (productId: string) => (state: CartState) => {
  const entry = state.items.find((item) => item.productId === productId);
  return entry?.quantity ?? 0;
};

export function useCartHydration() {
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);
  return hasHydrated;
}
