'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthResponse, UserProfile } from '@/lib/auth-types';
import {
  getStoredTokens,
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
  user: UserProfile | null;
}

interface AuthContextValue extends AuthState {
  signin: (username: string, password: string) => Promise<AuthResponse>;
  signup: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile() {
  try {
    const { result } = await apiClient.get<UserProfile>('/v1/api/core/user/profile');
    return result;
  } catch {
    return null;
  }
}

function initState(): AuthState {
  const tokens = getStoredTokens();
  if (tokens) {
    apiClient.setToken(tokens.access_token);
  }
  return {
    isAuthenticated: !!tokens,
    isLoading: !!tokens,
    user: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initState);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    let cancelled = false;
    fetchProfile().then((user) => {
      if (cancelled) return;
      setState((prev) => ({ ...prev, isLoading: false, user }));
    });
    return () => { cancelled = true; };
    // only run on mount when isAuthenticated is determined from initState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => {
      clearTokens();
      setState({ isAuthenticated: false, isLoading: false, user: null });
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const signinFn = useCallback(async (username: string, password: string) => {
    const result = await apiSignin({ username, password });
    const user = await fetchProfile();
    setState({ isAuthenticated: true, isLoading: false, user });
    return result;
  }, []);

  const signupFn = useCallback(async (username: string, password: string) => {
    const result = await apiSignup({ username, password });
    const user = await fetchProfile();
    setState({ isAuthenticated: true, isLoading: false, user });
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
      const user = await fetchProfile();
      setState({ isAuthenticated: true, isLoading: false, user });
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
