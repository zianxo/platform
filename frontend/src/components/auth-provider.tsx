"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

type UserRole = "ADMIN" | "HR" | "SALES" | "FINANCE";

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }

        try {
            // Validate session with backend
            const user = await api.auth.me();
            setUser(user);
            localStorage.setItem("user", JSON.stringify(user));
        } catch (err) {
            console.error("Auth init failed:", err);
            // If we have a saved user but the session is invalid, logout
            if (savedUser) {
                logout();
            }
        } finally {
            setIsLoading(false);
        }
    }
    
    initAuth();
  }, []);

  const login = (token: string, user: User) => {
    // Note: The /api/auth/login route already set the HttpOnly cookie.
    // We still store user info in localStorage for quick access, but token is in cookie.
    localStorage.setItem("user", JSON.stringify(user));
    
    setUser(user);
    
    // Redirect to root. Middleware handles the rewrite to /admin/dashboard or /client based on domain.
    router.push("/");
  };

  const logout = async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
        console.error("Logout error:", e);
    }
    
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
      // Basic route protection
      if (!isLoading && !user && pathname !== "/login" && pathname !== "/") {
          router.push("/login");
      }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
