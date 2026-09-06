import dayjs from 'dayjs';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { deleteDatabaseAsync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import type { Category, Transaction } from '@/types';
import { fromMinorUnits, normalizeMoney, toMinorUnits } from '@/utils/money';
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

type StoredTransactionRow = Omit<LocalTransactionRow, 'amount'> & {
  amountMinor?: number | null;
  /** Legacy-only plaintext/encrypted schema field, removed after migration. */
  amount?: number | null;
};

type BindValue = string | number | null;

type PlaintextSnapshot = {
  transactions: StoredTransactionRow[];
  categories: Record<string, unknown>[];
  profile: Record<string, unknown>[];
  meta: Record<string, unknown>[];
};

const DB_NAME = 'blipzo.db';
const DB_KEY_SECURE_STORE_KEY = 'blipzo.db.encryption-key.v1';
const NULL_SENTINEL = '__BLIPZO_NULL__';

let db: SQLiteDatabase | null = null;
let initialization: Promise<void> | null = null;

const escapeSqlString = (value: string) => value.replace(/'/g, "''");

const getOrCreateEncryptionKey = async () => {
  const existing = await SecureStore.getItemAsync(DB_KEY_SECURE_STORE_KEY);
  if (existing) return existing;

  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(bytes, byte => Number(byte).toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(DB_KEY_SECURE_STORE_KEY, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
};

const applyEncryptionKey = async (database: SQLiteDatabase, key: string) => {
  await database.execAsync(`PRAGMA key = '${escapeSqlString(key)}';`);
};

const normalizeParams = (params: unknown[]): BindValue[] =>
  params.map(value => {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        logError('local-db: failed to serialize parameter', error);
        return String(value);
      }
    }
    return String(value);
  });

const toNullableParam = (value: unknown): string | number => {
  if (value === undefined || value === null) return NULL_SENTINEL;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
};

const rawRun = async (database: SQLiteDatabase, sql: string, params: unknown[] = []) => {
  const normalized = normalizeParams(params);
  return normalized.length
    ? database.runAsync(sql, ...normalized)
    : database.runAsync(sql);
};

const rawGetAll = async <T,>(database: SQLiteDatabase, sql: string, params: unknown[] = []) => {
  const normalized = normalizeParams(params);
  return normalized.length
    ? database.getAllAsync<T>(sql, ...normalized)
    : database.getAllAsync<T>(sql);
};

const tableExists = async (database: SQLiteDatabase, name: string) => {
  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = ?`,
    name
  );
  return (result?.count ?? 0) > 0;
};

const capturePlaintextSnapshot = async (database: SQLiteDatabase): Promise<PlaintextSnapshot> => {
  const read = async <T,>(table: string): Promise<T[]> => {
    if (!(await tableExists(database, table))) return [];
    return database.getAllAsync<T>(`SELECT * FROM ${table}`);
  };

  return {
    transactions: await read<StoredTransactionRow>('transactions'),
    categories: await read<Record<string, unknown>>('categories'),
    profile: await read<Record<string, unknown>>('profile'),
    meta: await read<Record<string, unknown>>('meta'),
  };
};

const createSchema = async (database: SQLiteDatabase) => {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      localId TEXT PRIMARY KEY NOT NULL,
      serverId TEXT,
      type TEXT NOT NULL,
      amountMinor INTEGER NOT NULL,
      categoryId TEXT NOT NULL,
      categoryName TEXT,
      note TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      localId TEXT PRIMARY KEY NOT NULL,
      serverId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      isDefault INTEGER NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profile (
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
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const bestEffort = async (sql: string) => {
    try {
      await database.execAsync(sql);
    } catch {
      // Column already exists or migration is not needed.
    }
  };

  await bestEffort('ALTER TABLE profile ADD COLUMN currency_id TEXT;');
  await bestEffort('ALTER TABLE profile ADD COLUMN currency_name TEXT;');
  await bestEffort('ALTER TABLE profile ADD COLUMN currency_code TEXT;');
  await bestEffort('ALTER TABLE profile ADD COLUMN currency_symbol TEXT;');

  const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');
  const columnNames = new Set(columns.map(column => column.name));
  if (columnNames.has('amount')) {
    if (!columnNames.has('amountMinor')) {
      await database.execAsync('ALTER TABLE transactions ADD COLUMN amountMinor INTEGER;');
    }
    await database.execAsync(
      'UPDATE transactions SET amountMinor = CAST(ROUND(amount * 100) AS INTEGER) WHERE amountMinor IS NULL;'
    );
    try {
      await database.execAsync(`
      BEGIN IMMEDIATE;
      CREATE TABLE transactions_v2 (
        localId TEXT PRIMARY KEY NOT NULL,
        serverId TEXT,
        type TEXT NOT NULL,
        amountMinor INTEGER NOT NULL,
        categoryId TEXT NOT NULL,
        categoryName TEXT,
        note TEXT,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      INSERT INTO transactions_v2 (
        localId, serverId, type, amountMinor, categoryId, categoryName, note, date, status, createdAt, updatedAt
      )
      SELECT
        localId, serverId, type, COALESCE(amountMinor, CAST(ROUND(amount * 100) AS INTEGER)),
        categoryId, categoryName, note, date, status, createdAt, updatedAt
      FROM transactions;
      DROP TABLE transactions;
      ALTER TABLE transactions_v2 RENAME TO transactions;
      COMMIT;
    `);
    } catch (error) {
      try {
        await database.execAsync('ROLLBACK;');
      } catch {
        // SQLite may already have rolled the migration back.
      }
      throw error;
    }
  }
};

const restoreSnapshot = async (database: SQLiteDatabase, snapshot: PlaintextSnapshot) => {
  for (const row of snapshot.transactions) {
    const legacyAmount = Number(row.amount ?? 0);
    const amountMinor = row.amountMinor ?? toMinorUnits(legacyAmount);
    await rawRun(
      database,
      `INSERT OR REPLACE INTO transactions (
        localId, serverId, type, amountMinor, categoryId, categoryName, note, date, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.localId,
        row.serverId ?? null,
        row.type,
        amountMinor,
        row.categoryId,
        row.categoryName ?? null,
        row.note ?? null,
        row.date,
        row.status,
        row.createdAt,
        row.updatedAt,
      ]
    );
  }

  for (const row of snapshot.categories) {
    await rawRun(
      database,
      `INSERT OR REPLACE INTO categories (localId, serverId, name, type, isDefault, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [row.localId, row.serverId, row.name, row.type, row.isDefault, row.updatedAt]
    );
  }

  for (const row of snapshot.profile) {
    await rawRun(
      database,
      `INSERT OR REPLACE INTO profile (
        id, name, fname, lname, email, createdAt, updatedAt, categoryLimit,
        defaultIncomeCategories, defaultExpenseCategories, currency_id, currency_name, currency_code, currency_symbol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.name,
        row.fname ?? null,
        row.lname ?? null,
        row.email,
        row.createdAt,
        row.updatedAt,
        row.categoryLimit ?? null,
        row.defaultIncomeCategories ?? null,
        row.defaultExpenseCategories ?? null,
        row.currency_id ?? null,
        row.currency_name ?? null,
        row.currency_code ?? null,
        row.currency_symbol ?? null,
      ]
    );
  }

  for (const row of snapshot.meta) {
    if (typeof row.key === 'string' && typeof row.value === 'string') {
      await rawRun(database, 'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [row.key, row.value]);
    }
  }
};

const initializeDatabase = async () => {
  const key = await getOrCreateEncryptionKey();
  let candidate = openDatabaseSync(DB_NAME);

  try {
    await applyEncryptionKey(candidate, key);
    await candidate.getFirstAsync('SELECT COUNT(*) AS count FROM sqlite_master');
    db = candidate;
  } catch (encryptedOpenError) {
    // Existing installs may still have the old plaintext cache. Preserve it before
    // replacing the local cache with its encrypted SQLCipher equivalent.
    try {
      await candidate.closeAsync();
    } catch {}

    const plaintext = openDatabaseSync(DB_NAME);
    let snapshot: PlaintextSnapshot;
    try {
      snapshot = await capturePlaintextSnapshot(plaintext);
    } catch (snapshotError) {
      logError('local-db: plaintext migration snapshot failed', snapshotError);
      throw encryptedOpenError;
    } finally {
      try {
        await plaintext.closeAsync();
      } catch {}
    }

    await deleteDatabaseAsync(DB_NAME);
    candidate = openDatabaseSync(DB_NAME);
    await applyEncryptionKey(candidate, key);
    db = candidate;
    await createSchema(candidate);
    await restoreSnapshot(candidate, snapshot);
  }

  await createSchema(db);
};

export const initDb = async () => {
  if (!initialization) {
    initialization = initializeDatabase().catch(error => {
      initialization = null;
      db = null;
      logError('local-db: initDb failed', error);
      throw error;
    });
  }
  return initialization;
};

const requireDb = async () => {
  await initDb();
  if (!db) throw new Error('Local database unavailable');
  return db;
};

const run = async (sql: string, params: unknown[] = []) => rawRun(await requireDb(), sql, params);
const getAll = async <T,>(sql: string, params: unknown[] = []) =>
  rawGetAll<T>(await requireDb(), sql, params);
const getFirst = async <T,>(sql: string, params: unknown[] = []) => {
  const database = await requireDb();
  const normalized = normalizeParams(params);
  return normalized.length
    ? database.getFirstAsync<T>(sql, ...normalized)
    : database.getFirstAsync<T>(sql);
};

const normalizeStoredTransaction = (row: StoredTransactionRow): LocalTransactionRow => {
  const { amountMinor, amount: legacyAmount, ...rest } = row;
  const resolvedMinor = amountMinor ?? toMinorUnits(Number(legacyAmount ?? 0));
  return {
    ...rest,
    amount: fromMinorUnits(Number(resolvedMinor)),
  };
};

export const insertPendingTransaction = async (row: LocalTransactionRow) => {
  const normalizedAmount = normalizeMoney(row.amount);
  await run(
    `INSERT INTO transactions (
      localId, serverId, type, amountMinor, categoryId, categoryName, note, date, status, createdAt, updatedAt
    ) VALUES (
      ?, NULLIF(?, '${NULL_SENTINEL}'), ?, ?, ?, NULLIF(?, '${NULL_SENTINEL}'),
      NULLIF(?, '${NULL_SENTINEL}'), ?, ?, ?, ?
    )`,
    [
      row.localId,
      toNullableParam(row.serverId),
      row.type,
      toMinorUnits(normalizedAmount),
      row.categoryId,
      toNullableParam(row.categoryName),
      toNullableParam(row.note),
      row.date,
      row.status,
      row.createdAt,
      row.updatedAt,
    ]
  );
};

export const getPendingTransactions = async () => {
  const rows = await getAll<StoredTransactionRow>(
    `SELECT * FROM transactions WHERE status = 'pending' ORDER BY createdAt ASC`
  );
  return rows.map(normalizeStoredTransaction);
};

const normalizeLocalDate = (value: string) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
};

export const getLocalTransactionsByDate = async (date: string) => {
  const base = dayjs(date);
  const prev = base.subtract(1, 'day').format('YYYY-MM-DD');
  const next = base.add(1, 'day').format('YYYY-MM-DD');
  const rows = await getAll<StoredTransactionRow>(
    `SELECT * FROM transactions WHERE date LIKE ? OR date LIKE ? OR date LIKE ? ORDER BY createdAt DESC`,
    [`${prev}%`, `${date}%`, `${next}%`]
  );
  return rows
    .filter(row => normalizeLocalDate(row.date) === date)
    .map(normalizeStoredTransaction);
};

export const deleteTransactionByLocalId = async (localId: string) => {
  await run(`DELETE FROM transactions WHERE localId = ?`, [localId]);
};

export const replaceSyncedTransactions = async (transactions: Transaction[]) => {
  await run(`DELETE FROM transactions WHERE status = 'synced'`);

  for (const item of transactions) {
    const serverId = item._id ?? item.id ?? '';
    if (!serverId) continue;
    const normalizedDate = normalizeLocalDate(item.date);
    const normalizedAmount = normalizeMoney(item.amount);
    await run(
      `INSERT INTO transactions (
        localId, serverId, type, amountMinor, categoryId, categoryName, note, date, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
      [
        serverId,
        serverId,
        item.type,
        toMinorUnits(normalizedAmount),
        item.categoryId ?? (typeof item.category === 'string' ? item.category : (item.category?.id ?? item.category?._id ?? '')),
        item.categoryName ?? (typeof item.category === 'string' ? item.category : item.category?.name ?? null),
        item.note ?? null,
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
    if (!serverId) continue;
    await run(
      `INSERT INTO categories (localId, serverId, name, type, isDefault, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [serverId, serverId, category.name, category.type, category.isDefault ? 1 : 0, category.updatedAt]
    );
  }
};

export const getLocalCategories = async () =>
  getAll<{ serverId: string; name: string; type: 'income' | 'expense'; isDefault: number }>(
    `SELECT serverId, name, type, isDefault FROM categories`
  );

export const upsertProfile = async (profile: LocalProfileRow) => {
  await run(
    `INSERT OR REPLACE INTO profile (
      id, name, fname, lname, email, createdAt, updatedAt, categoryLimit,
      defaultIncomeCategories, defaultExpenseCategories, currency_id, currency_name, currency_code, currency_symbol
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.id,
      profile.name,
      profile.fname ?? null,
      profile.lname ?? null,
      profile.email,
      profile.createdAt,
      profile.updatedAt,
      profile.categoryLimit ?? null,
      profile.defaultIncomeCategories ? JSON.stringify(profile.defaultIncomeCategories) : null,
      profile.defaultExpenseCategories ? JSON.stringify(profile.defaultExpenseCategories) : null,
      profile.currency_id ?? null,
      profile.currency_name ?? null,
      profile.currency_code ?? null,
      profile.currency_symbol ?? null,
    ]
  );
};

type StoredProfileRow = Omit<
  LocalProfileRow,
  'defaultIncomeCategories' | 'defaultExpenseCategories'
> & {
  defaultIncomeCategories?: string | null;
  defaultExpenseCategories?: string | null;
};

export const getLocalProfile = async () => {
  const row = await getFirst<StoredProfileRow>(`SELECT * FROM profile LIMIT 1`);
  if (!row) return undefined;
  const parseStringArray = (value: unknown): string[] | undefined => {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
    if (typeof value !== 'string' || value.length === 0) return undefined;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : undefined;
    } catch {
      return undefined;
    }
  };
  return {
    ...row,
    defaultIncomeCategories: parseStringArray(row.defaultIncomeCategories),
    defaultExpenseCategories: parseStringArray(row.defaultExpenseCategories),
  } satisfies LocalProfileRow;
};

export const getAllRows = async (table: 'transactions' | 'categories' | 'profile') =>
  getAll<Record<string, unknown>>(`SELECT * FROM ${table} LIMIT 200`);

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
