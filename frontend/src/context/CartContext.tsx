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
  CoinDeductionResponse,
  CoinRemovalNotice,
} from "@/services/cartService";

const PUBLIC_CART_KEY = "homely_public_cart";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  description?: string;
  image: string;
  isSpecial?: boolean;
  tag?: string;
  category: string;
  preparationTime?: number;
  tags?: string[];
  allergens?: string[];
  status?: string;
  variants?: Array<{
    _id?: string;
    id?: string;
    label: string;
    price: number;
    discountPercent?: number;
    discountedPrice?: number;
  }> | null;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  variant?: {
    id: string;
    label: string;
    price: number;
  };
  isReorder?: boolean;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  menuItem?: MenuItem;
  variant?: {
    id?: string;
    label?: string;
    price?: number;
  };
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber?: string;
  date: string;
  time: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  subTotal?: number;
  discount?: number;
  discountType?: "offer" | "coins";
  coinsUsed?: number;
  offerCode?: string;
  deliveryCharge?: number;
  paymentMethod: string;
  payment?: {
    status: string;
    method?: string;
  };
  orderType: string;
  createdAt?: string;
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
  refreshCart: () => Promise<void>;
  totalItems: number;
  subTotal: number;
  discountAmount: number;
  finalAmount: number;
  totalAmount: number;
  appliedOfferCode: string | null;
  discountType: "offer" | "coins" | null;
  coinsUsed: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  coinDeductionInfo: CoinDeductionResponse | null;
  isLoadingDeduction: boolean;
  refreshCoinDeduction: () => Promise<void>;
  applyCoins: () => Promise<{ success: boolean; message: string }>;
  removeCoins: () => Promise<void>;
  reorderCart: (orderId: string) => Promise<void>;
  coinRemovalNotice: CoinRemovalNotice | null;
  clearCoinRemovalNotice: () => void;
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  placeOrder: (
    guestName?: string,
    guestPhone?: string,
    details?: {
      orderType: "dine-in" | "delivery" | "pickup";
      deliveryAddress?: string;
      pickupTiming?: string;
      paymentPreference?: "CASH" | "ONLINE";
      checkoutScope?: "all" | "cart_only" | "reorder_only";
      keepRemaining?: boolean;
    }
  ) => Promise<any>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartTotal, setCartTotal] = useState<CartTotal>({
    subTotal: 0,
    discount: 0,
    deliveryCharge: 0,
    totalAmount: 0,
    coinsUsed: 0,
    coinStatus: "none",
  });
  const [isCartLoading, setIsCartLoading] = useState<boolean>(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Coin Deduction calculation state
  const [coinDeductionInfo, setCoinDeductionInfo] = useState<CoinDeductionResponse | null>(null);
  const [isLoadingDeduction, setIsLoadingDeduction] = useState<boolean>(false);
  const [coinRemovalNotice, setCoinRemovalNotice] = useState<CoinRemovalNotice | null>(null);
  const dismissedNoticesRef = useRef<Set<string>>(new Set());

  const getNoticeKey = (notice: CoinRemovalNotice) => {
    return `${notice.previousCoins}_${notice.currentSubTotal}_${notice.maxEligibleCoins}`;
  };

  const isNoticeDismissed = (key: string): boolean => {
    if (dismissedNoticesRef.current.has(key)) return true;
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem(`homely_notice_${key}`) === "1";
      } catch {
        return false;
      }
    }
    return false;
  };

  const markNoticeDismissed = (key: string) => {
    dismissedNoticesRef.current.add(key);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`homely_notice_${key}`, "1");
      } catch {}
    }
  };

  const handleSetCoinRemovalNotice = (notice?: CoinRemovalNotice) => {
    if (!notice || !notice.removed) {
      setCoinRemovalNotice(null);
      return;
    }
    const key = getNoticeKey(notice);
    if (isNoticeDismissed(key)) {
      return;
    }
    setCoinRemovalNotice(notice);
  };

  const clearCoinRemovalNotice = () => {
    if (coinRemovalNotice) {
      markNoticeDismissed(getNoticeKey(coinRemovalNotice));
    }
    setCoinRemovalNotice(null);
  };

  const fetchCoinDeduction = async (currentCartId?: string) => {
    if (!token) {
      setCoinDeductionInfo(null);
      setIsLoadingDeduction(false);
      return;
    }
    setIsLoadingDeduction(true);
    try {
      const { getCoinDeduction } = await import("@/services/cartService");
      const res = await getCoinDeduction(currentCartId || undefined);
      setCoinDeductionInfo(res);
    } catch (err) {
      console.error("Failed to fetch coin deduction info:", err);
    } finally {
      setIsLoadingDeduction(false);
    }
  };

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncSeqRef = useRef<number>(0);
  const lastConfirmedCartRef = useRef<CartItem[]>([]);
  const latestTargetCartRef = useRef<CartItem[]>([]);

  // Format backend cart items to CartItem format
  const formatBackendCartItems = (backendCart: any): CartItem[] => {
    if (!backendCart || !backendCart.items) return [];
    return backendCart.items
      .map((item: any) => {
        if (!item.menuItem) return null;
        return {
          item: {
            id: item.menuItem._id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            discountPercent: item.menuItem.discountPercent,
            discountedPrice: item.menuItem.discountedPrice,
            description: item.menuItem.description,
            image: item.menuItem.image?.url || item.menuItem.image || "",
            isSpecial: item.menuItem.isTodaySpecial || item.menuItem.isSpecial,
            tag: item.menuItem.tags?.[0] || "",
            category: typeof item.menuItem.category === "object" ? item.menuItem.category?.name || "General" : item.menuItem.category || "General",
            preparationTime: item.menuItem.preparationTime,
            tags: item.menuItem.tags,
            allergens: item.menuItem.allergens,
            status: item.menuItem.status,
          },
          quantity: item.quantity,
          variant: item.variant
            ? {
                id: item.variant._id || item.variant.id,
                label: item.variant.label,
                price: item.variant.price,
              }
            : undefined,
          isReorder: Boolean(item.isReorder),
        };
      })
      .filter(Boolean) as CartItem[];
  };

  // Helper: Fetch Cart
  const fetchCart = async () => {
    setIsCartLoading(true);
    try {
      if (!token) {
        // Public non-authenticated guest cart
        const savedPublicCart = localStorage.getItem(PUBLIC_CART_KEY);
        if (savedPublicCart) {
          try {
            const parsed = JSON.parse(savedPublicCart);
            setCart(parsed);
            lastConfirmedCartRef.current = parsed;
            latestTargetCartRef.current = parsed;
          } catch {
            setCart([]);
          }
        } else {
          setCart([]);
        }
        setIsCartLoading(false);
        return;
      }

      // Check if there is any guest cart stored locally to sync after login
      let publicCartItems: { menuItem: string; quantity: number; variant?: string }[] = [];
      try {
        const rawPublicCart = localStorage.getItem(PUBLIC_CART_KEY);
        if (rawPublicCart) {
          const parsed = JSON.parse(rawPublicCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            publicCartItems = parsed.map((c: any) => ({
              menuItem: c.item.id,
              quantity: c.quantity,
              variant: c.variant?.id,
            }));
          }
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
        if (syncedCart && syncedCart.items) {
          setCartId(syncedCart._id);
          setCartTotal(syncedCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
          const formattedItems = formatBackendCartItems(syncedCart);
          setCart(formattedItems);
          lastConfirmedCartRef.current = formattedItems;
          latestTargetCartRef.current = formattedItems;
          fetchCoinDeduction(syncedCart._id);
          return;
        }
      } else if (backendCart && backendCart.items) {
        setCartId(backendCart._id);
        setCartTotal(backendCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
        const formattedItems = formatBackendCartItems(backendCart);
        setCart(formattedItems);
        lastConfirmedCartRef.current = formattedItems;
        latestTargetCartRef.current = formattedItems;
        fetchCoinDeduction(backendCart._id);
      } else {
        setCart([]);
        setCartId(null);
        setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
        lastConfirmedCartRef.current = [];
        latestTargetCartRef.current = [];
        setCoinDeductionInfo(null);
      }
    } catch (err) {
      console.error("Failed to fetch backend cart:", err);
    } finally {
      setIsCartLoading(false);
    }
  };

  // Load cart from backend if authenticated + sync any pending public cart
  useEffect(() => {
    fetchCart();
  }, [token]);

  // Helper: Trigger 400ms debounced sync with sequence ID versioning and automatic rollback
  const triggerDebouncedSync = (targetCart: CartItem[]) => {
    latestTargetCartRef.current = targetCart;

    // Instantly compute optimistic subtotal for immediate UI responsiveness
    const optimisticSubTotal = targetCart.reduce((sum, c) => {
      const p = c.variant ? c.variant.price : (c.item.discountedPrice !== undefined ? c.item.discountedPrice : c.item.price);
      return sum + p * c.quantity;
    }, 0);
    setCartTotal((prev) => ({
      ...prev,
      subTotal: optimisticSubTotal,
      totalAmount: Math.max(0, optimisticSubTotal - (prev.discount || 0)),
    }));

    if (!token) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const currentSeq = ++syncSeqRef.current;
    const previousConfirmedCart = lastConfirmedCartRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const inputs = targetCart.map((c) => ({
          menuItem: c.item.id,
          quantity: c.quantity,
          variant: c.variant?.id,
          isReorder: Boolean(c.isReorder),
        }));
        const resCart = await syncBackendCart(inputs);

        // Discard stale in-flight response if another update occurred in the meantime
        if (currentSeq !== syncSeqRef.current) return;

        if (resCart) {
          setCartId(resCart._id);
          setCartTotal(resCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
          handleSetCoinRemovalNotice(resCart.total?.coinRemovalNotice);
          const confirmedItems = formatBackendCartItems(resCart);
          setCart(confirmedItems);
          lastConfirmedCartRef.current = confirmedItems;
          latestTargetCartRef.current = confirmedItems;
          // Trigger coin deduction fetch ONLY ONCE after debounced sync completes
          fetchCoinDeduction(resCart._id);
        } else {
          setCartId(null);
          setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
          setCart([]);
          lastConfirmedCartRef.current = [];
          latestTargetCartRef.current = [];
          setCoinDeductionInfo(null);
        }
      } catch (err) {
        if (currentSeq !== syncSeqRef.current) return;
        console.error("Backend cart sync failed. Rolling back frontend state to match backend:", err);
        try {
          const freshCart = await getBackendCart();
          if (freshCart && freshCart.items) {
            setCartId(freshCart._id);
            setCartTotal(freshCart.total || { subTotal: 0, discount: 0, totalAmount: 0 });
            const confirmedItems = formatBackendCartItems(freshCart);
            setCart(confirmedItems);
            lastConfirmedCartRef.current = confirmedItems;
            latestTargetCartRef.current = confirmedItems;
          } else {
            setCart([]);
            setCartId(null);
            setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
            lastConfirmedCartRef.current = [];
            latestTargetCartRef.current = [];
          }
        } catch (fetchErr) {
          setCart(previousConfirmedCart);
          latestTargetCartRef.current = previousConfirmedCart;
        }
      }
    }, 400);
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
    latestTargetCartRef.current = [];
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
        fetchCoinDeduction(resCart._id);
      }
    } catch (err) {
      console.error("Failed to remove offer:", err);
    }
  };

  const applyCoins = async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const { applyCoinsToCart } = await import("@/services/cartService");
      const resCart = await applyCoinsToCart(cartId || undefined);
      if (resCart) {
        setCartTotal(resCart.total);
        dismissedNoticesRef.current.clear();
        if (typeof window !== "undefined") {
          try {
            Object.keys(sessionStorage).forEach((k) => {
              if (k.startsWith("homely_notice_")) sessionStorage.removeItem(k);
            });
          } catch {}
        }
        setCoinRemovalNotice(null);
        const confirmedItems = formatBackendCartItems(resCart);
        setCart(confirmedItems);
        lastConfirmedCartRef.current = confirmedItems;
        return {
          success: true,
          message: `Redeemed ${resCart.total.coinsUsed || resCart.total.discount} Homely Coins for ₹${resCart.total.discount} discount!`,
        };
      }
      return { success: false, message: "Failed to apply coins." };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Failed to redeem Homely Coins.",
      };
    }
  };

  const removeCoins = async () => {
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const { removeCoinsFromCart } = await import("@/services/cartService");
      const resCart = await removeCoinsFromCart(cartId || undefined);
      if (resCart) {
        setCartTotal(resCart.total);
        setCoinRemovalNotice(null);
        const confirmedItems = formatBackendCartItems(resCart);
        setCart(confirmedItems);
        lastConfirmedCartRef.current = confirmedItems;
        fetchCoinDeduction(resCart._id);
      }
    } catch (err) {
      console.error("Failed to remove coins:", err);
    }
  };

  const reorderCart = async (orderId: string): Promise<void> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const { reorderCartApi } = await import("@/services/cartService");
    const resCart = await reorderCartApi(orderId);
    if (resCart) {
      setCartId(resCart._id);
      setCartTotal(resCart.total);
      const confirmedItems = formatBackendCartItems(resCart);
      setCart(confirmedItems);
      lastConfirmedCartRef.current = confirmedItems;
      latestTargetCartRef.current = confirmedItems;
      await fetchCoinDeduction(resCart._id);
    }
  };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const calculatedSubTotal = cart.reduce((sum, c) => {
    const itemUnitPrice = c.variant?.price ?? (c.item.discountedPrice !== undefined ? c.item.discountedPrice : c.item.price);
    return sum + itemUnitPrice * c.quantity;
  }, 0);
  const subTotal = cartTotal.subTotal > 0 ? cartTotal.subTotal : calculatedSubTotal;
  const discountAmount = cartTotal.discount || 0;
  const finalAmount = cartTotal.totalAmount > 0 ? cartTotal.totalAmount : Math.max(0, subTotal - discountAmount);
  const totalAmount = finalAmount;
  const appliedOfferCode = cartTotal.offerCode || null;
  const discountType = cartTotal.discountType || (appliedOfferCode ? "offer" : null);
  const coinsUsed = cartTotal.coinsUsed || 0;

  const placeOrder = async (
    guestName?: string,
    guestPhone?: string,
    details?: {
      orderType: "dine-in" | "delivery" | "pickup";
      deliveryAddress?: string;
      pickupTiming?: string;
      paymentPreference?: "CASH" | "ONLINE";
      checkoutScope?: "all" | "cart_only" | "reorder_only";
      keepRemaining?: boolean;
    }
  ): Promise<any> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const orderType = details?.orderType || "dine-in";
    const deliveryAddress = details?.deliveryAddress;
    const pickupTiming = details?.pickupTiming;
    const paymentPreference = details?.paymentPreference || "CASH";
    const checkoutScope = details?.checkoutScope || "all";
    const keepRemaining = Boolean(details?.keepRemaining);

    const payload = {
      orderType,
      deliveryAddress,
      pickupTiming,
      paymentPreference,
      checkoutScope,
      keepRemaining,
      guest: {
        name: guestName || "Guest User",
        phone: guestPhone || "0000000000",
      },
    };

    try {
      // Call dedicated POST /api/cart/checkout API
      const result = await checkoutCart(cartId || "", payload);

      if (paymentPreference === "ONLINE" && result?.requiresPayment) {
        // Online checkout session created! Do not clear cart yet.
        return result;
      }

      const createdOrder = result;
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
      if (keepRemaining) {
        await fetchCart();
      } else {
        setCart([]);
        setCartId(null);
        setCartTotal({ subTotal: 0, discount: 0, totalAmount: 0 });
        lastConfirmedCartRef.current = [];
      }
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
        discountType,
        coinsUsed,
        applyCoupon,
        removeCoupon,
        coinDeductionInfo,
        isLoadingDeduction,
        refreshCoinDeduction: () => fetchCoinDeduction(cartId || undefined),
        applyCoins,
        removeCoins,
        reorderCart,
        coinRemovalNotice,
        clearCoinRemovalNotice,
        refreshCart: fetchCart,
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
