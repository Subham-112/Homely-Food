import { Fetch, Post, Put, Patch, Delete } from "@/utils/api";

export type CategoryStatus = "active" | "inactive";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryListItem {
  _id: string;
  name: string;
  itemCount?: number;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// User/Public Category list
export const getCategoryList = async (): Promise<CategoryListItem[]> => {
  const response = await Fetch<ApiResponse<CategoryListItem[]>>("/api/category/list");
  return response.data || [];
};

// Admin: Get all categories (active & inactive, optional search filter)
export const getAllAdminCategories = async (status?: CategoryStatus, search?: string): Promise<Category[]> => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search && search.trim()) params.append("search", search.trim());
  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await Fetch<ApiResponse<Category[]>>(`/api/category/admin/all${queryString}`);
  return response.data || [];
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await Fetch<ApiResponse<Category>>(`/api/category/${id}`);
  return response.data;
};

// Admin: Create new category
export const createCategory = async (payload: { name: string; description?: string; status?: CategoryStatus }): Promise<Category> => {
  const response = await Post<ApiResponse<Category>>("/api/category", payload);
  return response.data;
};

// Admin: Update existing category
export const updateCategory = async (id: string, payload: Partial<{ name: string; description?: string; status?: CategoryStatus }>): Promise<Category> => {
  const response = await Put<ApiResponse<Category>>(`/api/category/${id}`, payload);
  return response.data;
};

// Admin: Toggle category status
export const toggleCategoryStatus = async (id: string): Promise<Category> => {
  const response = await Patch<ApiResponse<Category>>(`/api/category/${id}/status`, {});
  return response.data;
};

// Admin: Soft delete category
export const deleteCategory = async (id: string): Promise<void> => {
  await Delete<ApiResponse<void>>(`/api/category/${id}`);
};

