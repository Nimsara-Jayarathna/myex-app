import dayjs from 'dayjs';

import { getCategories } from '@/api/categories';
import { createTransaction, getTransactionsFiltered } from '@/api/transactions';
import type { UserProfile } from '@/types';
import {
  deleteTransactionByLocalId,
  getPendingTransactions,
  initDb,
  replaceCategories,
  replaceSyncedTransactions,
  setMetaValue,
  upsertProfile,
} from '@/utils/local-db';
import { setSyncState } from '@/utils/sync-state';

let isSyncing = false;

export const runFullSync = async (profile?: UserProfile) => {
  if (isSyncing) return;
  isSyncing = true;
  setSyncState({ isSyncing: true, message: 'Checking offline records...' });
  try {
    await initDb();

    const pending = await getPendingTransactions();
    if (pending.length) {
      setSyncState({
        isSyncing: true,
        message: 'Syncing offline records...',
        progress: { current: 0, total: pending.length },
      });
    }

    for (const [index, item] of pending.entries()) {
      try {
        setSyncState({
          isSyncing: true,
          message: 'Syncing offline records...',
          progress: { current: index + 1, total: pending.length },
        });
        await createTransaction({
          amount: item.amount,
          type: item.type,
          category: item.categoryId,
          date: item.date,
          note: item.note ?? undefined,
        });
        await deleteTransactionByLocalId(item.localId);
      } catch {
        // Keep pending item for next sync pass.
      }
    }

    setSyncState({ isSyncing: true, message: 'Refreshing transactions...' });
    const startDate = dayjs().format('YYYY-MM-DD');
    const endDate = dayjs().add(7, 'day').format('YYYY-MM-DD');
    const { transactions } = await getTransactionsFiltered({
      startDate,
      endDate,
      sortBy: 'date',
      sortDir: 'desc',
    });
    await replaceSyncedTransactions(transactions);

    setSyncState({ isSyncing: true, message: 'Refreshing categories...' });
    const categoriesResponse = await getCategories();
    await replaceCategories(categoriesResponse.categories ?? []);

    if (profile) {
      setSyncState({ isSyncing: true, message: 'Refreshing profile...' });
      await upsertProfile({
        id: profile.id,
        name: profile.name,
        fname: profile.fname,
        lname: profile.lname,
        email: profile.email,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        categoryLimit: profile.categoryLimit,
        defaultIncomeCategories: profile.defaultIncomeCategories,
        defaultExpenseCategories: profile.defaultExpenseCategories,
        currency_id: profile.currency?.id ?? profile.currency?._id,
        currency_name: profile.currency?.name,
        currency_code: profile.currency?.code,
        currency_symbol: profile.currency?.symbol,
      });
    }

    await setMetaValue('lastSyncAt', new Date().toISOString());
  } finally {
    isSyncing = false;
    setSyncState({ isSyncing: false, message: undefined, progress: undefined });
  }
};
