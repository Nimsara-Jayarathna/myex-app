import { apiClient } from '@/api/client';
import type { AuthCredentials, AuthResponse, SessionResponse } from '@/types';

export const login = async (credentials: AuthCredentials) => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
  return data;
};

export const register = async (credentials: AuthCredentials) => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', credentials);
  return data;
};

export const getSession = async () => {
  const { data } = await apiClient.get<SessionResponse>('/api/auth/session');
  return data;
};

export const refreshSession = async () => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/refresh');
  return data;
};

export const logoutSession = async () => {
  await apiClient.post('/api/auth/logout');
};

