import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { AUTH_COOKIE_NAMES } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/api-response";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function processRefreshQueue(error: unknown, token: string | null = null) {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  refreshQueue = [];
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    useAuthStore.getState().accessToken ??
    getCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(normalizeApiError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken =
        useAuthStore.getState().refreshToken ??
        getCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN);

      const { data } = await axios.post<
        ApiSuccessResponse<{ accessToken: string; refreshToken: string }>
      >(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true },
      );

      if (!data.success) {
        throw new Error("Token refresh failed");
      }

      const { accessToken, refreshToken: newRefreshToken } = data.data;
      useAuthStore.getState().setTokens({
        accessToken,
        refreshToken: newRefreshToken,
      });

      processRefreshQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      useAuthStore.getState().clearAuth();

      if (typeof window !== "undefined") {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${redirect}`;
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export class ApiClientError extends Error {
  code: string;
  status?: number;
  details?: unknown;

  constructor(
    message: string,
    code = "API_ERROR",
    status?: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function normalizeApiError(error: AxiosError<ApiErrorResponse>): ApiClientError {
  const apiError = error.response?.data?.error;

  if (apiError) {
    return new ApiClientError(
      apiError.message,
      apiError.code,
      error.response?.status,
      apiError.details,
    );
  }

  if (error.code === "ECONNABORTED") {
    return new ApiClientError("Request timed out", "TIMEOUT", 408);
  }

  if (!error.response) {
    return new ApiClientError(
      "Network error. Please check your connection.",
      "NETWORK_ERROR",
    );
  }

  return new ApiClientError(
    error.message || "An unexpected error occurred",
    "UNKNOWN_ERROR",
    error.response.status,
  );
}

export function unwrapData<T>(response: { data: ApiSuccessResponse<T> }): T {
  if (!response.data.success) {
    throw new ApiClientError("Invalid API response", "INVALID_RESPONSE");
  }
  return response.data.data;
}
