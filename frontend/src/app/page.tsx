"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import OffersSection from "@/components/home/OffersSection";
import TodaysSpecialSection from "@/components/home/TodaysSpecialSection";
import CategorySection from "@/components/home/CategorySection";
import MenuListSection from "@/components/home/MenuListSection";

import { useCart, MenuItem as CartMenuItem } from "@/context/CartContext";
import { getMenuItems, MenuItem as ApiMenuItem } from "@/services/menuItemService";
import { getCategoryList } from "@/services/categoryService";
import { getOffers, Offer } from "@/services/offerService";

export default function HomePage() {
  const { cart, addToCart, updateQuantity, totalItems, totalAmount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [categories, setCategories] = useState<string[]>(["All"]);
  const [menuItems, setMenuItems] = useState<CartMenuItem[]>([]);
  const [specialItems, setSpecialItems] = useState<CartMenuItem[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number>();
  const [loadingMore, setLoadingMore] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Top-to-Bottom Sequential Data Loading
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 1. Top Section: Active Offers & Promotions
        const offerRes = await getOffers({ type: "active" });
        setActiveOffers(offerRes);

        // 2. Middle Section: Category List
        const catRes = await getCategoryList();
        const catNames = ["All", ...catRes.map((c) => c.name)];
        setCategories(catNames);

        // 3. Bottom Section: Menu Items (Paginated: Page 1, Limit 10)
        const menuRes = await getMenuItems({ page: 1, limit: 10 });
        const items = menuRes.items.map((i: ApiMenuItem) => {
          const imgUrl = typeof i.image === "object" ? i.image?.url : (typeof i.image === "string" && i.image.trim()) ? i.image : "";
          return {
            id: i._id,
            name: i.name,
            price: i.price,
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
        });

        setMenuItems(items);
        setSpecialItems(items.filter((i) => i.isSpecial));
        setPage(1);
        setHasMore(menuRes.pagination ? menuRes.pagination.page < menuRes.pagination.totalPages : false);
        setTotal(Number(menuRes.pagination.total));
      } catch (err) {
        console.error("Failed to load home page data sequentially:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch next page of menu items when scrolling to bottom
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const menuRes = await getMenuItems({ page: nextPage, limit: 10 });
      const newItems = menuRes.items.map((i: ApiMenuItem) => {
        const imgUrl = typeof i.image === "object" ? i.image?.url : (typeof i.image === "string" && i.image.trim()) ? i.image : "";
        return {
          id: i._id,
          name: i.name,
          price: i.price,
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
      });

      setMenuItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewItems];
      });

      setPage(nextPage);
      setHasMore(menuRes.pagination ? menuRes.pagination.page < menuRes.pagination.totalPages : false);
    } catch (err) {
      console.error("Failed to fetch next page of menu items:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, loading]);

  // Infinite Scroll Listener
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
      if (hasMore && !loadingMore && !loading) {
        loadNextPage();
      }
    }
  };

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const getItemQuantity = (id: string) => {
    const found = cart.find((c) => c.item.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Section with Infinite Scroll Listener */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-3 pb-24"
      >
        {/* 1. Offers & Promotions Section (Top API Call) */}
        <OffersSection offers={activeOffers} />

        {/* 2. Today's Special Section */}
        <TodaysSpecialSection
          specialItems={specialItems}
          getItemQuantity={getItemQuantity}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
        />

        {/* 3. Category Filter Section (Second API Call) */}
        <CategorySection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalItemsCount={total}
        />

        {/* 4. Menu Items Section (Paginated API Calls: Page 1, limit=10 -> Page 2, limit=10...) */}
        <MenuListSection
          filteredItems={filteredItems}
          selectedCategory={selectedCategory}
          loading={loading}
          loadingMore={loadingMore}
          getItemQuantity={getItemQuantity}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
        />
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-50 group">
          {/* Default Compact Floating Icon */}
          <div className="flex items-center justify-center bg-[#C51E1E] text-white p-3.5 rounded-full shadow-2xl cursor-pointer group-hover:opacity-0 group-hover:scale-75 group-hover:pointer-events-none border-2 border-white transition-all duration-300 transform">
            <div className="relative flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" />
              <span className="absolute -top-3 -right-3 bg-white text-[#C51E1E] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-[#C51E1E]">
                {totalItems}
              </span>
            </div>
          </div>

          {/* Hover Expanding Container */}
          <div className="absolute bottom-0 right-0 opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto bg-[#C51E1E] text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 w-72 sm:w-80 border border-white/30 transition-all duration-300 origin-bottom-right transform">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wide">
                {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span className="text-xs font-bold opacity-90">
                Total: ₹{totalAmount}
              </span>
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
