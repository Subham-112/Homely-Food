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
import Footer from "@/components/Footer";

import HomelyCoinCard from "@/components/HomelyCoinCard";

import { useCart, MenuItem as CartMenuItem } from "@/context/CartContext";
import { getMenuItems, MenuItem as ApiMenuItem } from "@/services/menuItemService";
import { getCategoryList } from "@/services/categoryService";
import { getOffers, Offer } from "@/services/offerService";

import { useAuth } from "@/context/AuthContext";
import { getPublicCoinConfig } from "@/services/coinService";
import { WelcomeBonusModal } from "@/components/WelcomeBonusModal";

export default function HomePage() {
  const { cart, addToCart, updateQuantity, totalItems, totalAmount } = useCart();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeBonusCoins, setWelcomeBonusCoins] = useState(50);

  useEffect(() => {
    if (!user) return;

    const checkWelcomeModal = async () => {
      if (typeof window !== "undefined") {
        const hasShown = localStorage.getItem(`welcome_modal_shown_${user._id}`);
        if (!hasShown && user.welcomeRewardClaimed) {
          try {
            const config = await getPublicCoinConfig();
            if (config && config.welcomeBonusCoins) {
              setWelcomeBonusCoins(config.welcomeBonusCoins);
            }
          } catch (err) {
            console.error("Failed to load coin config:", err);
          }
          setShowWelcomeModal(true);
          localStorage.setItem(`welcome_modal_shown_${user._id}`, "true");
        }
      }
    };

    checkWelcomeModal();
  }, [user]);

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

        // 3. Middle Section: Today's Special Items (isTodaySpecial=true API call)
        const specialRes = await getMenuItems({ isTodaySpecial: true, limit: 20 });
        const specials = specialRes.items.map((i: ApiMenuItem) => {
          const imgUrl = typeof i.image === "object" ? i.image?.url : (typeof i.image === "string" && i.image.trim()) ? i.image : "";
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
            variants: i.variants || null,
          };
        });
        setSpecialItems(specials);

        // 4. Bottom Section: Menu Items (Paginated: Page 1, Limit 10)
        const menuRes = await getMenuItems({ page: 1, limit: 10 });
        const items = menuRes.items.map((i: ApiMenuItem) => {
          const imgUrl = typeof i.image === "object" ? i.image?.url : (typeof i.image === "string" && i.image.trim()) ? i.image : "";
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
            variants: i.variants || null,
          };
        });

        setMenuItems(items);
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

  const isFirstRender = useRef(true);

  // Fetch next page of menu items when scrolling to bottom
  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const menuRes = await getMenuItems({
        page: nextPage,
        limit: 10,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
      });
      const newItems = menuRes.items.map((i: ApiMenuItem) => {
        const imgUrl = typeof i.image === "object" ? i.image?.url : (typeof i.image === "string" && i.image.trim()) ? i.image : "";
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
          variants: i.variants || null,
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
  }, [page, hasMore, loadingMore, loading, selectedCategory]);

  // When category changes, reset pagination and fetch page 1
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchCategoryItems = async () => {
      setLoading(true);
      try {
        const menuRes = await getMenuItems({
          page: 1,
          limit: 10,
          category: selectedCategory !== "All" ? selectedCategory : undefined,
        });
        const items = menuRes.items.map((i: ApiMenuItem) => {
          const imgUrl = typeof i.image === "object" ? i.image?.url : (typeof i.image === "string" && i.image.trim()) ? i.image : "";
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
            variants: i.variants || null,
          };
        });

        setMenuItems(items);
        setPage(1);
        setHasMore(menuRes.pagination ? menuRes.pagination.page < menuRes.pagination.totalPages : false);
        setTotal(Number(menuRes.pagination.total));
      } catch (err) {
        console.error("Failed to load category menu items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryItems();
  }, [selectedCategory]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Trigger loading next page when user scrolls near the end of MenuListSection (before footer)
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadNextPage();
        }
      },
      {
        root,
        rootMargin: "300px", // Preload when within 300px of menu list end
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadNextPage]);

  // Fallback Infinite Scroll Listener
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 350) {
      if (hasMore && !loadingMore && !loading) {
        loadNextPage();
      }
    }
  };

  const filteredItems = menuItems;

  const getItemQuantity = (id: string) => {
    const found = cart.find((c) => c.item.id === id);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF6ED] relative">
      {/* Fixed Top Header */}
      <Header />

      {/* Middle Scrollable Section */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-3 pb-24"
      >
        {/* 0. User Homely Coin Wallet Card (Top Header Section) */}
        {user && <HomelyCoinCard showActionLink={true} />}

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

        {/* 4. Menu Items Section */}
        <MenuListSection
          filteredItems={filteredItems}
          selectedCategory={selectedCategory}
          loading={loading}
          loadingMore={loadingMore}
          getItemQuantity={getItemQuantity}
          addToCart={addToCart}
          updateQuantity={updateQuantity}
          sentinelRef={sentinelRef}
        />

        {/* 5. Shop Details Footer (Spans edge-to-edge independently) */}
        <div className="-mx-3.5 sm:-mx-5 -mb-24 pt-4">
          <Footer />
        </div>
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

      {/* Welcome Bonus Modal */}
      <WelcomeBonusModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        bonusAmount={welcomeBonusCoins}
      />

      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
