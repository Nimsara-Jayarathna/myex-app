import dayjs from 'dayjs';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import type { Category, Transaction } from '@/types';
import { logError } from '@/utils/logger';

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

let db: SQLiteDatabase | null = null;

const NULL_SENTINEL = '__BLIPZO_NULL__';

const getDb = () => {
  if (!db) {
    db = openDatabaseSync('blipzo.db');
  }
  return db;
};

type BindValue = string | number | null;

const toNullableParam = (value: unknown): string | number => {
  if (value === undefined || value === null) return NULL_SENTINEL;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
};

const coerceParam = (value: unknown): BindValue => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      logError('local-db: failed to serialize param, using String()', error);
      return String(value);
    }
  }
  return String(value);
};

const normalizeParams = (params: unknown[]): BindValue[] => params.map((value) => coerceParam(value));

const run = async (sql: string, params: unknown[] = []) => {
  const normalized = normalizeParams(params);
  if (!normalized.length) return getDb().runAsync(sql);
  try {
    return await getDb().runAsync(sql, ...normalized);
  } catch (error) {
    logError('local-db: run failed', error);
    throw error;
  }
};

const getAll = async <T,>(sql: string, params: unknown[] = []) => {
  const normalized = normalizeParams(params);
  if (!normalized.length) return getDb().getAllAsync<T>(sql);
  return getDb().getAllAsync<T>(sql, ...normalized);
};

const getFirst = async <T,>(sql: string, params: unknown[] = []) => {
  const normalized = normalizeParams(params);
  if (!normalized.length) return getDb().getFirstAsync<T>(sql);
  return getDb().getFirstAsync<T>(sql, ...normalized);
};

export const initDb = async () => {
  try {
    await run(
      `CREATE TABLE IF NOT EXISTS transactions (
        localId TEXT PRIMARY KEY NOT NULL,
        serverId TEXT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        categoryId TEXT NOT NULL,
        categoryName TEXT,
        note TEXT,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`
    );

    await run(
      `CREATE TABLE IF NOT EXISTS categories (
        localId TEXT PRIMARY KEY NOT NULL,
        serverId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        isDefault INTEGER NOT NULL,
        updatedAt TEXT NOT NULL
      );`
    );

    await run(
      `CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        fname TEXT,
        lname TEXT,
        email TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        categoryLimit INTEGER,
        defaultIncomeCategories TEXT,
        defaultExpenseCategories TEXT,
        currency_id TEXT,
        currency_name TEXT,
        currency_code TEXT,
        currency_symbol TEXT
      );`
    );

    // Migrations for existing tables
    try { await run(`ALTER TABLE profile ADD COLUMN currency_id TEXT;`); } catch { }
    try { await run(`ALTER TABLE profile ADD COLUMN currency_name TEXT;`); } catch { }
    try { await run(`ALTER TABLE profile ADD COLUMN currency_code TEXT;`); } catch { }
    try { await run(`ALTER TABLE profile ADD COLUMN currency_symbol TEXT;`); } catch { }

    await run(
      `CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`
    );
  } catch (error) {
    logError('local-db: initDb failed', error);
    throw error;
  }
};

export const insertPendingTransaction = async (row: LocalTransactionRow) => {
  try {
    await run(
      `INSERT INTO transactions (
        localId, serverId, type, amount, categoryId, categoryName, note, date, status, createdAt, updatedAt
      ) VALUES (
        ?, NULLIF(?, '${NULL_SENTINEL}'), ?, ?, ?, NULLIF(?, '${NULL_SENTINEL}'),
        NULLIF(?, '${NULL_SENTINEL}'), ?, ?, ?, ?
      )`,
      [
        row.localId,
        toNullableParam(row.serverId),
        row.type,
        row.amount,
        row.categoryId,
        toNullableParam(row.categoryName),
        toNullableParam(row.note),
        row.date,
        row.status,
        row.createdAt,
        row.updatedAt,
      ]
    );
  } catch (error) {
    logError('local-db: insertPendingTransaction failed', error);
    throw error;
  }
};

export const getPendingTransactions = async () => {
  return getAll<LocalTransactionRow>(
    `SELECT * FROM transactions WHERE status = 'pending' ORDER BY createdAt ASC`
  );
};

const normalizeLocalDate = (value: string) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
};

export const getLocalTransactionsByDate = async (date: string) => {
  const base = dayjs(date);
  const prev = base.subtract(1, 'day').format('YYYY-MM-DD');
  const next = base.add(1, 'day').format('YYYY-MM-DD');
  const rows = await getAll<LocalTransactionRow>(
    `SELECT * FROM transactions WHERE date LIKE ? OR date LIKE ? OR date LIKE ? ORDER BY createdAt DESC`,
    [`${prev}%`, `${date}%`, `${next}%`]
  );
  return rows.filter(row => normalizeLocalDate(row.date) === date);
};

