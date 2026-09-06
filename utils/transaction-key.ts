import type { Transaction } from '@/types';
import { toMinorUnits } from '@/utils/money';

export const getTransactionKey = (transaction: Transaction, index = 0): string => {
  const explicitId = transaction.localId ?? transaction._id ?? transaction.id;
  if (explicitId) return explicitId;

  const category = transaction.categoryId
    ?? transaction.categoryName
    ?? (typeof transaction.category === 'string' ? transaction.category : transaction.category?.id ?? transaction.category?._id ?? transaction.category?.name)
    ?? 'uncategorized';
  let minor = 0;
  try { minor = toMinorUnits(transaction.amount); } catch { /* use safe fallback */ }
  return [transaction.date, transaction.createdAt, transaction.type, category, minor, index].join(':');
};
