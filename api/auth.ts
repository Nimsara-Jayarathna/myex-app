import { API_VERSION, apiClient } from '@/api/client';
import { useAuthStore } from '@/context/auth-store';
import type {
  AuthResponse,
  ChangeEmailConfirmRequest,
  ChangeEmailRequestNewRequest,
  ChangeEmailVerifyRequest,
  ChangeEmailVerifyResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterCompleteRequest,
  RegisterInitRequest,
  RegisterVerifyRequest,
  RegisterVerifyResponse,
  ResetPasswordRequest,
  SessionResponse,
  UpdateProfileRequest,
  UserProfile,
} from '@/types';
import { clearDb } from '@/utils/local-db';
import { runFullSync } from '@/utils/sync-service';

export const login = async (credentials: LoginRequest) => {
  const { data } = await apiClient.post<AuthResponse>(`/api/v1/auth/login`, credentials);
  return data;
};

// --- Registration Flow ---

export const registerInit = async (payload: RegisterInitRequest) => {
  const { data } = await apiClient.post<{ message: string }>(`/api/v1.1/auth/register/init`, payload);
  return data;
};

export const registerVerify = async (payload: RegisterVerifyRequest) => {
  const { data } = await apiClient.post<RegisterVerifyResponse>(`/api/v1.1/auth/register/verify`, payload);
  if ('data' in data) return (data as any).data;
  return data;
};

export const registerComplete = async (payload: RegisterCompleteRequest) => {
  const { data } = await apiClient.post<AuthResponse>(`/api/v1.1/auth/register/complete`, payload);
  const responseData = ('data' in data ? (data as any).data : data) as AuthResponse;
  return responseData;
};

// --- Password Management ---

export const forgotPassword = async (payload: ForgotPasswordRequest) => {
  const { data } = await apiClient.post<{ message: string }>(`/api/v1.1/auth/password/forgot`, payload);
  return data;
};

export const resetPassword = async (payload: ResetPasswordRequest) => {
  const { data } = await apiClient.post<{ message: string }>(`/api/v1.1/auth/password/reset`, payload);
  return data;
};

export const changePassword = async (payload: ChangePasswordRequest) => {
  const { data } = await apiClient.post<{ message: string }>(`/api/v1.1/auth/password/change`, payload);
  return data;
};

// --- Email Management ---

export const changeEmailInit = async () => {
  const { data } = await apiClient.post<{ message: string }>(`/api/v1.1/auth/email/change/init`);
  return data;
};

export const changeEmailVerifyCurrent = async (payload: ChangeEmailVerifyRequest) => {
  const { data } = await apiClient.post<ChangeEmailVerifyResponse>(`/api/v1.1/auth/email/change/verify-current`, payload);
  if ('data' in data) return (data as any).data;
  return data;
};

export const changeEmailRequestNew = async (payload: ChangeEmailRequestNewRequest) => {
  const { data } = await apiClient.post<{ message: string }>(`/api/v1.1/auth/email/change/request-new`, payload);
  return data;
};

export const changeEmailConfirm = async (payload: ChangeEmailConfirmRequest) => {
  const { data } = await apiClient.post<{ message: string; email: string }>(`/api/v1.1/auth/email/change/confirm`, payload);
  if ('data' in data) return (data as any).data;
  return data;
};

// --- Profile Management ---

export const updateProfile = async (payload: UpdateProfileRequest) => {
  const { data } = await apiClient.put<{ user: UserProfile }>(`/api/v1.1/auth/me`, payload);
  if ('data' in data) return (data as any).data;
  return data;
};

export const getSession = async () => {
  const { data } = await apiClient.get<SessionResponse>(`/api/${API_VERSION}/auth/session`);
  return data;
};

export const refreshSession = async () => {
  const { data } = await apiClient.post<AuthResponse>(`/api/${API_VERSION}/auth/refresh`);
  useAuthStore.getState().setHasValidSession(true);
  return data;
};

export const logoutSession = async () => {
  try {
    await apiClient.post(`/api/${API_VERSION}/auth/logout`);
  } finally {
    await clearDb();
  }
};