export const deleteTransactionByLocalId = async (localId: string) => {
  await run(`DELETE FROM transactions WHERE localId = ?`, [localId]);
};

export const replaceSyncedTransactions = async (transactions: Transaction[]) => {
  await run(`DELETE FROM transactions WHERE status = 'synced'`);

  for (const item of transactions) {
    const serverId = item._id ?? item.id ?? '';
    const normalizedDate = normalizeLocalDate(item.date);
    await run(
      `INSERT INTO transactions (
        localId, serverId, type, amount, categoryId, categoryName, note, date, status, createdAt, updatedAt
      ) VALUES (
        ?, NULLIF(?, '${NULL_SENTINEL}'), ?, ?, ?, NULLIF(?, '${NULL_SENTINEL}'),
        NULLIF(?, '${NULL_SENTINEL}'), ?, 'synced', ?, ?
      )`,
      [
        serverId,
        toNullableParam(serverId),
        item.type,
        item.amount,
        item.categoryId ?? (typeof item.category === 'string' ? item.category : '') ?? '',
        toNullableParam(item.categoryName ?? (typeof item.category === 'string' ? item.category : null)),
        toNullableParam(item.note),
        normalizedDate,
        item.createdAt,
        item.updatedAt,
      ]
    );
  }
};

export const replaceCategories = async (categories: Category[]) => {
  await run(`DELETE FROM categories`);

  for (const category of categories) {
    const serverId = category._id ?? category.id ?? '';
    await run(
      `INSERT INTO categories (
        localId, serverId, name, type, isDefault, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        serverId,
        serverId,
        category.name,
        category.type,
        category.isDefault ? 1 : 0,
        category.updatedAt,
      ]
    );
  }
};

export const getLocalCategories = async () => {
  return getAll<{
    serverId: string;
    name: string;
    type: 'income' | 'expense';
    isDefault: number;
  }>(`SELECT * FROM categories`);
};

export const upsertProfile = async (profile: LocalProfileRow) => {
  await run(
    `INSERT OR REPLACE INTO profile (
      id, name, fname, lname, email, createdAt, updatedAt, categoryLimit, defaultIncomeCategories, defaultExpenseCategories,
      currency_id, currency_name, currency_code, currency_symbol
    ) VALUES (
      ?, ?, NULLIF(?, '${NULL_SENTINEL}'), NULLIF(?, '${NULL_SENTINEL}'), ?, ?, ?,
      NULLIF(?, '${NULL_SENTINEL}'), NULLIF(?, '${NULL_SENTINEL}'), NULLIF(?, '${NULL_SENTINEL}'),
      NULLIF(?, '${NULL_SENTINEL}'), NULLIF(?, '${NULL_SENTINEL}'), NULLIF(?, '${NULL_SENTINEL}'), NULLIF(?, '${NULL_SENTINEL}')
    )`,
    [
      profile.id,
      profile.name,
      toNullableParam(profile.fname),
      toNullableParam(profile.lname),
      profile.email,
      profile.createdAt,
      profile.updatedAt,
      toNullableParam(profile.categoryLimit),
      profile.defaultIncomeCategories
        ? JSON.stringify(profile.defaultIncomeCategories)
        : NULL_SENTINEL,
      profile.defaultExpenseCategories
        ? JSON.stringify(profile.defaultExpenseCategories)
        : NULL_SENTINEL,
      toNullableParam(profile.currency_id),
      toNullableParam(profile.currency_name),
      toNullableParam(profile.currency_code),
      toNullableParam(profile.currency_symbol),
    ]
  );
};

export const getLocalProfile = async () => {
  return getFirst<LocalProfileRow>(`SELECT * FROM profile LIMIT 1`);
};

export const getAllRows = async (table: 'transactions' | 'categories' | 'profile') => {
  return getAll<Record<string, unknown>>(`SELECT * FROM ${table} LIMIT 200`);
};

export const setMetaValue = async (key: string, value: string) => {
  await run(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, [key, value]);
};

export const getMetaValue = async (key: string) => {
  const result = await getFirst<{ value: string }>(
    `SELECT value FROM meta WHERE key = ? LIMIT 1`,
    [key]
  );
  return result?.value;
};

export const getCounts = async () => {
  const tx = await getFirst<{ count: number }>(`SELECT COUNT(*) as count FROM transactions`);
  const cat = await getFirst<{ count: number }>(`SELECT COUNT(*) as count FROM categories`);
  const prof = await getFirst<{ count: number }>(`SELECT COUNT(*) as count FROM profile`);
  return {
    transactions: tx?.count ?? 0,
    categories: cat?.count ?? 0,
    profile: prof?.count ?? 0,
  };
};

export const clearDb = async () => {
  try {
    await run(`DELETE FROM transactions`);
    await run(`DELETE FROM categories`);
    await run(`DELETE FROM profile`);
    await run(`DELETE FROM meta`);
  } catch (error) {
    logError('local-db: clearDb failed', error);
    throw error;
  }
};
