"use client";

import { api } from "@/lib/api";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  tokenRef: React.MutableRefObject<string | null>;
  setAuth: (accessToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    user: null,
  });

  const [loading, setLoading] = useState(true);

  const tokenRef = useRef<string | null>(null);

  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;

    hasRestored.current = true;

    const restoreSession = async () => {
      try {
        const refreshResponse = await api.post("/auth/token/refresh");

        const accessToken = refreshResponse.data.accessToken;

        tokenRef.current = accessToken;

        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        const meResponse = await api.get("/auth/me");

        setAuthState({
          accessToken,
          user: meResponse.data.user,
        });
      } catch {
        tokenRef.current = null;

        delete api.defaults.headers.common["Authorization"];

        setAuthState({
          accessToken: null,
          user: null,
        });
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const setAuth = useCallback((accessToken: string, user: AuthUser) => {
    tokenRef.current = accessToken;

    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    setAuthState({
      accessToken,
      user,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout errors
    }

    tokenRef.current = null;

    delete api.defaults.headers.common["Authorization"];

    setAuthState({
      accessToken: null,
      user: null,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        tokenRef,
        setAuth,
        logout,
        isAuthenticated: !!authState.accessToken && !!authState.user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }

  return ctx;
}
