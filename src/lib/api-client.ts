import type { ApiSuccessResponse, ApiErrorResponse } from './api-types';

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

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

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

  private async request<T>(config: RequestConfig): Promise<ApiSuccessResponse<T>> {
    const url = buildUrl(this.baseUrl, config.path, config.params);

    const response = await fetch(url, {
      method: config.method,
      headers: buildHeaders(this.token),
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: config.signal,
    });

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
