import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Product } from "@/data/products";

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  pricePoints: number;
  qty: number;
  variantId?: string;
  selectedVariants?: Record<string, string>;
};

export type CartState = {
  items: CartItem[];
  isOpen: boolean;
};

const STORAGE_KEY = "jh_cart_v1";

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const readStorage = (): CartState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CartState;
  } catch {
    return null;
  }
};

const writeStorage = (state: CartState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

export type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number; // total qty
  subtotalPoints: number; // sum of line totals in points
  addItem: (product: Product, qty?: number, variantId?: string, selectedVariants?: Record<string, string>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQty: (productId: string, qty: number, variantId?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // hydrate from localStorage once
  useEffect(() => {
    const saved = readStorage();
    if (saved?.items) {
      // migrate any numeric IDs to strings, then sanitize to only allow UUIDs
      const migrated = saved.items.map((i: any) => ({
        ...i,
        productId: typeof i.productId === 'number' ? String(i.productId) : String(i.productId),
      })) as CartItem[];
      const sanitized = migrated.filter((i) => typeof i.productId === 'string' && isUuid(i.productId));
      setItems(sanitized);
      writeStorage({ items: sanitized, isOpen: false });
    }
  }, []);

  // persist
  useEffect(() => {
    writeStorage({ items, isOpen: false });
  }, [items]);

  const addItem = useCallback((product: Product, qty: number = 1, variantId?: string, selectedVariants?: Record<string, string>) => {
    setItems((prev) => {
      const pid = String((product as any).id);
      const idx = prev.findIndex((i) => i.productId === pid && i.variantId === variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId: pid,
          name: (product as any).name,
          image: (product as any).image,
          pricePoints: (product as any).price,
          qty,
          variantId,
          selectedVariants,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  }, []);

  const updateQty = useCallback((productId: string, qty: number, variantId?: string) => {
    setItems((prev) => prev.map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, qty: Math.max(1, qty) } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotalPoints = useMemo(() => items.reduce((sum, i) => sum + i.pricePoints * i.qty, 0), [items]);

  const value: CartContextValue = {
    items,
    isOpen,
    totalItems,
    subtotalPoints,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
