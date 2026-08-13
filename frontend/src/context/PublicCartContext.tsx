"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface PublicCartItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  category: string;
  preparationTime?: number;
  quantity: number;
  variant?: {
    id: string;
    label: string;
    price: number;
  };
}

interface PublicCartContextType {
  publicCart: PublicCartItem[];
  addToPublicCart: (
    item: Omit<PublicCartItem, "quantity">,
    variant?: { id: string; label: string; price: number }
  ) => void;
  removeFromPublicCart: (itemId: string, variantId?: string) => void;
  updatePublicCartQuantity: (itemId: string, delta: number, variantId?: string) => void;
  clearPublicCart: () => void;
  publicCartTotalItems: number;
  publicCartSubTotal: number;
}

const PUBLIC_CART_KEY = "homely_public_cart";

const PublicCartContext = createContext<PublicCartContextType | undefined>(undefined);

export const PublicCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publicCart, setPublicCart] = useState<PublicCartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(PUBLIC_CART_KEY);
        if (stored) {
          setPublicCart(JSON.parse(stored));
        }
      } catch {
        setPublicCart([]);
      }
    }
  }, []);

  // Persist to localStorage on every change
  const saveCart = useCallback((cart: PublicCartItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PUBLIC_CART_KEY, JSON.stringify(cart));
    }
  }, []);

  const addToPublicCart = useCallback(
    (item: Omit<PublicCartItem, "quantity">, variant?: { id: string; label: string; price: number }) => {
      setPublicCart((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.id === item.id && c.variant?.id === variant?.id
        );
        let updated: PublicCartItem[];
        if (existingIndex > -1) {
          updated = prev.map((c, idx) =>
            idx === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
          );
        } else {
          updated = [...prev, { ...item, quantity: 1, variant }];
        }
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const removeFromPublicCart = useCallback(
    (itemId: string, variantId?: string) => {
      setPublicCart((prev) => {
        const updated = prev.filter(
          (c) => !(c.id === itemId && c.variant?.id === variantId)
        );
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const updatePublicCartQuantity = useCallback(
    (itemId: string, delta: number, variantId?: string) => {
      setPublicCart((prev) => {
        const updated = prev
          .map((c) => {
            if (c.id === itemId && c.variant?.id === variantId) {
              const newQty = c.quantity + delta;
              return newQty > 0 ? { ...c, quantity: newQty } : null;
            }
            return c;
          })
          .filter(Boolean) as PublicCartItem[];
        saveCart(updated);
        return updated;
      });
    },
    [saveCart]
  );

  const clearPublicCart = useCallback(() => {
    setPublicCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PUBLIC_CART_KEY);
    }
  }, []);

  const publicCartTotalItems = publicCart.reduce((sum, c) => sum + c.quantity, 0);
  const publicCartSubTotal = publicCart.reduce(
    (sum, c) => sum + (c.variant ? c.variant.price : c.price) * c.quantity,
    0
  );

  return (
    <PublicCartContext.Provider
      value={{
        publicCart,
        addToPublicCart,
        removeFromPublicCart,
        updatePublicCartQuantity,
        clearPublicCart,
        publicCartTotalItems,
        publicCartSubTotal,
      }}
    >
      {children}
    </PublicCartContext.Provider>
  );
};

export const usePublicCart = () => {
  const context = useContext(PublicCartContext);
  if (!context) {
    throw new Error("usePublicCart must be used within a PublicCartProvider");
  }
  return context;
};
