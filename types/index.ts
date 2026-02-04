export type AuthMode = 'login' | 'register';

export interface AuthCredentials {
  email: string;
  password: string;
  fname?: string;
  lname?: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterInitRequest {
  email: string;
}

export interface RegisterVerifyRequest {
  email: string;
  otp: string;
}

export interface RegisterVerifyResponse {
  registrationToken: string;
}

export interface RegisterCompleteRequest {
  registrationToken: string;
  email: string;
  fname: string;
  lname: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
  platform?: 'mobile' | 'web';
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailVerifyRequest {
  otp: string;
}

export interface ChangeEmailVerifyResponse {
  changeToken: string;
}

export interface ChangeEmailRequestNewRequest {
  changeToken: string;
  newEmail: string;
}

export interface ChangeEmailConfirmRequest {
  otp: string;
}

export interface UpdateProfileRequest {
  fname?: string;
  lname?: string;
}

export interface SessionResponse {
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  fname?: string;
  lname?: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  categoryLimit?: number;
  defaultIncomeCategories?: string[];
  defaultExpenseCategories?: string[];
  currency?: Currency;
}

export interface Currency {
  _id?: string;
  id: string;
  name: string;
  code: string;
  symbol: string;
  isSelected?: boolean;
}

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  type: 'income' | 'expense';
  isDefault?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id?: string;
  id?: string;
  user?: string;
  title?: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category | string;
  categoryName?: string;
  categoryId?: string;
  date: string;
  note?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInput {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
  note?: string;
}

export interface SummaryResponse {
  daily: SummaryDataPoint[];
  monthly: SummaryDataPoint[];
  totals: TotalsSummary;
}

export interface SummaryDataPoint {
  label: string;
  income: number;
  expense: number;
}

export interface TotalsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
