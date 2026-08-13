"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getBackendCart, syncBackendCart, clearBackendCart } from "@/services/cartService";
import { createOrder } from "@/services/orderService";
import { Offer } from "@/services/offerService";

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
  status: "Accepted" | "Preparing" | "Ready" | "Completed" | "Pending";
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  orderType: string;
  deliveryAddress?: string;
  pickupTiming?: string;
}

interface CartContextType {
  cart: CartItem[];
  isCartLoading: boolean;
  addToCart: (item: MenuItem, variant?: { id: string; label: string; price: number }) => void;
  removeFromCart: (itemId: string, variantId?: string) => void;
  updateQuantity: (itemId: string, delta: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  appliedOffer: Offer | null;
  discountAmount: number;
  finalAmount: number;
  applyOffer: (offer: Offer) => { success: boolean; message: string };
  removeOffer: () => void;
  orders: Order[];
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
  const [isCartLoading, setIsCartLoading] = useState<boolean>(true);
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Load cart from backend if authenticated
  useEffect(() => {
    const fetchCart = async () => {
      if (!token) {
        setCart([]);
        setIsCartLoading(false);
        return;
      }
      setIsCartLoading(true);
      try {
        const backendCart = await getBackendCart();
        const formattedItems: CartItem[] = (backendCart.items || [])
          .filter((item) => item.menuItem)
          .map((item) => ({
            item: {
              id: item.menuItem._id,
              name: item.menuItem.name,
              price: item.variant ? item.variant.price : item.menuItem.price,
              description: "",
              image: typeof item.menuItem.image === "object" ? item.menuItem.image.url : item.menuItem.image || "",
              category: typeof item.menuItem.category === "object" ? (item.menuItem.category as any)?.name : item.menuItem.category || "",
            },
            quantity: item.quantity,
            variant: item.variant ? {
              id: item.variant._id,
              label: item.variant.label,
              price: item.variant.price,
            } : undefined,
          }));
        setCart(formattedItems);
      } catch (err) {
        console.error("Failed to fetch backend cart:", err);
      } finally {
        setIsCartLoading(false);
      }
    };
    fetchCart();
  }, [token]);

  // Helper to sync updated cart array to backend
  const syncCartWithBackend = async (updatedCart: CartItem[]) => {
    if (!token) return;
    try {
      const inputs = updatedCart.map((c) => ({
        menuItem: c.item.id,
        quantity: c.quantity,
        variant: c.variant?.id,
      }));
      await syncBackendCart(inputs);
    } catch (err) {
      console.error("Failed to sync cart state with backend:", err);
    }
  };

  const addToCart = (item: MenuItem, variant?: { id: string; label: string; price: number }) => {
    let updated: CartItem[] = [];
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.item.id === item.id && c.variant?.id === variant?.id
      );
      if (existingIndex > -1) {
        updated = prev.map((c, idx) =>
          idx === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        updated = [...prev, { item, quantity: 1, variant }];
      }
      return updated;
    });
    // Call API sync once outside state updater callback
    syncCartWithBackend(updated);
  };

  const removeFromCart = (itemId: string, variantId?: string) => {
    let updated: CartItem[] = [];
    setCart((prev) => {
      updated = prev.filter((c) => !(c.item.id === itemId && c.variant?.id === variantId));
      return updated;
    });
    syncCartWithBackend(updated);
  };

  const updateQuantity = (itemId: string, delta: number, variantId?: string) => {
    let updated: CartItem[] = [];
    setCart((prev) => {
      updated = prev
        .map((c) => {
          if (c.item.id === itemId && c.variant?.id === variantId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
      return updated;
    });
    syncCartWithBackend(updated);
  };

  const clearCart = async () => {
    setCart([]);
    setAppliedOffer(null);
    if (token) {
      try {
        await clearBackendCart();
      } catch (err) {
        console.error("Failed to clear cart on backend:", err);
      }
    }
  };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalAmount = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  // Discount computation based on appliedOffer
  let discountAmount = 0;
  if (appliedOffer && totalAmount > 0) {
    const minCart = appliedOffer.minCartValue || 0;
    if (totalAmount >= minCart) {
      if (appliedOffer.offerType === "PERCENTAGE") {
        const perc = appliedOffer.discountPercentage || 0;
        let calculated = (totalAmount * perc) / 100;
        if (appliedOffer.maxDiscountAmount && appliedOffer.maxDiscountAmount > 0) {
          calculated = Math.min(calculated, appliedOffer.maxDiscountAmount);
        }
        discountAmount = Math.round(calculated);
      } else if (appliedOffer.offerType === "FLAT") {
        let flat = appliedOffer.flatDiscountAmount || 0;
        if (appliedOffer.maxDiscountAmount && appliedOffer.maxDiscountAmount > 0) {
          flat = Math.min(flat, appliedOffer.maxDiscountAmount);
        }
        discountAmount = Math.min(totalAmount, flat);
      }
    }
  }

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const applyOffer = (offer: Offer): { success: boolean; message: string } => {
    const minCart = offer.minCartValue || 0;
    if (totalAmount < minCart) {
      return {
        success: false,
        message: `Cart total must be at least ₹${minCart} to use coupon "${offer.code}".`,
      };
    }
    setAppliedOffer(offer);
    return {
      success: true,
      message: `Coupon "${offer.code}" applied successfully!`,
    };
  };

  const removeOffer = () => {
    setAppliedOffer(null);
  };

  const placeOrder = async (
    guestName?: string,
    guestPhone?: string,
    details?: { orderType: "dine-in" | "delivery" | "pickup"; deliveryAddress?: string; pickupTiming?: string }
  ): Promise<any> => {
    const orderType = details?.orderType || "dine-in";
    const deliveryAddress = details?.deliveryAddress;
    const pickupTiming = details?.pickupTiming;

    const payload = {
      guest: {
        name: guestName || "Guest User",
        phone: guestPhone || "0000000000",
      },
      items: cart.map((c) => ({
        menuItem: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        variant: c.variant ? {
          variantId: c.variant.id,
          label: c.variant.label,
          price: c.variant.price,
        } : undefined,
      })),
      orderType,
      deliveryAddress,
      pickupTiming,
      discount: discountAmount,
      payment: {
        method: "cash" as any,
        status: "pending" as any,
      },
    };

    try {
      const createdOrder = await createOrder(payload);
      const formattedOrder: Order = {
        id: createdOrder.orderNumber,
        date: "Just Now",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "Accepted",
        items: cart.map((c) => ({
          name: c.item.name,
          quantity: c.quantity,
          price: c.item.price,
        })),
        totalAmount: createdOrder.totalAmount,
        paymentMethod: "Offline / Cash",
        orderType,
        deliveryAddress,
        pickupTiming,
      };

      setOrders((prev) => [formattedOrder, ...prev]);
      setCurrentOrder(formattedOrder);
      await clearCart();
      return createdOrder;
    } catch (error) {
      console.error("Failed to place order:", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        appliedOffer,
        discountAmount,
        finalAmount,
        applyOffer,
        removeOffer,
        orders,
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
export { initialMenuItems };
