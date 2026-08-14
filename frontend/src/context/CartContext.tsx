"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import {
  getBackendCart,
  syncBackendCart,
  clearBackendCart,
  applyOfferToCart,
  removeOfferFromCart,
  checkoutCart,
  CartTotal,
} from "@/services/cartService";

const PUBLIC_CART_KEY = "homely_public_cart";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  isSpecial?: boolean;
  tag?: string;
  category: string;
  preparationTime?: number;
  tags?: string[];
  allergens?: string[];
  status?: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  variant?: {
    id: string;
    label: string;
    price: number;
  };
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  time: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  orderType: string;
  deliveryAddress?: string;
  pickupTiming?: string;
}

interface CartContextType {
  cart: CartItem[];
  cartId: string | null;
  isCartLoading: boolean;
  addToCart: (item: MenuItem, variant?: { id: string; label: string; price: number }) => void;
  removeFromCart: (itemId: string, variantId?: string) => void;
  updateQuantity: (itemId: string, delta: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subTotal: number;
  discountAmount: number;
  finalAmount: number;
  totalAmount: number;
  appliedOfferCode: string | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  placeOrder: (
    guestName?: string,
    guestPhone?: string,
    details?: { orderType: "dine-in" | "delivery" | "pickup"; deliveryAddress?: string; pickupTiming?: string }
  ) => Promise<any>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartTotal, setCartTotal] = useState<CartTotal>({ subTotal: 0, discount: 0, totalAmount: 0 });
  const [isCartLoading, setIsCartLoading] = useState<boolean>(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfirmedCartRef = useRef<CartItem[]>([]);

  // Helper to format raw backend cart object to CartItem[] array
  const formatBackendCartItems = (backendCart: any): CartItem[] => {
    if (!backendCart || !backendCart.items) return [];
    return (backendCart.items || [])
      .filter((item: any) => item.menuItem)
      .map((item: any) => ({
        item: {
          id: item.menuItem._id,
          name: item.menuItem.name,
          price: item.variant ? item.variant.price : item.menuItem.price,
          description: "",
          image: typeof item.menuItem.image === "object" ? item.menuItem.image.url : item.menuItem.image || "",
          category: typeof item.menuItem.category === "object" ? (item.menuItem.category as any)?.name : item.menuItem.category || "",
        },
        quantity: item.quantity,
        variant: item.variant
          ? {
              id: item.variant._id,
              label: item.variant.label,
              price: item.variant.price,
            }
          : undefined,
      }));
  };

  // Load cart from backend if authenticated + sync any pending public cart
  useEffect(() => {
    const fetchCart = async () => {
      if (!token) {
        setCart([]);
        setCartId(null);
        setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
        lastConfirmedCartRef.current = [];
        setIsCartLoading(false);
        return;
      }
      setIsCartLoading(true);
      try {
        // Check for pending public cart items to merge
        let publicCartItems: { menuItem: string; quantity: number; variant?: string }[] = [];
        try {
          const stored = localStorage.getItem(PUBLIC_CART_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as Array<{
              id: string;
              quantity: number;
              variant?: { id: string; label: string; price: number };
            }>;
            publicCartItems = parsed.map((c) => ({
              menuItem: c.id,
              quantity: c.quantity,
              variant: c.variant?.id,
            }));
          }
        } catch {
          publicCartItems = [];
        }

        // Fetch current backend cart
        const backendCart = await getBackendCart();
        let mergedItems: { menuItem: string; quantity: number; variant?: string }[] = [];

        if (backendCart && backendCart.items) {
          mergedItems = backendCart.items.map((c: any) => ({
            menuItem: c.menuItem._id,
            quantity: c.quantity,
            variant: c.variant?._id,
          }));
        }

        // Merge public cart into backend cart (add quantities for matching items)
        if (publicCartItems.length > 0) {
          for (const pubItem of publicCartItems) {
            const existingIdx = mergedItems.findIndex(
              (m) => m.menuItem === pubItem.menuItem && m.variant === pubItem.variant
            );
            if (existingIdx > -1) {
              mergedItems[existingIdx].quantity += pubItem.quantity;
            } else {
              mergedItems.push(pubItem);
            }
          }
          // Sync merged cart to backend
          const syncedCart = await syncBackendCart(mergedItems);
          // Clear public cart from localStorage after successful sync
          localStorage.removeItem(PUBLIC_CART_KEY);
          if (syncedCart) {
            setCartId(syncedCart._id);
            setCartTotal(syncedCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
            const formattedItems = formatBackendCartItems(syncedCart);
            setCart(formattedItems);
            lastConfirmedCartRef.current = formattedItems;
          }
        } else if (backendCart && backendCart.items) {
          setCartId(backendCart._id);
          setCartTotal(backendCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
          const formattedItems = formatBackendCartItems(backendCart);
          setCart(formattedItems);
          lastConfirmedCartRef.current = formattedItems;
        } else {
          setCart([]);
          setCartId(null);
          setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
          lastConfirmedCartRef.current = [];
        }
      } catch (err) {
        console.error("Failed to fetch backend cart:", err);
      } finally {
        setIsCartLoading(false);
      }
    };
    fetchCart();
  }, [token]);

  // Helper: Trigger 500ms debounced sync with automatic rollback on backend API errors
  const triggerDebouncedSync = (targetCart: CartItem[]) => {
    if (!token) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const previousConfirmedCart = lastConfirmedCartRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const inputs = targetCart.map((c) => ({
          menuItem: c.item.id,
          quantity: c.quantity,
          variant: c.variant?.id,
        }));
        const resCart = await syncBackendCart(inputs);
        if (resCart) {
          setCartId(resCart._id);
          setCartTotal(resCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
          const confirmedItems = formatBackendCartItems(resCart);
          setCart(confirmedItems);
          lastConfirmedCartRef.current = confirmedItems;
        } else {
          setCartId(null);
          setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
          setCart([]);
          lastConfirmedCartRef.current = [];
        }
      } catch (err) {
        console.error("Backend cart sync failed. Rolling back frontend state to match backend:", err);
        // Rollback state by fetching authoritative backend cart
        try {
          const freshCart = await getBackendCart();
          if (freshCart && freshCart.items) {
            setCartId(freshCart._id);
            setCartTotal(freshCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
            const confirmedItems = formatBackendCartItems(freshCart);
            setCart(confirmedItems);
            lastConfirmedCartRef.current = confirmedItems;
          } else {
            setCart([]);
            setCartId(null);
            setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
            lastConfirmedCartRef.current = [];
          }
        } catch (fetchErr) {
          // Fallback to last confirmed cart array in memory
          setCart(previousConfirmedCart);
        }
      }
    }, 500);
  };

  const addToCart = (item: MenuItem, variant?: { id: string; label: string; price: number }) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.item.id === item.id && c.variant?.id === variant?.id
      );
      let updated: CartItem[] = [];
      if (existingIndex > -1) {
        updated = prev.map((c, idx) =>
          idx === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        updated = [...prev, { item, quantity: 1, variant }];
      }
      triggerDebouncedSync(updated);
      return updated;
    });
  };

  const removeFromCart = (itemId: string, variantId?: string) => {
    setCart((prev) => {
      const updated = prev.filter((c) => !(c.item.id === itemId && c.variant?.id === variantId));
      triggerDebouncedSync(updated);
      return updated;
    });
  };

  const updateQuantity = (itemId: string, delta: number, variantId?: string) => {
    setCart((prev) => {
      const updated = prev
        .map((c) => {
          if (c.item.id === itemId && c.variant?.id === variantId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
      triggerDebouncedSync(updated);
      return updated;
    });
  };

  const clearCart = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setCart([]);
    setCartId(null);
    setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
    lastConfirmedCartRef.current = [];
    if (token) {
      try {
        await clearBackendCart();
      } catch (err) {
        console.error("Failed to clear cart on backend:", err);
      }
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const resCart = await applyOfferToCart(code);
      if (resCart) {
        setCartId(resCart._id);
        setCartTotal(resCart.total);
        const confirmedItems = formatBackendCartItems(resCart);
        setCart(confirmedItems);
        lastConfirmedCartRef.current = confirmedItems;
        return {
          success: true,
          message: `Coupon "${code.toUpperCase()}" applied successfully!`,
        };
      }
      return { success: false, message: "Failed to apply coupon." };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Invalid or expired coupon code.",
      };
    }
  };

  const removeCoupon = async () => {
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const resCart = await removeOfferFromCart();
      if (resCart) {
        setCartTotal(resCart.total);
        const confirmedItems = formatBackendCartItems(resCart);
        setCart(confirmedItems);
        lastConfirmedCartRef.current = confirmedItems;
      }
    } catch (err) {
      console.error("Failed to remove offer:", err);
    }
  };

  const totalItems = cart.length;
  const subTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const discountAmount = cartTotal.discount || 0;
  const finalAmount = Math.max(0, subTotal - discountAmount);
  const appliedOfferCode = cartTotal.offerCode || null;

  const placeOrder = async (
    guestName?: string,
    guestPhone?: string,
    details?: { orderType: "dine-in" | "delivery" | "pickup"; deliveryAddress?: string; pickupTiming?: string }
  ): Promise<any> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const orderType = details?.orderType || "dine-in";
    const deliveryAddress = details?.deliveryAddress;
    const pickupTiming = details?.pickupTiming;

    const payload = {
      orderType,
      deliveryAddress,
      pickupTiming,
      guest: {
        name: guestName || "Guest User",
        phone: guestPhone || "0000000000",
      },
    };

    try {
      // Call dedicated POST /api/cart/checkout API
      const createdOrder = await checkoutCart(cartId || "", payload);
      const formattedOrder: Order = {
        id: createdOrder.orderNumber || createdOrder._id,
        date: "Just Now",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "Accepted",
        items: (createdOrder.items || []).map((c: any) => ({
          name: c.menuItem?.name || "Food Item",
          quantity: c.quantity,
          price: c.price,
        })),
        totalAmount: createdOrder.totalAmount,
        paymentMethod: "Offline / Cash",
        orderType,
        deliveryAddress,
        pickupTiming,
      };

      setCurrentOrder(formattedOrder);
      setCart([]);
      setCartId(null);
      setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
      lastConfirmedCartRef.current = [];
      return createdOrder;
    } catch (error) {
      console.error("Failed to checkout cart:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        isCartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subTotal,
        discountAmount,
        finalAmount,
        totalAmount: finalAmount,
        appliedOfferCode,
        applyCoupon,
        removeCoupon,
        currentOrder,
        setCurrentOrder,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
