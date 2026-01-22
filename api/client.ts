import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/context/auth-store';
import type { AuthResponse } from '@/types';
import { isNetworkOrTimeoutError, withRetry } from '@/utils/api-retry';
import { clearDb } from '@/utils/local-db';
import { logDebug, logError } from '@/utils/logger';
import { triggerOfflinePrompt } from '@/utils/offline-prompt';
import { runFullSync } from '@/utils/sync-service';

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
  withCredentials: true,
  timeout: 8000,
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const sanitizeRequestData = (data: unknown) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if ('password' in data) {
    return { ...(data as Record<string, unknown>), password: '[redacted]' };
  }

  return data;
};

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
      .then(response => {
        void runFullSync(response.data?.user);
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

apiClient.interceptors.response.use(
  response => {
    logDebug('API Response', {
      url: response.config.url,
      status: response.status,
      data: response.data,
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
        if (!isNetworkOrTimeoutError(refreshError)) {
          useAuthStore.getState().logout();
          void clearDb();
        }
        return Promise.reject(refreshError);
      }
    }

    if (status === 401) {
      useAuthStore.getState().logout();
      void clearDb();
    }

    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use(
  request => {
    logDebug('API Request', {
      url: request.url,
      method: request.method,
      data: sanitizeRequestData(request.data),
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
  const retries = options.retryCount ?? 1;
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
