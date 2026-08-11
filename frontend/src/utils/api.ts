import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/";

export const TokenStorage = {
  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("user_access", token);
      // Plain session cookie (NO max-age)
      document.cookie = `user_access=${token}; path=/;`;
    } catch (error) {
      console.error("❌ Error storing user_access token:", error);
    }
  },

  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("user_access");
    } catch (error) {
      console.error("❌ Error retrieving user_access token:", error);
      return null;
    }
  },

  setAdminToken: (token: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("admin_access", token);
      document.cookie = `admin_access=${token}; path=/;`;
    } catch (error) {
      console.error("❌ Error storing admin_access token:", error);
    }
  },

  getAdminToken: (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("admin_access");
    } catch (error) {
      console.error("❌ Error retrieving admin_access token:", error);
      return null;
    }
  },

  removeToken: (): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("user_access");
      document.cookie = "user_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (error) {
      console.error("❌ Error removing user_access token:", error);
    }
  },

  removeAdminToken: (): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("admin_access");
      document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (error) {
      console.error("❌ Error removing admin_access token:", error);
    }
  },

  clearAll: (): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("user_access");
      localStorage.removeItem("admin_access");
      document.cookie = "user_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (error) {
      console.error("❌ Error clearing tokens:", error);
    }
  },
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor: Attach user_access (or admin_access) token to every outgoing request
api.interceptors.request.use(
  (config) => {
    try {
      const token = TokenStorage.getToken() || TokenStorage.getAdminToken();
      if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      if (config.data instanceof FormData && config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    } catch (error) {
      console.error("❌ Error retrieving token in interceptor:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Automatically catch 401 Unauthorized, clear tokens, and redirect if not on login endpoints
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const requestUrl = error?.config?.url || "";
      const isLoginRequest = requestUrl.includes("/login");

      // Don't auto-redirect on 401 if it's a login attempt (credentials error)
      if (!isLoginRequest) {
        console.warn("⚠️ 401 Unauthorized: Clearing tokens");
        TokenStorage.clearAll();
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath.startsWith("/admin") && !currentPath.startsWith("/admin/login")) {
            window.location.href = "/admin/login";
          } else if (!currentPath.startsWith("/login") && !currentPath.startsWith("/signup")) {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

const request = async <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  try {
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      } else {
        config.headers = {};
      }
    }

    const response = await api.request<T>({
      ...config,
    });

    return response;
  } catch (error: any) {
    console.error(`❌ Request Error:`, {
      url: config.url,
      method: config.method,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      message: error?.message,
      data: error?.response?.data,
    });

    const status = error?.response?.status || 500;
    const is500Error = status >= 500 || !error?.response;

    const errorResponse = {
      success: false,
      status: status,
      message: is500Error
        ? "Something went wrong. Try again later"
        : (error?.response?.data?.message || error?.message || "Something went wrong. Try again later"),
      error: error?.response?.data?.error,
      errors: error?.response?.data?.errors,
      data: error?.response?.data,
    };

    throw errorResponse;
  }
};

export const Fetch = async <T>(
  url: string,
  params?: Record<string, unknown>,
  timeout?: number
): Promise<T> => {
  try {
    const response = await request<T>({
      method: "GET",
      url,
      params,
      timeout,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const Post = async <T>(
  url: string,
  data: Record<string, unknown> | FormData,
  timeout?: number
): Promise<T> => {
  try {
    const response = await request<T>({
      method: "POST",
      url,
      data,
      timeout,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Post error:", error);
    throw error;
  }
};

export const Put = async <T>(
  url: string,
  data: Record<string, unknown> | FormData,
  timeout?: number
): Promise<T> => {
  try {
    const response = await request<T>({
      method: "PUT",
      url,
      data,
      timeout,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Put error:", error);
    throw error;
  }
};

export const Patch = async <T>(
  url: string,
  data: Record<string, unknown> | FormData,
  timeout?: number
): Promise<T> => {
  try {
    const response = await request<T>({
      method: "PATCH",
      url,
      data,
      timeout,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Patch error:", error);
    throw error;
  }
};

export const Delete = async <T>(
  url: string,
  data?: Record<string, unknown>,
  params?: Record<string, unknown>,
  timeout?: number
): Promise<T> => {
  try {
    const response = await request<T>({
      method: "DELETE",
      url,
      data,
      params,
      timeout,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Delete error:", error);
    throw error;
  }
};

export default api;
