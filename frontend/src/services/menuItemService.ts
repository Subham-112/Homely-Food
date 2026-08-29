import { Fetch, Post, Put, Patch, Delete } from "@/utils/api";

export type MenuItemStatus = "available" | "unavailable";

export interface CategoryInfo {
  _id: string;
  name: string;
  slug?: string;
}

export interface ImageObject {
  url: string;
  publicId?: string;
  key?: string;
  name?: string;
  size?: number;
  mimetype?: string;
}

export interface MenuItemVariantItem {
  _id?: string;
  label: string;
  price: number;
  status?: "active" | "inactive";
}

export interface MenuItem {
  _id: string;
  name: string;
  category: CategoryInfo | string;
  description?: string;
  status: MenuItemStatus;
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  preparationTime?: number;
  priority?: number;
  tags?: string[];
  allergens?: string[];
  image?: ImageObject | string;
  isTodaySpecial?: boolean;
  variants?: MenuItemVariantItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuItemPayload {
  name: string;
  category: string;
  description?: string;
  status?: MenuItemStatus;
  price: number;
  discountPercent?: number;
  preparationTime?: number;
  priority?: number;
  tags?: string[];
  allergens?: string[];
  image?: string;
  imageFile?: File | null;
  isTodaySpecial?: boolean;
  variants?: MenuItemVariantItem[];
}

export type UpdateMenuItemPayload = Partial<CreateMenuItemPayload>;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedMenuItems {
  items: MenuItem[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export const getMenuItems = async (query?: {
  category?: string;
  status?: MenuItemStatus;
  isTodaySpecial?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedMenuItems> => {
  const params: Record<string, unknown> = {};
  if (query?.category) params.category = query.category;
  if (query?.status) params.status = query.status;
  if (query?.isTodaySpecial !== undefined) params.isTodaySpecial = query.isTodaySpecial;
  if (query?.search) params.search = query.search;
  if (query?.page) params.page = query.page;
  if (query?.limit) params.limit = query.limit;

  const response = await Fetch<ApiResponse<PaginatedMenuItems | MenuItem[]>>("/api/menu-item", params);

  if (Array.isArray(response.data)) {
    return {
      items: response.data,
      pagination: {
        total: response.data.length,
        page: 1,
        limit: response.data.length || 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  return (
    response.data || {
      items: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }
  );
};

export const getAdminMenuItems = async (query?: {
  category?: string;
  status?: MenuItemStatus;
  isTodaySpecial?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedMenuItems> => {
  const params: Record<string, unknown> = {};
  if (query?.category) params.category = query.category;
  if (query?.status) params.status = query.status;
  if (query?.isTodaySpecial !== undefined) params.isTodaySpecial = query.isTodaySpecial;
  if (query?.search) params.search = query.search;
  if (query?.page) params.page = query.page;
  if (query?.limit) params.limit = query.limit;

  const response = await Fetch<ApiResponse<PaginatedMenuItems | MenuItem[]>>("/api/menu-item/admin/all", params);

  if (Array.isArray(response.data)) {
    return {
      items: response.data,
      pagination: {
        total: response.data.length,
        page: 1,
        limit: response.data.length || 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  return (
    response.data || {
      items: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }
  );
};

export const getMenuItemById = async (id: string): Promise<MenuItem> => {
  const response = await Fetch<ApiResponse<MenuItem>>(`/api/menu-item/${id}`);
  return response.data;
};

const buildFormDataFromPayload = (payload: CreateMenuItemPayload | UpdateMenuItemPayload): FormData => {
  const formData = new FormData();

  if (payload.name) formData.append("name", payload.name);
  if (payload.category) formData.append("category", payload.category);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.price !== undefined) formData.append("price", String(payload.price));
  if (payload.discountPercent !== undefined) formData.append("discountPercent", String(payload.discountPercent));
  if (payload.preparationTime !== undefined) formData.append("preparationTime", String(payload.preparationTime));
  if (payload.priority !== undefined) formData.append("priority", String(payload.priority));
  if (payload.status) formData.append("status", payload.status);
  if (payload.isTodaySpecial !== undefined) formData.append("isTodaySpecial", String(payload.isTodaySpecial));

  if (payload.tags && Array.isArray(payload.tags)) {
    formData.append("tags", JSON.stringify(payload.tags));
  }
  if (payload.allergens && Array.isArray(payload.allergens)) {
    formData.append("allergens", JSON.stringify(payload.allergens));
  }
  if (payload.variants && Array.isArray(payload.variants) && payload.variants.length > 0) {
    formData.append("variants", JSON.stringify(payload.variants));
  }

  // Handle image File vs existing image string/object
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  } else if (payload.image) {
    const imageUrl = typeof payload.image === "object" ? (payload.image as any).url : payload.image;
    if (typeof imageUrl === "string" && imageUrl.trim() && imageUrl !== "[object Object]" && imageUrl !== "{}") {
      formData.append("image", imageUrl.trim());
    }
  }

  return formData;
};

export const createMenuItem = async (payload: CreateMenuItemPayload): Promise<MenuItem> => {
  const formData = buildFormDataFromPayload(payload);
  const response = await Post<ApiResponse<MenuItem>>("/api/menu-item", formData);
  return response.data;
};

export const updateMenuItem = async (id: string, payload: UpdateMenuItemPayload): Promise<MenuItem> => {
  const formData = buildFormDataFromPayload(payload);
  const response = await Put<ApiResponse<MenuItem>>(`/api/menu-item/${id}`, formData);
  return response.data;
};

export const reorderMenuItems = async (orderedItemIds: string[]): Promise<boolean> => {
  const response = await Patch<ApiResponse<null>>("/api/menu-item/admin/reorder", { orderedItemIds });
  return response.success;
};

export const toggleMenuItemStatus = async (id: string, status?: MenuItemStatus): Promise<MenuItem> => {
  const response = await Patch<ApiResponse<MenuItem>>(`/api/menu-item/${id}/status`, { status });
  return response.data;
};

export const deleteMenuItem = async (id: string): Promise<boolean> => {
  const response = await Delete<ApiResponse<null>>(`/api/menu-item/${id}`);
  return response.success;
};
