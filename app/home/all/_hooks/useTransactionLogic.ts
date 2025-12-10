import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import { getAllCategories } from '@/api/categories';
import type { Transaction } from '@/types';

// --- Types ---
export type SortField = 'date' | 'amount' | 'category';
export type SortDirection = 'asc' | 'desc';
export type TransactionTypeFilter = 'all' | 'income' | 'expense';
export type Grouping = 'none' | 'month' | 'category';

export interface AllFilters {
  startDate: string;
  endDate: string;
  typeFilter: TransactionTypeFilter;
  categoryFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export interface GroupedSection {
  title: string;
  data: Transaction[];
}

// --- Hook: Categories ---
export function useTransactionCategories(
  filters: AllFilters,
  onFiltersChange: (f: AllFilters) => void
) {
  const { data: categoriesData } = useQuery({
    queryKey: ['categoriesAll', filters.typeFilter],
    queryFn: () =>
      getAllCategories(
        filters.typeFilter === 'all'
          ? undefined
          : filters.typeFilter === 'income' || filters.typeFilter === 'expense'
          ? filters.typeFilter
          : undefined
      ),
  });

  const categoriesForType = useMemo(
    () =>
      (categoriesData ?? []).map((item) => ({
        id: item.id ?? item._id ?? item.name,
        name: item.name,
        type: item.type,
      })),
    [categoriesData]
  );

  // Auto-reset category if it becomes invalid for the selected type
  useEffect(() => {
    if (filters.categoryFilter === 'all') return;
    if (!categoriesForType.length) return;

    const stillValid = categoriesForType.some((cat) => cat.id === filters.categoryFilter);
    if (!stillValid) {
      onFiltersChange({ ...filters, categoryFilter: 'all' });
    }
  }, [categoriesForType, filters, onFiltersChange]);

  return { categoriesForType };
}

// --- Hook: Grouping ---
export function useGroupedTransactions(
  transactions: Transaction[],
  grouping: Grouping
): GroupedSection[] | null {
  return useMemo(() => {
    if (grouping === 'none') return null;

    const buckets = new Map<string, Transaction[]>();
    
    transactions.forEach((txn) => {
      let key: string;
      if (grouping === 'month') {
        key = dayjs(txn.date).format('MMMM YYYY');
      } else {
        key =
          typeof txn.category === 'string'
            ? txn.category || txn.categoryName || txn.title || 'Uncategorised'
            : txn.category?.name ?? txn.categoryName ?? txn.title ?? 'Uncategorised';
      }
      
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(txn);
    });

    return Array.from(buckets.entries()).map(([title, data]) => ({ title, data }));
  }, [grouping, transactions]);
}