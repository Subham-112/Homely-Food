import { Fetch } from "@/utils/api";

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

export const getCategoryList = async (): Promise<CategoryListItem[]> => {
  const response = await Fetch<ApiResponse<CategoryListItem[]>>("/api/category/list");
  return response.data || [];
};
