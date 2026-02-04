import dayjs from 'dayjs';

import type { Category, Transaction } from '@/types';

export type LocalTransactionStatus = 'pending' | 'synced';

export type LocalTransactionRow = {
  localId: string;
  serverId?: string | null;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  categoryName?: string | null;
  note?: string | null;
  date: string;
  status: LocalTransactionStatus;
  createdAt: string;
  updatedAt: string;
};

export type LocalProfileRow = {
  id: string;
  name: string;
  fname?: string | null;
  lname?: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
  categoryLimit?: number | null;
  defaultIncomeCategories?: string[];
  defaultExpenseCategories?: string[];
  currency_id?: string | null;
  currency_name?: string | null;
  currency_code?: string | null;
  currency_symbol?: string | null;
};

const webStore = {
  transactions: [] as LocalTransactionRow[],
  categories: [] as Array<{
    localId: string;
    serverId: string;
    name: string;
    type: 'income' | 'expense';
    isDefault: number;
    updatedAt: string;
  }>,
  profile: [] as LocalProfileRow[],
};

export const initDb = async () => { };

export const insertPendingTransaction = async (row: LocalTransactionRow) => {
  webStore.transactions.push(row);
};

export const getPendingTransactions = async () =>
  webStore.transactions.filter(row => row.status === 'pending');

const normalizeLocalDate = (value: string) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
};

export const getLocalTransactionsByDate = async (date: string) => {
  const base = dayjs(date);
  const prev = base.subtract(1, 'day').format('YYYY-MM-DD');
  const next = base.add(1, 'day').format('YYYY-MM-DD');
  const candidates = webStore.transactions.filter(row => {
    const raw = row.date;
    return raw.startsWith(date) || raw.startsWith(prev) || raw.startsWith(next);
  });
  return candidates.filter(row => normalizeLocalDate(row.date) === date);
};

export const deleteTransactionByLocalId = async (localId: string) => {
  webStore.transactions = webStore.transactions.filter(row => row.localId !== localId);
};

export const replaceSyncedTransactions = async (transactions: Transaction[]) => {
  webStore.transactions = webStore.transactions.filter(row => row.status !== 'synced');
  for (const item of transactions) {
    const serverId = item._id ?? item.id ?? '';
    const normalizedDate = normalizeLocalDate(item.date);
    webStore.transactions.push({
      localId: serverId,
      serverId,
      type: item.type,
      amount: item.amount,
      categoryId: item.categoryId ?? (typeof item.category === 'string' ? item.category : '') ?? '',
      categoryName: item.categoryName ?? (typeof item.category === 'string' ? item.category : null),
      note: item.note ?? null,
      date: normalizedDate,
      status: 'synced',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }
};

export const replaceCategories = async (categories: Category[]) => {
  webStore.categories = categories.map(category => ({
    localId: category._id ?? category.id ?? '',
    serverId: category._id ?? category.id ?? '',
    name: category.name,
    type: category.type,
    isDefault: category.isDefault ? 1 : 0,
    updatedAt: category.updatedAt,
  }));
};

export const getLocalCategories = async () =>
  webStore.categories.map(item => ({
    serverId: item.serverId,
    name: item.name,
    type: item.type,
    isDefault: item.isDefault,
  }));

export const upsertProfile = async (profile: LocalProfileRow) => {
  webStore.profile = [profile];
};

export const getLocalProfile = async () => webStore.profile[0];

export const getAllRows = async (table: 'transactions' | 'categories' | 'profile') => {
  if (table === 'transactions') return webStore.transactions.slice(0, 200);
  if (table === 'categories') return webStore.categories.slice(0, 200);
  return webStore.profile.slice(0, 200);
};

let metaStore: Record<string, string> = {};

export const setMetaValue = async (key: string, value: string) => {
  metaStore[key] = value;
};

export const getMetaValue = async (key: string) => metaStore[key];

export const getCounts = async () => ({
  transactions: webStore.transactions.length,
  categories: webStore.categories.length,
  profile: webStore.profile.length,
});

export const clearDb = async () => {
  webStore.transactions = [];
  webStore.categories = [];
  webStore.profile = [];
  metaStore = {};
};
