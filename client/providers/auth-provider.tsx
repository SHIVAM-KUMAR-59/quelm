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
  refreshToken: string | null;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  tokenRef: React.MutableRefObject<string | null>;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "quelm-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const tokenRef = useRef<string | null>(null);

  // Restore auth state on refresh
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      setLoading(false);
      return;
    }

    try {
      const parsed: AuthState = JSON.parse(stored);

      tokenRef.current = parsed.accessToken;

      if (parsed.accessToken) {
        api.defaults.headers.common["Authorization"] = `Bearer ${parsed.accessToken}`;
      }

      setAuthState(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const setAuth = useCallback(
    (accessToken: string, refreshToken: string, user: AuthUser) => {
      const newState: AuthState = {
        accessToken,
        refreshToken,
        user,
      };

      tokenRef.current = accessToken;

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

      setAuthState(newState);
    },
    [],
  );

  const logout = useCallback(() => {
    tokenRef.current = null;

    delete api.defaults.headers.common["Authorization"];

    localStorage.removeItem(STORAGE_KEY);

    setAuthState({
      accessToken: null,
      refreshToken: null,
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
