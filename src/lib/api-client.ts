import type { ApiSuccessResponse, ApiErrorResponse } from './api-types';

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_at: string;
  session_id: number;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.errors = response.errors;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestConfig {
  method: HttpMethod;
  path: string;
  body?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
}

function buildUrl(baseUrl: string, path: string, params?: Record<string, unknown>): string {
  const url = new URL(path, baseUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      if (key === 'filter' && typeof value === 'object') {
        for (const [fk, fv] of Object.entries(value as Record<string, unknown>)) {
          if (fv !== undefined && fv !== null && fv !== '') {
            url.searchParams.set(`filter[${fk}]`, String(fv));
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            url.searchParams.append(key, String(item));
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        url.searchParams.set(key, JSON.stringify(value));
      } else if (value !== '' && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function buildHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
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

function setCookie(name: string, value: string, ms: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + ms).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
}

function clearAuthCookies(): void {
  removeCookie('access_token');
  removeCookie('refresh_token');
  removeCookie('session_id');
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.doRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    const refresh_token = getCookie('refresh_token');
    const session_id = getCookie('session_id');
    if (!refresh_token || !session_id) return false;

    try {
      const response = await fetch(`${this.baseUrl}/v1/api/core/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token, sessionId: Number(session_id) }),
      });

      if (!response.ok) {
        clearAuthCookies();
        this.token = null;
        return false;
      }

      const data = (await response.json()) as ApiSuccessResponse<TokenRefreshResponse>;
      const result = data.result;

      this.token = result.access_token;

      const refreshMs = new Date(result.refresh_token_expires_at).getTime() - Date.now();
      setCookie('access_token', result.access_token, result.expires_in * 1000);
      setCookie('refresh_token', result.refresh_token, refreshMs);
      setCookie('session_id', String(result.session_id), refreshMs);

      return true;
    } catch {
      clearAuthCookies();
      this.token = null;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return false;
    }
  }

  private async request<T>(config: RequestConfig): Promise<ApiSuccessResponse<T>> {
    const url = buildUrl(this.baseUrl, config.path, config.params);

    const doFetch = (token: string | null) =>
      fetch(url, {
        method: config.method,
        headers: buildHeaders(token),
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: config.signal,
      });

    let response = await doFetch(this.token);

    if (response.status === 401 && !config.path.includes('/auth/refresh')) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        response = await doFetch(this.token);
      } else {
        clearAuthCookies();
        this.token = null;
      }
    }

    if (!response.ok) {
      let errorPayload: ApiErrorResponse;

      try {
        errorPayload = (await response.json()) as ApiErrorResponse;
      } catch {
        errorPayload = {
          statusCode: response.status,
          message: response.statusText || 'Unknown error',
          errors: [response.statusText || 'Unknown error'],
          timestamp: new Date().toISOString(),
          path: config.path,
        };
      }

      throw new ApiError(errorPayload);
    }

    const data = (await response.json()) as ApiSuccessResponse<T>;
    return data;
  }

  async get<T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: 'GET', path, params, signal });
  }

  async post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, signal });
  }

  async put<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body, signal });
  }

  async delete<T>(path: string, signal?: AbortSignal): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: 'DELETE', path, signal });
  }
}

const defaultBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';

export const apiClient = new ApiClient(defaultBaseUrl);
