"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, X, Loader2, UtensilsCrossed, ShoppingBag, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CategorySection from "@/components/home/CategorySection";
import MenuItemCard from "@/components/MenuItemCard";
import Footer from "@/components/Footer";
import { useCart, MenuItem as CartMenuItem } from "@/context/CartContext";
import { getMenuItems, MenuItem as ApiMenuItem } from "@/services/menuItemService";
import { getCategoryList } from "@/services/categoryService";

export default function AllItemsPage() {
  const { cart, addToCart, updateQuantity, totalItems, totalAmount } = useCart();

  const [menuItems, setMenuItems] = useState<CartMenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItemsCount, setTotalItemsCount] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Map API item to CartMenuItem
  const mapItem = (i: ApiMenuItem): CartMenuItem => {
    const imgUrl =
      typeof i.image === "object"
        ? i.image?.url
        : typeof i.image === "string" && i.image.trim()
        ? i.image
        : "";
    return {
      id: i._id,
      name: i.name,
      price: i.price,
      discountPercent: i.discountPercent,
      discountedPrice: i.discountedPrice,
      description: i.description || "",
      image: imgUrl || "/default-food.jpg",
      isSpecial: i.isTodaySpecial,
      tag: i.isTodaySpecial ? "Special" : undefined,
      category: typeof i.category === "object" ? (i.category as any)?.name : i.category || "",
      preparationTime: i.preparationTime,
      status: i.status,
      tags: i.tags,
      allergens: i.allergens,
    };
  };

  // Initial Load
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [catList, menuRes] = await Promise.all([
          getCategoryList(),
          getMenuItems({ page: 1, limit: 10 }),
        ]);

        const catNames = ["All", ...catList.map((c: any) => c.name)];
        setCategories(catNames);
        const mapped = menuRes.items.map(mapItem);
        setMenuItems(mapped);
        setPage(1);
        setHasMore(menuRes.pagination ? menuRes.pagination.page < menuRes.pagination.totalPages : false);
        setTotalItemsCount(Number(menuRes.pagination.total || mapped.length));
      } catch (err) {
        console.error("Failed to load initial menu for All Items page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Infinite Scroll Load Next Page
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const menuRes = await getMenuItems({ page: nextPage, limit: 10 });
      const newMapped = menuRes.items.map(mapItem);

      setMenuItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNewItems = newMapped.filter((item) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewItems];
      });

      setPage(nextPage);
      setHasMore(menuRes.pagination ? menuRes.pagination.page < menuRes.pagination.totalPages : false);
    } catch (err) {
      console.error("Failed to load next page on All Items page:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, loading]);

  // Handle Scroll to End
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      if (hasMore && !loadingMore && !loading) {
        loadNextPage();
      }
    }
  };

  // Filtered Menu Items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getItemQuantity = (id: string) => {
    const found = cart.find((c) => c.item.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Header */}
      <Header />

      {/* Main Scroll Container with Infinite Scroll */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-24"
      >
        {/* Page Top Title Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="w-9 h-9 rounded-2xl bg-white border border-[#E8E1D3] flex items-center justify-center text-[#0B251C] hover:bg-gray-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C] font-poppins">
                All Menu Dishes
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Explore our complete range of delicious home-cooked meals
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search all menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-[#E8E1D3] text-xs sm:text-sm font-medium text-[#0B251C] placeholder-gray-400 focus:outline-none focus:border-[#0B392B] shadow-2xs transition-all"
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

        {/* Categories Section */}
        <CategorySection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalItemsCount={totalItemsCount}
        />

        {/* Menu Items Section */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <span className="text-xs font-semibold">Loading all menu items...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E1D3] flex flex-col items-center justify-center gap-3 my-2 shadow-2xs">
            <UtensilsCrossed className="w-12 h-12 text-gray-300" />
            <p className="text-base font-bold text-[#0B251C]">No items found</p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs">
              No dishes found in category &ldquo;{selectedCategory}&rdquo;
              {searchQuery ? ` matching "${searchQuery}"` : ""}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getItemQuantity(item.id)}
                  onAdd={(itemToAdd) => addToCart(itemToAdd as any)}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>

            {/* Loading More Spinner at List Bottom */}
            {loadingMore && (
              <div className="py-6 flex items-center justify-center text-gray-500 gap-2 text-xs font-semibold">
                <Loader2 className="w-5 h-5 animate-spin text-[#0B392B]" />
                <span>Loading more delicious dishes...</span>
              </div>
            )}
          </div>
        )}

        {/* Shop Details Footer */}
        <div className="-mx-3.5 sm:-mx-5 -mb-24 pt-4">
          <Footer />
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-50 group">
          <div className="flex items-center justify-center bg-[#C51E1E] text-white p-3.5 rounded-full shadow-2xl cursor-pointer group-hover:opacity-0 group-hover:scale-75 group-hover:pointer-events-none border-2 border-white transition-all duration-300 transform">
            <div className="relative flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute -top-3 -right-3 bg-white text-[#C51E1E] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-[#C51E1E]">
                {totalItems}
              </span>
            </div>
          </div>

          <div className="absolute bottom-0 right-0 opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto bg-[#C51E1E] text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 w-72 sm:w-80 border border-white/30 transition-all duration-300 origin-bottom-right transform">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wide">
                {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span className="text-xs font-bold opacity-90">Total: ₹{totalAmount}</span>
            </div>

            <Link
              href="/cart"
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-white/30 whitespace-nowrap"
            >
              View Cart <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
