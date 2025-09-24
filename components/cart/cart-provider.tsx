"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  condition: string;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "HYDRATE"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR" };

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = "rajesh-ecom-cart";

const CartContext = createContext<CartContextValue | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE": {
      return { items: action.payload };
    }
    case "ADD_ITEM": {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item,
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM": {
      return { items: state.items.filter((item) => item.id !== action.payload.id) };
    }
    case "UPDATE_QUANTITY": {
      return {
        items: state.items
          .map((item) =>
            item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item,
          )
          .filter((item) => item.quantity > 0),
      };
    }
    case "CLEAR": {
      return { items: [] };
    }
    default:
      return state;
  }
}

function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price) || 0,
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
        quantity: Math.max(1, Number.parseInt(String(item.quantity), 10) || 1),
        condition: typeof item.condition === "string" ? item.condition : "refurbished",
      }))
      .filter((item) => item.id && item.name);
  } catch (error) {
    console.error("Failed to read cart from storage", error);
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const hydrationCompletedRef = useRef(false);
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const storedItems = readCartFromStorage();
    if (storedItems.length) {
      dispatch({ type: "HYDRATE", payload: storedItems });
    }
    hydrationCompletedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydrationCompletedRef.current) {
      return;
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = state.items.reduce((total, item) => total + item.quantity * item.price, 0);

    return {
      items: state.items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [state.items, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

