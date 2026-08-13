"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  X,
  ShoppingBag,
  UtensilsCrossed,
  Clock,
  Star,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { getMenuItems, MenuItem as ApiMenuItem } from "@/services/menuItemService";
import { getCategoryList } from "@/services/categoryService";
import { usePublicCart, PublicCartItem } from "@/context/PublicCartContext";
import VegBadge from "@/components/VegBadge";
import QuantitySelector from "@/components/QuantitySelector";

export default function PublicAllItemsPage() {
  const {
    publicCart,
    addToPublicCart,
    updatePublicCartQuantity,
    publicCartTotalItems,
    publicCartSubTotal,
  } = usePublicCart();

  const [menuItems, setMenuItems] = useState<PublicCartItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Helper to map API item to our internal shape
  const mapItem = (i: ApiMenuItem): PublicCartItem => {
    const imgUrl =
      typeof i.image === "object"
        ? i.image?.url || ""
        : typeof i.image === "string" && i.image.trim()
        ? i.image
        : "";
    return {
      id: i._id,
      name: i.name,
      price: i.price,
      description: i.description || "",
      image: imgUrl || "/default-food.jpg",
      category:
        typeof i.category === "object" ? (i.category as any)?.name || "" : i.category || "",
      preparationTime: i.preparationTime,
      quantity: 0,
    };
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [catRes, menuRes] = await Promise.all([
          getCategoryList(),
          getMenuItems({ page: 1, limit: 10 }),
        ]);
        setCategories(["All", ...catRes.map((c) => c.name)]);
        const items = menuRes.items.map(mapItem);
        setMenuItems(items);
        setPage(1);
        setHasMore(
          menuRes.pagination
            ? menuRes.pagination.page < menuRes.pagination.totalPages
            : false
        );
      } catch (err) {
        console.error("Failed to load public menu:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Load more pages
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const menuRes = await getMenuItems({ page: nextPage, limit: 10 });
      const newItems = menuRes.items.map(mapItem);
      setMenuItems((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(
        menuRes.pagination
          ? menuRes.pagination.page < menuRes.pagination.totalPages
          : false
      );
    } catch (err) {
      console.error("Failed to load more items:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, page]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "150px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Filtered items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCartQty = (itemId: string, variantId?: string) => {
    const found = publicCart.find((c) => c.id === itemId && c.variant?.id === variantId);
    return found ? found.quantity : 0;
  };

  const handleAdd = (item: PublicCartItem) => {
    addToPublicCart(item);
  };

  return (
    <div className="min-h-screen bg-[#FAF6ED] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F4F9FA] border-b border-[#E3EEF0] shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-[#0B392B] font-poppins tracking-tight">
              Homely Foods
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Leaf className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />
              <span className="text-[9px] font-extrabold text-emerald-600 tracking-widest uppercase">
                Pure Veg
              </span>
              <Leaf className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500 -scale-x-100" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-bold text-[#0B392B] hover:bg-[#0B392B]/10 px-3 py-1.5 rounded-xl transition-all"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold bg-[#0B392B] text-white hover:bg-[#07281E] px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="sticky top-[57px] z-30 bg-[#FAF6ED] border-b border-[#E8E1D3] px-4 py-2.5">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-[#E8E1D3] text-sm font-medium text-[#0B251C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B392B]/20 focus:border-[#0B392B] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="sticky top-[113px] z-20 bg-[#FAF6ED] px-4 py-2 border-b border-[#E8E1D3]">
        <div className="max-w-5xl mx-auto overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0B392B] text-white shadow-sm"
                    : "bg-white text-[#0B392B] border border-[#E8E1D3] hover:bg-[#0B392B]/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={scrollRef} className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 pb-36">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <span className="text-sm font-semibold">Loading menu...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 flex flex-col items-center gap-3 text-center border border-[#E8E1D3] shadow-xs mt-4">
            <UtensilsCrossed className="w-12 h-12 text-gray-300" />
            <p className="font-bold text-[#0B251C]">No items found</p>
            <p className="text-sm text-gray-500">
              No dishes available for &ldquo;{selectedCategory}&rdquo;
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const qty = getCartQty(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3 border border-[#EBE5D8] shadow-xs hover:shadow-sm hover:border-[#0B392B]/30 transition-all flex items-center gap-3.5"
                >
                  {/* Image */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                    <img
                      src={item.image || "/default-food.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/default-food.jpg";
                      }}
                    />
                    {item.preparationTime && (
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Clock className="w-2 h-2" />
                        {item.preparationTime}m
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between h-full py-0.5 min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-sm font-extrabold text-[#0B251C] truncate font-poppins">
                          {item.name}
                        </h3>
                        <VegBadge size={15} />
                      </div>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-snug mt-1">
                        {item.description ||
                          "Authentic home cooked dish prepared fresh with natural ingredients."}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100/80">
                      <span className="font-extrabold text-base text-[#0B251C]">
                        ₹{item.price}
                      </span>
                      {qty > 0 ? (
                        <QuantitySelector
                          quantity={qty}
                          onIncrease={() => updatePublicCartQuantity(item.id, 1)}
                          onDecrease={() => updatePublicCartQuantity(item.id, -1)}
                          size="sm"
                        />
                      ) : (
                        <button
                          onClick={() => handleAdd(item)}
                          className="bg-[#0B392B] hover:bg-[#07281E] text-white text-xs font-extrabold px-5 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {loadingMore && (
          <div className="py-6 flex items-center justify-center gap-2 text-gray-500 text-xs font-semibold">
            <Loader2 className="w-5 h-5 animate-spin text-[#0B392B]" />
            Loading more dishes...
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {publicCartTotalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 max-w-lg mx-auto">
          <Link
            href="/public/cart"
            className="flex items-center justify-between bg-[#0B392B] text-white rounded-2xl px-5 py-3.5 shadow-xl active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-lg px-2 py-1 text-xs font-extrabold">
                {publicCartTotalItems}
              </div>
              <span className="text-sm font-bold">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold">₹{publicCartSubTotal.toFixed(2)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
