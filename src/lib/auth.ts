import { apiClient, ApiError } from './api-client';
import type { AuthDto, AuthResponse, RefreshDto, SessionResponse, AuthTokens } from './auth-types';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const SESSION_ID_KEY = 'session_id';

function setCookie(name: string, value: string, ms: number, httpOnly = false): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + ms).toUTCString();
  const httpOnlyFlag = httpOnly ? '; HttpOnly' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${httpOnlyFlag}`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=');
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
}

export function getStoredTokens(): AuthTokens | null {
  if (typeof document === 'undefined') return null;
  const access_token = getCookie(ACCESS_TOKEN_KEY);
  const refresh_token = getCookie(REFRESH_TOKEN_KEY);
  const session_id = getCookie(SESSION_ID_KEY);
  if (access_token && refresh_token && session_id) {
    return { access_token, refresh_token, session_id: Number(session_id) };
  }
  return null;
}

export function storeTokens(tokens: AuthTokens): void {
  const refreshMs = tokens.refresh_token_expires_at
    ? new Date(tokens.refresh_token_expires_at).getTime() - Date.now()
    : 30 * 24 * 60 * 60 * 1000; // Default to 30 days
  setCookie(ACCESS_TOKEN_KEY, tokens.access_token, (tokens.expires_in ?? 900) * 1000);
  setCookie(REFRESH_TOKEN_KEY, tokens.refresh_token, refreshMs);
  setCookie(SESSION_ID_KEY, String(tokens.session_id), refreshMs);
  apiClient.setToken(tokens.access_token);
}

export function clearTokens(): void {
  removeCookie(ACCESS_TOKEN_KEY);
  removeCookie(REFRESH_TOKEN_KEY);
  removeCookie(SESSION_ID_KEY);
  apiClient.clearToken();
}

export async function signin(dto: AuthDto): Promise<AuthResponse> {
  const { result } = await apiClient.post<AuthResponse>('/v1/api/core/auth/signin', dto);
  storeTokens({
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    session_id: result.session_id,
    expires_in: result.expires_in,
    refresh_token_expires_at: result.refresh_token_expires_at,
  });
  return result;
}

export async function signup(dto: AuthDto): Promise<AuthResponse> {
  const { result } = await apiClient.post<AuthResponse>('/v1/api/core/auth/signup', dto);
  storeTokens({
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    session_id: result.session_id,
    expires_in: result.expires_in,
    refresh_token_expires_at: result.refresh_token_expires_at,
  });
  return result;
}

export async function refreshTokens(dto: RefreshDto): Promise<AuthResponse> {
  const { result } = await apiClient.post<AuthResponse>('/v1/api/core/auth/refresh', dto);
  storeTokens({
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    session_id: result.session_id,
    expires_in: result.expires_in,
    refresh_token_expires_at: result.refresh_token_expires_at,
  });
  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/v1/api/core/auth/logout');
  } catch {
    // ignore — still clear local tokens
  }
  clearTokens();
}

export async function fetchSessions(): Promise<SessionResponse[]> {
  const { result } = await apiClient.get<SessionResponse[]>('/v1/api/core/auth/sessions');
  return result;
}

export async function revokeSession(sessionId: number): Promise<void> {
  await apiClient.delete(`/v1/api/core/auth/sessions/${sessionId}`);
}

export async function checkUsername(username: string): Promise<boolean> {
  try {
    await apiClient.post('/v1/api/core/auth/findUser', { username });
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 403) {
      return false;
    }
    throw error;
  }
}

export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  return apiClient.getToken() || getCookie(ACCESS_TOKEN_KEY);
}

export { ApiError } from './api-client';
