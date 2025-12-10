export type AuthMode = 'login' | 'register';

export interface AuthCredentials {
  email: string;
  password: string;
  fname?: string;
  lname?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token?: string;
}

export interface SessionResponse {
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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

