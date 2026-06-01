"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/lib/api";

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContext = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContext | null>(null);

const setToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    sessionStorage.setItem("accessToken", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    sessionStorage.removeItem("accessToken");
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");

    if (token) {
      setToken(token);

      api
        .get("/api/dashboard/stats")
        .then(() => {
          // Token is valid — user stays authenticated
        })
        .catch(() => {
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password }) as {
      data: { accessToken: string; user: User };
    };

    setToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await api.post("/api/auth/register", { email, password, name }) as {
      data: { accessToken: string; user: User };
    };

    setToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }

    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
