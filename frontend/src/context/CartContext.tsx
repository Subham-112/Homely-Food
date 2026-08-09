"use client";

import React, { createContext, useContext, useState } from "react";

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
  status: "Accepted" | "Preparing" | "Ready" | "Completed";
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  orders: Order[];
  currentOrder: Order | null;
  placeOrder: (guestName?: string, guestPhone?: string) => Order;
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
  },
  {
    id: "#HF1019",
    date: "Yesterday",
    time: "08:15 PM",
    status: "Completed",
    items: [
      { name: "Deluxe Punjabi Thali", quantity: 1, price: 220 },
      { name: "Aloo Paratha Combo", quantity: 1, price: 90 },
    ],
    totalAmount: 310,
    paymentMethod: "Offline / Cash",
  },
  {
    id: "#HF1008",
    date: "05 Aug 2026",
    time: "01:45 PM",
    status: "Completed",
    items: [
      { name: "Special Veg Thali", quantity: 2, price: 150 },
    ],
    totalAmount: 300,
    paymentMethod: "Offline / Cash",
  },
];

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([
    {
      item: initialMenuItems[4], // Special Veg Thali
      quantity: 2,
    },
    {
      item: initialMenuItems[2], // Aloo Paratha Combo
      quantity: 1,
    },
  ]);

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrders[0]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalAmount = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const placeOrder = (): Order => {
    const newOrderNo = "#HF" + Math.floor(1000 + Math.random() * 9000);
    const newOrderItems = cart.length > 0 ? cart.map((c) => ({
      name: c.item.name,
      quantity: c.quantity,
      price: c.item.price,
    })) : [
      { name: "Homestyle Rajma Chawal", quantity: 1, price: 180 },
      { name: "Paneer Butter Masala Combo", quantity: 1, price: 170 },
    ];

    const newOrder: Order = {
      id: newOrderNo,
      date: "Just Now",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Accepted",
      items: newOrderItems,
      totalAmount: totalAmount > 0 ? totalAmount : 350,
      paymentMethod: "Offline / Cash",
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    setCart([]);
    return newOrder;
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
