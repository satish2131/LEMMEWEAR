"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { mergeGuestCartIntoUser } from "@/lib/cartKey";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  rewardPoints: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtpAndSignup: (name: string, email: string, password: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  sendOtp: async () => ({ success: false }),
  verifyOtpAndSignup: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser({
            id: json.data.id,
            name: json.data.name,
            email: json.data.email,
            phone: json.data.phone,
            city: json.data.city,
            rewardPoints: json.data.rewardPoints || 0,
          });
          localStorage.setItem("lemmewear_uid", json.data.id);
          return;
        }
      }
      localStorage.removeItem("lemmewear_uid");
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const u = json.data.user;
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          rewardPoints: u.rewardPoints || 0,
        });
        localStorage.setItem("lemmewear_uid", u.id);
        mergeGuestCartIntoUser(u.id);
        return { success: true };
      }
      return { success: false, error: json.error || "Login failed" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setUser({
          id: json.data.user.id,
          name: json.data.user.name,
          email: json.data.user.email,
          rewardPoints: json.data.user.rewardPoints || 0,
        });
        return { success: true };
      }
      return { success: false, error: json.error || "Signup failed" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("lemmewear_uid");
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  // Step 1 of signup: send OTP to email
  const sendOtp = async (name: string, email: string) => {
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const json = await res.json();
      if (json.success) return { success: true };
      return { success: false, error: json.error || "Failed to send OTP" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Step 2 of signup: verify OTP and create account
  const verifyOtpAndSignup = async (
    name: string,
    email: string,
    password: string,
    otp: string
  ) => {
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, otp }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const u = json.data.user;
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          rewardPoints: u.rewardPoints || 0,
        });
        localStorage.setItem("lemmewear_uid", u.id);
        mergeGuestCartIntoUser(u.id);
        return { success: true };
      }
      return { success: false, error: json.error || "Verification failed" };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, sendOtp, verifyOtpAndSignup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
