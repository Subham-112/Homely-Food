"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TokenStorage, Post } from "@/utils/api";

interface AuthContextType {
  token: string | null;
  adminToken: string | null;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  login: (token: string) => void;
  signup: (token: string) => void;
  logout: () => Promise<void>;
  adminLogin: (token: string) => void;
  adminLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Read tokens from localStorage
    const storedUserToken = TokenStorage.getToken();
    const storedAdminToken = TokenStorage.getAdminToken();

    setToken(storedUserToken);
    setAdminToken(storedAdminToken);
    setIsInitialized(true);

    // Sync cookies for server-side middleware
    if (storedUserToken) {
      document.cookie = `user_access=${storedUserToken}; path=/;`;
    }
    if (storedAdminToken) {
      document.cookie = `admin_access=${storedAdminToken}; path=/;`;
    }

    // Check localStorage tokens
    const hasUserAccess = !!storedUserToken;
    const hasAdminAccess = !!storedAdminToken;
    const isPublicUserRoute = pathname === "/login" || pathname === "/signup";
    const isAdminLoginRoute = pathname === "/admin/login";
    const isAdminRoute = pathname.startsWith("/admin");

    if (!hasUserAccess && !hasAdminAccess) {
      // No tokens in localStorage -> Navigate to /login (unless already on /login, /signup, or /admin/login)
      if (!isPublicUserRoute && !isAdminLoginRoute) {
        router.replace("/login");
      }
    } else if (hasAdminAccess && isPublicUserRoute) {
      // Admin is logged in but tries to open user /login or /signup -> Redirect to /admin
      router.replace("/admin");
    } else if (isAdminRoute) {
      if (!hasAdminAccess && !isAdminLoginRoute) {
        router.replace("/admin/login");
      } else if (hasAdminAccess && isAdminLoginRoute) {
        router.replace("/admin");
      }
    } else {
      if (!hasUserAccess && !isPublicUserRoute) {
        router.replace("/login");
      } else if (hasUserAccess && isPublicUserRoute) {
        router.replace("/");
      }
    }
  }, [pathname, router]);

  const login = (newToken: string) => {
    TokenStorage.setToken(newToken);
    setToken(newToken);
    router.replace("/");
  };

  const signup = (newToken: string) => {
    TokenStorage.setToken(newToken);
    setToken(newToken);
    router.replace("/");
  };

  const logout = async () => {
    try {
      await Post("/api/user/logout", {});
    } catch (error) {
      console.error("User logout API error:", error);
    } finally {
      TokenStorage.removeToken();
      setToken(null);
      router.replace("/login");
    }
  };

  const adminLogin = (newToken: string) => {
    TokenStorage.setAdminToken(newToken);
    setAdminToken(newToken);
    router.replace("/admin");
  };

  const adminLogout = async () => {
    try {
      await Post("/api/admin/logout", {});
    } catch (error) {
      console.error("Admin logout API error:", error);
    } finally {
      TokenStorage.removeAdminToken();
      setAdminToken(null);
      router.replace("/admin/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        adminToken,
        isAuthenticated: !!token,
        isAdminAuthenticated: !!adminToken,
        login,
        signup,
        logout,
        adminLogin,
        adminLogout,
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
