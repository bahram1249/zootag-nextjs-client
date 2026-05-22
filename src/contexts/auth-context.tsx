'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthResponse } from '@/lib/auth-types';
import {
  getStoredTokens,
  storeTokens,
  clearTokens,
  signin as apiSignin,
  signup as apiSignup,
  refreshTokens as apiRefresh,
  logout as apiLogout,
  getAccessToken,
} from '@/lib/auth';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: null;
}

interface AuthContextValue extends AuthState {
  signin: (username: string, password: string) => Promise<AuthResponse>;
  signup: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens) {
      apiClient.setToken(tokens.access_token);
      setState({ isAuthenticated: true, isLoading: false, user: null });
    } else {
      setState({ isAuthenticated: false, isLoading: false, user: null });
    }
  }, []);

  const signinFn = useCallback(async (username: string, password: string) => {
    const result = await apiSignin({ username, password });
    setState({ isAuthenticated: true, isLoading: false, user: null });
    return result;
  }, []);

  const signupFn = useCallback(async (username: string, password: string) => {
    const result = await apiSignup({ username, password });
    setState({ isAuthenticated: true, isLoading: false, user: null });
    return result;
  }, []);

  const logoutFn = useCallback(async () => {
    await apiLogout();
    setState({ isAuthenticated: false, isLoading: false, user: null });
  }, []);

  const refreshSession = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens) return null;
    try {
      const result = await apiRefresh({
        refresh_token: tokens.refresh_token,
        sessionId: tokens.session_id,
      });
      setState({ isAuthenticated: true, isLoading: false, user: null });
      return result;
    } catch {
      clearTokens();
      setState({ isAuthenticated: false, isLoading: false, user: null });
      return null;
    }
  }, []);

  const getToken = useCallback(() => getAccessToken(), []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signin: signinFn,
        signup: signupFn,
        logout: logoutFn,
        refreshSession,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
