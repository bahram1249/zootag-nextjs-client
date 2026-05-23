import type { ApiSuccessResponse, ApiErrorResponse } from "./api-types";

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
    this.name = "ApiError";
    this.statusCode = response.statusCode;
    this.errors = response.errors;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestConfig {
  method: HttpMethod;
  path: string;
  body?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
}

interface QueuedRequest {
  resolve: (value: boolean) => void;
  config?: RequestConfig;
}

function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, unknown>,
): string {
  const url = new URL(path, baseUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      if (key === "filter" && typeof value === "object") {
        for (const [fk, fv] of Object.entries(
          value as Record<string, unknown>,
        )) {
          if (fv !== undefined && fv !== null && fv !== "") {
            url.searchParams.set(`filter[${fk}]`, String(fv));
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== "") {
            url.searchParams.append(key, String(item));
          }
        });
      } else if (typeof value === "object" && value !== null) {
        url.searchParams.set(key, JSON.stringify(value));
      } else if (value !== "" && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function buildHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function setCookie(name: string, value: string, ms: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + ms).toUTCString();
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const sameSite = isSecure ? "SameSite=Strict" : "SameSite=Lax";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; ${sameSite}${secureFlag}`;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
}

function clearAuthCookies(): void {
  removeCookie("access_token");
  removeCookie("refresh_token");
  removeCookie("session_id");
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private pendingRequests: QueuedRequest[] = [];
  private readonly maxRetries: number = 1;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.setupCrossTabSync();
    // Initialize token from cookie on creation
    this.token = getCookie("access_token");
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

  private setupCrossTabSync(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("storage", (event) => {
      if (event.key === "auth_last_refresh" && event.newValue) {
        const newToken = getCookie("access_token");
        if (newToken && this.token !== newToken) {
          this.token = newToken;
        }
      }
    });
  }

  private async refreshAccessToken(): Promise<boolean> {
    // If refresh is already in progress, queue this request
    if (this.refreshPromise) {
      return new Promise<boolean>((resolve) => {
        this.pendingRequests.push({ resolve });
      });
    }

    this.refreshPromise = this.doRefresh().catch(() => false);

    try {
      const result = await this.refreshPromise;

      // Process queued requests — resolve all with the same boolean result
      for (const queued of this.pendingRequests) {
        queued.resolve(result);
      }
      this.pendingRequests = [];

      if (!result) {
        clearAuthCookies();
        this.token = null;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:expired"));
        }
      }

      return result;
    } catch {
      // Unexpected error in refresh flow — treat as failure
      for (const queued of this.pendingRequests) {
        queued.resolve(false);
      }
      this.pendingRequests = [];
      clearAuthCookies();
      this.token = null;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:expired"));
      }
      return false;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    const refresh_token = getCookie("refresh_token");
    const session_id = getCookie("session_id");

    console.log("Attempting token refresh...", {
      hasRefreshToken: !!refresh_token,
      hasSessionId: !!session_id,
    });

    if (!refresh_token || !session_id) {
      console.error("No refresh token or session ID available for refresh");
      return false;
    }

    try {
      const requestBody = {
        refresh_token,
        sessionId: Number(session_id),
      };

      console.log(
        "Sending refresh request to:",
        `${this.baseUrl}/v1/api/core/auth/refresh`,
      );

      const response = await fetch(`${this.baseUrl}/v1/api/core/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Refresh response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Refresh failed with status:",
          response.status,
          errorText,
        );
        return false;
      }

      const data = await response.json();
      console.log("Refresh response data:", {
        ...data,
        access_token: "hidden",
      });

      // Check for different response structures
      let result: TokenRefreshResponse;

      if (data.result) {
        result = data.result;
      } else if (data.data) {
        result = data.data;
      } else {
        result = data;
      }

      // Validate required fields
      if (!result.access_token) {
        console.error("No access_token in refresh response:", result);
        return false;
      }

      if (!result.refresh_token) {
        console.error("No refresh_token in refresh response:", result);
        return false;
      }

      // Calculate refresh token expiry
      let refreshMs: number;
      if (result.refresh_token_expires_at) {
        const refreshExpiry = new Date(
          result.refresh_token_expires_at,
        ).getTime();
        if (isNaN(refreshExpiry)) {
          console.error(
            "Invalid refresh_token_expires_at format:",
            result.refresh_token_expires_at,
          );
          refreshMs = 30 * 24 * 60 * 60 * 1000;
        } else {
          refreshMs = refreshExpiry - Date.now();
        }
      } else {
        refreshMs = 30 * 24 * 60 * 60 * 1000;
      }

      // Don't accept an already-expired refresh token
      if (refreshMs <= 0) {
        console.error("Received already expired refresh token");
        return false;
      }

      // Update token in memory
      this.token = result.access_token;
      console.log("Token refreshed successfully, new token set");

      const accessTokenMs = (result.expires_in || 900) * 1000;
      setCookie("access_token", result.access_token, accessTokenMs);
      setCookie("refresh_token", result.refresh_token, refreshMs);

      if (result.session_id) {
        setCookie("session_id", String(result.session_id), refreshMs);
      }

      // Signal other tabs that token was refreshed
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_last_refresh", Date.now().toString());
        window.dispatchEvent(
          new CustomEvent("auth:refreshed", {
            detail: {
              sessionId: result.session_id,
              expiresIn: result.expires_in,
            },
          }),
        );
      }

      return true;
    } catch (error) {
      console.error("Refresh token request exception:", error);
      return false;
    }
  }

  private async executeRequest<T>(
    config: RequestConfig,
  ): Promise<ApiSuccessResponse<T>> {
    const url = buildUrl(this.baseUrl, config.path, config.params);

    // Log request for debugging
    console.log(`Making ${config.method} request to:`, url);

    const response = await fetch(url, {
      method: config.method,
      headers: buildHeaders(this.token),
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: config.signal,
    });

    console.log(`Response status for ${config.path}:`, response.status);

    if (!response.ok) {
      let errorPayload: ApiErrorResponse;

      try {
        const responseData = await response.json();
        errorPayload = responseData as ApiErrorResponse;
      } catch {
        errorPayload = {
          statusCode: response.status,
          message: response.statusText || "Unknown error",
          errors: [response.statusText || "Unknown error"],
          timestamp: new Date().toISOString(),
          path: config.path,
        };
      }

      throw new ApiError(errorPayload);
    }

    return (await response.json()) as ApiSuccessResponse<T>;
  }

  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: "GET", path, params, signal });
  }

  async post<T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: "POST", path, body, signal });
  }

  async put<T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: "PUT", path, body, signal });
  }

  async delete<T>(
    path: string,
    signal?: AbortSignal,
  ): Promise<ApiSuccessResponse<T>> {
    return this.request<T>({ method: "DELETE", path, signal });
  }

  private async request<T>(
    config: RequestConfig,
    retryCount: number = 0,
  ): Promise<ApiSuccessResponse<T>> {
    const isRefreshEndpoint = config.path.includes("/auth/refresh");

    try {
      return await this.executeRequest<T>(config);
    } catch (error) {
      // Handle 401 Unauthorized
      if (
        error instanceof ApiError &&
        error.statusCode === 401 &&
        !isRefreshEndpoint &&
        retryCount < this.maxRetries
      ) {
        console.log(
          `Received 401 for ${config.path}, attempting token refresh...`,
        );

        // Try to refresh the token
        const refreshed = await this.refreshAccessToken();

        if (refreshed && this.token) {
          console.log(`Token refresh successful, retrying ${config.path}...`);
          // Retry the request with the new token
          return this.request<T>(config, retryCount + 1);
        } else {
          console.error(`Token refresh failed for ${config.path}`);
          throw error;
        }
      }

      throw error;
    }
  }
}

const defaultBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3000";

export const apiClient = new ApiClient(defaultBaseUrl);

export function isAuthenticated(): boolean {
  return !!getCookie("refresh_token");
}

export function getSessionInfo(): {
  sessionId: string | null;
  token: string | null;
} {
  return {
    sessionId: getCookie("session_id"),
    token: getCookie("access_token"),
  };
}

export function logout(): void {
  clearAuthCookies();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
  apiClient.clearToken();
}

// For debugging - expose to window in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).debugAuth = () => {
    console.log("Auth Debug Info:", {
      token: getCookie("access_token"),
      refreshToken: getCookie("refresh_token"),
      sessionId: getCookie("session_id"),
      memoryToken: apiClient.getToken(),
      isAuthenticated: isAuthenticated(),
    });
  };
}
