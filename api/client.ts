import axios, { type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/context/auth-store';

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

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const isAuthErrorStatus = (status?: number) => status === 401 || status === 419;

const shouldSkipRefresh = (url?: string) => {
  if (!url) {
    return true;
  }

  return ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout'].some(
    path => url.includes(path)
  );
};

let refreshRequest: Promise<void> | null = null;

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = apiClient
      .post('/api/auth/refresh')
      .then(() => {})
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status as number | undefined;
    const originalRequest = error.config as RetriableRequest | undefined;

    if (
      originalRequest &&
      isAuthErrorStatus(status) &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    if (status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

