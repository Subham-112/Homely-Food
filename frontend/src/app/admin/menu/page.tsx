"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Upload,
} from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import VegBadge from "@/components/VegBadge";
import {
  MenuItem,
  MenuItemStatus,
  PaginationMeta,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemStatus,
  deleteMenuItem,
  CreateMenuItemPayload,
} from "@/services/menuItemService";
import { getCategoryList, CategoryListItem } from "@/services/categoryService";

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(9);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Image File Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    description: string;
    price: string;
    preparationTime: string;
    status: MenuItemStatus;
    isTodaySpecial: boolean;
    tags: string;
    allergens: string;
  }>({
    name: "",
    category: "",
    description: "",
    price: "",
    preparationTime: "15",
    status: "available",
    isTodaySpecial: false,
    tags: "",
    allergens: "",
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await getCategoryList();
      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getMenuItems({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        status: selectedStatus === "all" ? undefined : (selectedStatus as MenuItemStatus),
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
      });

      setItems(result.items);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error("Failed to load menu data:", err);
      setError(err?.message || "Failed to load menu data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, debouncedSearch, page, limit]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("Image file size exceeds the 2MB limit. Please select a smaller file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFormError(null);
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setImageFile(null);
    setImagePreview("");
    setFormData({
      name: "",
      category: categories.length > 0 ? categories[0]._id : "",
      description: "",
      price: "",
      preparationTime: "15",
      status: "available",
      isTodaySpecial: false,
      tags: "",
      allergens: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    const categoryId = typeof item.category === "object" ? item.category._id : item.category;
    const imageUrl = typeof item.image === "object" ? item.image?.url || "" : item.image || "";

    setImageFile(null);
    setImagePreview(imageUrl);

    setFormData({
      name: item.name || "",
      category: categoryId || (categories.length > 0 ? categories[0]._id : ""),
      description: item.description || "",
      price: item.price !== undefined ? item.price.toString() : "",
      preparationTime: item.preparationTime ? item.preparationTime.toString() : "15",
      status: item.status || "available",
      isTodaySpecial: !!item.isTodaySpecial,
      tags: item.tags ? item.tags.join(", ") : "",
      allergens: item.allergens ? item.allergens.join(", ") : "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0]._id }));
    }
  }, [categories, formData.category]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Menu item name is required.");
      return;
    }
    const effectiveCategory = formData.category || (categories.length > 0 ? categories[0]._id : "");
    if (!effectiveCategory) {
      setFormError("Please select a category.");
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Please enter a valid non-negative price.");
      return;
    }

    const payload: CreateMenuItemPayload = {
      name: formData.name.trim(),
      category: effectiveCategory,
      description: formData.description.trim(),
      price: priceNum,
      preparationTime: parseInt(formData.preparationTime) || 15,
      status: formData.status,
      isTodaySpecial: formData.isTodaySpecial,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      allergens: formData.allergens ? formData.allergens.split(",").map((a) => a.trim()).filter(Boolean) : [],
      imageFile,
      image: !imageFile && imagePreview ? imagePreview : undefined,
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await updateMenuItem(editingItem._id, payload);
      } else {
        await createMenuItem(payload);
      }
      setIsModalOpen(false);
      await fetchItems();
      await loadCategories(); // Refresh category counts
    } catch (err: any) {
      console.error("Failed to save menu item:", err);
      setFormError(err?.message || "Failed to save menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: MenuItem) => {
    const newStatus: MenuItemStatus = item.status === "available" ? "unavailable" : "available";

    // Optimistic state update
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, status: newStatus } : i))
    );

    try {
      await toggleMenuItemStatus(item._id, newStatus);
    } catch (err: any) {
      console.error("Failed to toggle status:", err);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, status: item.status } : i))
      );
      alert(err?.message || "Failed to toggle status.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      setIsSubmitting(true);
      await deleteMenuItem(id);
      setDeletingItemId(null);
      await fetchItems();
      await loadCategories();
    } catch (err: any) {
      console.error("Failed to delete item:", err);
      alert(err?.message || "Failed to delete menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F8FA] relative font-sans">
      {/* Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-4 pb-24">
        {/* Title & Action Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B251C]">
              Menu Management
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage items, prices, filters & image uploads.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>

        {/* Search & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-2.5 rounded-2xl border border-gray-100/90 shadow-2xs">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium pl-1">
              <Filter className="w-3.5 h-3.5 text-[#0B392B]" />
              <span className="hidden sm:inline">Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B] bg-white font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            {/* Per Page Limit Dropdown */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B] bg-white font-medium"
              title="Items per page"
            >
              <option value={6}>6 / page</option>
              <option value={9}>9 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-[#0B392B] text-white shadow-sm"
                : "bg-[#EBF4FA] text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => handleCategoryChange(cat._id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-[#0B392B] text-white shadow-sm"
                    : "bg-[#EBF4FA] text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.name} {cat.itemCount !== undefined ? `(${cat.itemCount})` : ""}
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchItems}
              className="text-red-700 underline font-bold hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <p className="text-xs font-medium">Loading items for page {page}...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center flex flex-col items-center gap-3 my-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0B392B] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">No menu items found</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              {debouncedSearch
                ? `No items matching "${debouncedSearch}".`
                : "No menu items found for the selected filters."}
            </p>
          </div>
        ) : (
          /* Item Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const categoryName =
                typeof item.category === "object"
                  ? item.category?.name
                  : categories.find((c) => c._id === item.category)?.name || "Uncategorized";

              const isAvailable = item.status === "available";
              const imageUrl =
                typeof item.image === "object" ? item.image?.url : item.image;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl p-3 border border-gray-100/90 shadow-xs flex items-center gap-3 relative group hover:shadow-md transition-shadow"
                >
                  {/* Image with Veg badge overlay */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                    <img
                      src={
                        imageUrl ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
                      }
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <VegBadge size={14} />
                    </div>
                    {item.isTodaySpecial && (
                      <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                        Special
                      </div>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 flex flex-col justify-between h-24 py-0.5 min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-extrabold text-sm text-[#0B251C] truncate" title={item.name}>
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="text-gray-400 hover:text-[#0B392B] p-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItemId(item._id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 block -mt-0.5">
                        {categoryName}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="font-extrabold text-base text-[#0B251C]">
                        ₹{item.price}
                      </span>
                      {item.preparationTime && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {item.preparationTime} mins
                        </span>
                      )}
                    </div>

                    {/* Available Toggle Switch */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span
                        className={`text-xs font-semibold ${
                          isAvailable ? "text-emerald-700" : "text-gray-400"
                        }`}
                      >
                        {isAvailable ? "Available" : "Out of Stock"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          isAvailable ? "bg-[#2563EB]" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            isAvailable ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && pagination.total > 0 && (
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
            <div className="text-xs text-gray-500 font-medium">
              Showing{" "}
              <span className="font-extrabold text-[#0B251C]">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-extrabold text-[#0B251C]">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-extrabold text-[#0B251C]">{pagination.total}</span> items
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={!pagination.hasPrevPage || loading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pageNum === pagination.page
                          ? "bg-[#0B392B] text-white shadow-xs"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </div>

              <button
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-extrabold text-[#0B251C]">
                {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Paneer Thali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category || (categories[0]?._id ?? "")}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B] bg-white"
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="250"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the item..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MenuItemStatus })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B] bg-white"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              {/* Local File Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Item Image (Upload from Device)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center group shadow-2xs">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/90 hover:bg-white text-gray-900 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1 transition-transform active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#0B392B]" /> Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1 transition-transform active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-gray-200 hover:border-[#0B392B] rounded-2xl bg-gray-50 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-[#0B392B]">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-extrabold text-gray-700">
                      Click to upload image
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      PNG, JPG, WEBP up to 2MB
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Spicy, Bestseller"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Allergens (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Dairy, Nuts"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B392B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isTodaySpecial"
                  checked={formData.isTodaySpecial}
                  onChange={(e) => setFormData({ ...formData, isTodaySpecial: e.target.checked })}
                  className="rounded border-gray-300 text-[#0B392B] focus:ring-[#0B392B] cursor-pointer"
                />
                <label htmlFor="isTodaySpecial" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Mark as Today's Special ⭐
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Delete Menu Item</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this menu item? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingItemId(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deletingItemId)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
