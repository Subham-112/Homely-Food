"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Search,
  Power,
  Tag,
  Eye,
} from "lucide-react";
import Header from "@/components/Header";
import AdminBottomNav from "@/components/AdminBottomNav";
import {
  Category,
  CategoryStatus,
  getAllAdminCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "@/services/categoryService";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Debounce search query by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);

  // View Category Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedViewCategory, setSelectedViewCategory] = useState<Category | null>(null);
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: CategoryStatus;
  }>({
    name: "",
    description: "",
    status: "active",
  });

  // Fetch Categories List from API with status and debounced search
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = selectedStatus !== "all" ? (selectedStatus as CategoryStatus) : undefined;
      const data = await getAllAdminCategories(statusParam, debouncedSearch);
      setCategories(data);
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      setError(err?.message || "Failed to load categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Form Modal Open for Create
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      status: "active",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Modal Open for Edit
  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      status: category.status || "active",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle View Category Modal
  const handleOpenViewModal = async (id: string) => {
    setLoadingViewId(id);
    try {
      const cat = await getCategoryById(id);
      setSelectedViewCategory(cat);
      setIsViewModalOpen(true);
    } catch (err: any) {
      alert(err?.message || "Failed to load category details.");
    } finally {
      setLoadingViewId(null);
    }
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (editingCategory) {
        await updateCategory(editingCategory._id, payload);
      } else {
        await createCategory(payload);
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error("Save Category Error:", err);
      setFormError(err?.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Category Status (Active / Inactive)
  const handleToggleStatus = async (id: string) => {
    setStatusTogglingId(id);
    try {
      const updatedCategory = await toggleCategoryStatus(id);
      setCategories((prev) =>
        prev.map((cat) => (cat._id === id ? { ...cat, status: updatedCategory.status } : cat))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to toggle category status.");
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Soft Delete Category
  const handleDeleteCategory = async (id: string) => {
    setDeletingCategoryId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      setDeletingCategoryId(null);
    } catch (err: any) {
      alert(err?.message || "Failed to delete category.");
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#F4F8FA] relative">
      {/* Top Main Header */}
      <Header />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 max-w-5xl w-full mx-auto flex flex-col gap-2 pb-36 sm:pb-40">
        
        {/* Category Management Page Header */}
        <div className="bg-white rounded-2xl px-2 py-3 border border-[#E1ECEE] shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Link
              href="/admin"
              className="p-2 text-[#0B392B] hover:bg-[#0B392B]/10 rounded-xl transition-colors shrink-0"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base sm:text-xl font-extrabold text-[#0B251C] font-poppins tracking-tight flex items-center gap-2">
                Category Management
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search category by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 pl-10 pr-9 text-xs text-[#0F261C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B392B] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-500 shrink-0">Status:</span>
            <div className="flex bg-white p-1 rounded-xl border border-[#E1ECEE] shadow-2xs text-xs font-bold">
              {[
                { label: "All", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedStatus(tab.value)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedStatus === tab.value
                      ? "bg-[#0B392B] text-white shadow-2xs"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchCategories}
              className="text-red-700 underline font-bold hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Categories Grid List / Loading / Empty */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B392B]" />
            <span className="text-xs font-semibold">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-[#E1ECEE] text-center flex flex-col items-center gap-3 my-2 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0B392B] flex items-center justify-center">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#0B251C] text-sm">No categories found</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              {searchQuery
                ? `No categories matching "${searchQuery}".`
                : "No categories added yet. Click 'Add' above to create one."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const isActive = cat.status === "active";

              return (
                <div
                  key={cat._id}
                  className="bg-white rounded-2xl p-4 border border-[#E1ECEE] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 relative"
                >
                  {/* Top Card Section: Info */}
                  <div className="flex items-start gap-3">
                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-sm font-extrabold text-[#0B251C] truncate font-poppins">
                          {cat.name}
                        </h3>
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {cat.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                        slug: /{cat.slug}
                      </p>

                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-snug mt-1">
                        {cat.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-1 gap-2">
                    {/* Toggle Status Button */}
                    <button
                      onClick={() => handleToggleStatus(cat._id)}
                      disabled={statusTogglingId === cat._id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      }`}
                      title={isActive ? "Make Category Inactive" : "Make Category Active"}
                    >
                      {statusTogglingId === cat._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span>{isActive ? "Inactive" : "Active"}</span>
                    </button>

                    {/* Right Icon Actions: View, Edit, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenViewModal(cat._id)}
                        disabled={loadingViewId === cat._id}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                        title="View Category Details"
                      >
                        {loadingViewId === cat._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="p-1.5 text-[#0B392B] hover:bg-[#0B392B]/10 rounded-xl transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                            handleDeleteCategory(cat._id);
                          }
                        }}
                        disabled={deletingCategoryId === cat._id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        {deletingCategoryId === cat._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B251C] font-poppins">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">
                  {editingCategory ? "Update category information" : "Create a new menu category"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Starters, Main Course, Desserts"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2.5 px-3 text-xs font-medium text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary about this category..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white border border-[#E1ECEE] rounded-xl py-2 px-3 text-xs font-medium text-[#0F261C] focus:outline-none focus:border-[#0B392B]"
                />
              </div>

              {/* Status Radio / Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: "active" }))}
                    className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                      formData.status === "active"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: "inactive" }))}
                    className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                      formData.status === "inactive"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0B392B] hover:bg-[#07281E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {isViewModalOpen && selectedViewCategory && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-extrabold text-[#0B251C]">Category Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>



            {/* Details Box */}
            <div className="bg-[#FAF6ED] p-3.5 rounded-2xl border border-[#E8E1D3] flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500">Category Name:</span>
                <span className="font-extrabold text-[#0B251C]">{selectedViewCategory.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500">Slug:</span>
                <span className="font-mono text-gray-700">/{selectedViewCategory.slug}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500">Status:</span>
                <span
                  className={`font-bold capitalize ${
                    selectedViewCategory.status === "active" ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {selectedViewCategory.status}
                </span>
              </div>

              {selectedViewCategory.description && (
                <div className="border-t border-gray-200/60 pt-2 mt-1">
                  <span className="font-bold text-gray-500 block mb-0.5">Description:</span>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {selectedViewCategory.description}
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full bg-[#0B392B] hover:bg-[#07281E] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
}
