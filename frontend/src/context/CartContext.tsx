"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getBackendCart, syncBackendCart, clearBackendCart } from "@/services/cartService";
import { createOrder } from "@/services/orderService";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  isSpecial?: boolean;
  tag?: string;
  category: string;
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
  addToCart: (item: MenuItem, variant?: { id: string; label: string; price: number }) => void;
  removeFromCart: (itemId: string, variantId?: string) => void;
  updateQuantity: (itemId: string, delta: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  orders: Order[];
  currentOrder: Order | null;
  placeOrder: (
    guestName?: string,
    guestPhone?: string,
    details?: { orderType: "dine-in" | "delivery" | "pickup"; deliveryAddress?: string; pickupTiming?: string }
  ) => Promise<any>;
}

const initialMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Deluxe Punjabi Thali",
    price: 220,
    description: "Rich paneer masala, dal makhani, naan, rice, curd, and sweet.",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
    isSpecial: true,
    tag: "Special",
    category: "Thali",
  },
  {
    id: "2",
    name: "Homestyle Paneer Thali",
    price: 150,
    description: "Paneer curry with dal, rice, 3 roti and fresh salad.",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
    category: "Thali",
  },
  {
    id: "3",
    name: "Aloo Paratha Combo",
    price: 90,
    description: "2 Stuffed aloo parathas with fresh curd and pickle.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    category: "Breakfast",
  },
  {
    id: "4",
    name: "Mixed Veg Pulao",
    price: 120,
    description: "Fragrant basmati rice cooked with fresh seasonal vegetables.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
    category: "Lunch",
  },
  {
    id: "5",
    name: "Special Veg Thali",
    price: 150,
    description: "Homestyle thali with 2 curries, 4 rotis, rice, and raita.",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80",
    category: "Thali",
  },
  {
    id: "6",
    name: "Homestyle Rajma Chawal",
    price: 180,
    description: "Comforting rajma curry served with hot steamed basmati rice.",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80",
    isSpecial: true,
    tag: "Special",
    category: "Lunch",
  },
];

const initialOrders: Order[] = [
  {
    id: "#HF1024",
    date: "Today",
    time: "12:30 PM",
    status: "Preparing",
    items: [
      { name: "Homestyle Rajma Chawal", quantity: 1, price: 180 },
      { name: "Paneer Butter Masala Combo", quantity: 1, price: 170 },
    ],
    totalAmount: 350,
    paymentMethod: "Offline / Cash",
    orderType: "dine-in",
  },
];

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrders[0]);

  // Load cart from backend if authenticated
  useEffect(() => {
    const fetchCart = async () => {
      if (!token) {
        setCart([]);
        return;
      }
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
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.item.id === item.id && c.variant?.id === variant?.id
      );
      let updated: CartItem[];
      if (existingIndex > -1) {
        updated = prev.map((c, idx) =>
          idx === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        updated = [...prev, { item, quantity: 1, variant }];
      }
      syncCartWithBackend(updated);
      return updated;
    });
  };

  const removeFromCart = (itemId: string, variantId?: string) => {
    setCart((prev) => {
      const updated = prev.filter((c) => !(c.item.id === itemId && c.variant?.id === variantId));
      syncCartWithBackend(updated);
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
      syncCartWithBackend(updated);
      return updated;
    });
  };

  const clearCart = async () => {
    setCart([]);
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
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        orders,
        currentOrder,
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
