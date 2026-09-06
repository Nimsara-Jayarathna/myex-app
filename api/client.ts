import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/context/auth-store';
import type { AuthResponse } from '@/types';
import { isNetworkOrTimeoutError, withRetry } from '@/utils/api-retry';
import { clearDb } from '@/utils/local-db';
import { logDebug, logError } from '@/utils/logger';
import { triggerOfflinePrompt } from '@/utils/offline-prompt';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const resolveBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!fromEnv || fromEnv.length === 0) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL; set your backend URL in the environment.'
    );
  }

  return normalizeBaseUrl(fromEnv);
};

export const API_BASE_URL = resolveBaseUrl();
export const API_VERSION = 'v1.1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // We handle cookies manually
  timeout: 8000,
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const isAuthErrorStatus = (status?: number) => status === 401 || status === 419;

const shouldSkipRefresh = (url?: string) => {
  if (!url) {
    return true;
  }

  return [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
  ].some(path => url.includes(path));
};

let refreshRequest: Promise<void> | null = null;

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = apiClient
      .post<AuthResponse>(`/api/${API_VERSION}/auth/refresh`)
      .then(() => {
        // Just refresh token, no sync side-effect
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register/complete', '/auth/refresh'];

apiClient.interceptors.response.use(
  response => {
    // Capture cookies from auth responses
    const url = response.config.url || '';
    if (AUTH_ENDPOINTS.some(path => url.includes(path))) {
      let setCookieHeaders: string[] = [];

      // CRITICAL FIX: React Native/Axios doesn't preserve multiple headers with same name
      // We must access the raw XMLHttpRequest to get ALL Set-Cookie headers
      // @ts-ignore - React Native XMLHttpRequest exposes getAllResponseHeaders()
      if (response.request?.getAllResponseHeaders) {
        try {
          const rawHeaders = response.request.getAllResponseHeaders();

          // Extract ALL set-cookie headers (case-insensitive)
          const cookieMatches = rawHeaders.match(/set-cookie:\s*([^\r\n]+)/gi);
          if (cookieMatches && cookieMatches.length > 0) {
            // Each match might contain MULTIPLE cookies separated by commas
            // Example: "set-cookie: accessToken=...; SameSite=Lax, refreshToken=...; SameSite=Lax"
            cookieMatches.forEach((match: string) => {
              const headerValue = match.replace(/set-cookie:\s*/i, '');

              // Split by comma BUT only if followed by a cookie name (e.g., "accessToken=", "refreshToken=")
              // Regex: split on ", " only when followed by word characters and "="
              const cookieParts = headerValue.split(/,\s*(?=[a-zA-Z_][a-zA-Z0-9_]*=)/);

              setCookieHeaders.push(...cookieParts);
            });
          }
        } catch {
          // Fall back to Axios-parsed headers.
        }
      }

      // Fallback: Try parsed headers (might only have 1 cookie due to overwrite issue)
      if (setCookieHeaders.length === 0) {
        const parsed = response.headers['set-cookie'];
        if (Array.isArray(parsed)) {
          setCookieHeaders = parsed;
        } else if (typeof parsed === 'string') {
          setCookieHeaders = [parsed];
        }
      }

      if (setCookieHeaders.length > 0) {
        // Extract only the 'name=value' part from each Set-Cookie string
        const cleanCookies = setCookieHeaders.map(c => c.split(';', 1)[0]?.trim()).filter(Boolean) as string[];

        useAuthStore.getState().setCookies(cleanCookies);
        logDebug('Captured auth cookies', { count: cleanCookies.length });
      }
    }

    logDebug('API Response', {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  async error => {
    logError('API Response Error', error);
    const status = error.response?.status as number | undefined;
    const originalRequest = error.config as RetriableRequest | undefined;
    const { hasValidSession, isAuthenticated } = useAuthStore.getState();
    const canAttemptRefresh = hasValidSession || isAuthenticated;

    if (
      originalRequest &&
      isAuthErrorStatus(status) &&
      !originalRequest._retry &&
      canAttemptRefresh &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Only logout if refresh itself fails (not a network error)
        if (!isNetworkOrTimeoutError(refreshError)) {
          useAuthStore.getState().logout();
          void clearDb();
        }
        return Promise.reject(refreshError);
      }
    }

    // Don't logout here - the above logic already handled auth errors
    // If we reach here with a 401, it means refresh was skipped or not applicable

    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use(
  request => {
    const { cookies } = useAuthStore.getState();
    if (cookies && cookies.length > 0) {
      // Join cookies with '; ' and strip attributes if needed, though raw usually works
      // Simply joining the array from set-cookie often works for the Cookie header
      request.headers.Cookie = cookies.join('; ');
    }

    logDebug('API Request', {
      url: request.url,
      method: request.method,
      data: request.data,
      headers: request.headers,
    });
    return request;
  },
  error => {
    logError('API Request Error', error);
    return Promise.reject(error);
  }
);

export type ApiRequestOptions = {
  userInitiated?: boolean;
  retryCount?: number;
  timeoutMs?: number;
};

export const apiRequest = async <T>(
  config: AxiosRequestConfig,
  options: ApiRequestOptions = {}
) => {
  const method = (config.method ?? 'get').toLowerCase();
  const isSafeMethod = ['get', 'head', 'options'].includes(method);
  const retries = options.retryCount ?? (isSafeMethod ? 1 : 0);
  const timeout = options.timeoutMs ?? 8000;

  try {
    const response = await withRetry(
      () => apiClient.request<T>({ ...config, timeout }),
      retries
    );
    return response.data;
  } catch (error) {
    if (options.userInitiated && isNetworkOrTimeoutError(error)) {
      triggerOfflinePrompt({
        reason: 'We could not reach the server.',
        onRetry: async () => {
          await withRetry(() => apiClient.request<T>({ ...config, timeout }), retries);
        },
      });
    }
    throw error;
  }
};
