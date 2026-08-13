"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TokenStorage, Fetch, Post } from "@/utils/api";

export interface UserProfile {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status?: string;
}

export interface AdminProfile {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  adminToken: string | null;
  user: UserProfile | null;
  adminProfile: AdminProfile | null;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  login: (token: string, userData?: UserProfile) => void;
  signup: (token: string, userData?: UserProfile) => void;
  logout: () => Promise<void>;
  adminLogin: (token: string, adminData?: AdminProfile) => void;
  adminLogout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const fetchProfiles = async (uToken: string | null, aToken: string | null) => {
    if (uToken) {
      try {
        const res = await Fetch<{ success: boolean; data: UserProfile }>("/api/user/profile");
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch current user profile:", err);
      }
    } else {
      setUser(null);
    }

    if (aToken) {
      try {
        const res = await Fetch<{ success: boolean; data: AdminProfile }>("/api/admin/profile");
        if (res.success && res.data) {
          setAdminProfile(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch current admin profile:", err);
      }
    } else {
      setAdminProfile(null);
    }
  };

  useEffect(() => {
    const storedUserToken = TokenStorage.getToken();
    const storedAdminToken = TokenStorage.getAdminToken();


    setToken(storedUserToken);
    setAdminToken(storedAdminToken);

    // Sync cookies for server-side middleware
    if (storedUserToken) {
      document.cookie = `user_access=${storedUserToken}; path=/;`;
    }
    if (storedAdminToken) {
      document.cookie = `admin_access=${storedAdminToken}; path=/;`;
    }

    // Fetch profile data based on tokens present
    fetchProfiles(storedUserToken, storedAdminToken);

    const hasUserAccess = !!storedUserToken;
    const hasAdminAccess = !!storedAdminToken;
    const isUserLoginSignup = pathname === "/login" || pathname === "/signup";
    const isAdminLoginRoute = pathname === "/admin/login";
    const isAdminRoute = pathname.startsWith("/admin");
    const isProtectedUserRoute = pathname === "/orders" || pathname.startsWith("/profile");

    // Strict Routing Guards
    if (hasAdminAccess) {
      // Admin session active:
      // Admin MUST NOT access ANY user panel routes (/, /cart, /orders, /profile, /login, /signup, etc.)
      // If pathname does NOT start with /admin OR is /admin/login -> redirect to /admin immediately
      if (!isAdminRoute || isAdminLoginRoute) {
        router.replace("/admin");
      }
    } else if (hasUserAccess) {
      // User session active:
      // User MUST NOT access ANY admin routes (/admin/*) or auth routes (/login, /signup)
      if (isAdminRoute || isUserLoginSignup) {
        router.replace("/");
      }
    } else {
      // Unauthenticated visitor (no token in localStorage):
      // Mandatory login/register requirement
      if (isAdminRoute && !isAdminLoginRoute) {
        router.replace("/admin/login");
      } else if (!isUserLoginSignup && !isAdminLoginRoute) {
        router.replace("/login");
      }
    }
  }, [pathname, router]);

  const login = (newToken: string, userData?: UserProfile) => {
    // Clear stale admin session to maintain single active role
    TokenStorage.removeAdminToken();
    setAdminToken(null);
    setAdminProfile(null);
    document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    TokenStorage.setToken(newToken);
    setToken(newToken);
    if (userData) setUser(userData);
    fetchProfiles(newToken, null);
    router.replace("/");
  };

  const signup = (newToken: string, userData?: UserProfile) => {
    TokenStorage.removeAdminToken();
    setAdminToken(null);
    setAdminProfile(null);
    document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    TokenStorage.setToken(newToken);
    setToken(newToken);
    if (userData) setUser(userData);
    fetchProfiles(newToken, null);
    router.replace("/");
  };

  const logout = async () => {
    try {
      await Post("/api/user/logout", {});
    } catch (error: any) {
      console.error("User logout API error:", error);
    } finally {
      TokenStorage.removeToken();
      setToken(null);
      setUser(null);
      document.cookie = "user_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.replace("/login");
    }
  };

  const adminLogin = (newToken: string, adminData?: AdminProfile) => {
    // Clear stale user session to maintain single active role
    TokenStorage.removeToken();
    setToken(null);
    setUser(null);
    document.cookie = "user_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    TokenStorage.setAdminToken(newToken);
    setAdminToken(newToken);
    if (adminData) setAdminProfile(adminData);
    fetchProfiles(null, newToken);
    router.replace("/admin");
  };

  const adminLogout = async () => {
    try {
      await Post("/api/admin/logout", {});
    } catch (error: any) {
      console.error("Admin logout API error:", error);
    } finally {
      TokenStorage.removeAdminToken();
      setAdminToken(null);
      setAdminProfile(null);
      document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.replace("/admin/login");
    }
  };

  const refreshProfile = async () => {
    await fetchProfiles(token, adminToken);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        adminToken,
        user,
        adminProfile,
        isAuthenticated: !!token,
        isAdminAuthenticated: !!adminToken,
        login,
        signup,
        logout,
        adminLogin,
        adminLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
