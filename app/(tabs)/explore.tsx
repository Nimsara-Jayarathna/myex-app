import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/useAuth';
import type { Transaction } from '@/types';

type TypeFilter = 'all' | 'income' | 'expense';

interface AllFilters {
  startDate?: string;
  endDate?: string;
  typeFilter: TypeFilter;
  sortField: 'date' | 'amount' | 'category';
  sortDirection: 'asc' | 'desc';
}

export default function AllTransactionsScreen() {
  const { isAuthenticated, user } = useAuth();

  const today = dayjs().format('YYYY-MM-DD');
  const [filters, setFilters] = useState<AllFilters>({
    startDate: today,
    endDate: today,
    typeFilter: 'all',
    sortField: 'date',
    sortDirection: 'desc',
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', 'all', filters],
    queryFn: () =>
      getTransactionsFiltered({
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.typeFilter === 'all' ? undefined : filters.typeFilter,
        sortBy: filters.sortField,
        sortDir: filters.sortDirection,
      } as TransactionFilters),
    enabled: isAuthenticated,
  });

  const transactions = data?.transactions ?? [];

  const displayName = useMemo(
    () => user?.name?.split(' ')[0] ?? user?.email ?? 'there',
    [user]
  );

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          All Transactions
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Log in on the web first so we can load your transactions.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.greeting}>All activity for</ThemedText>
        <ThemedText style={styles.userName}>{displayName}</ThemedText>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.filterColumn}>
          <ThemedText style={styles.filterLabel}>From</ThemedText>
          <ThemedText
            style={styles.filterValue}
            onPress={() =>
              setFilters(current => ({
                ...current,
                startDate: today,
              }))
            }>
            {filters.startDate ?? 'Any'}
          </ThemedText>
        </View>
        <View style={styles.filterColumn}>
          <ThemedText style={styles.filterLabel}>To</ThemedText>
          <ThemedText
            style={styles.filterValue}
            onPress={() =>
              setFilters(current => ({
                ...current,
                endDate: today,
              }))
            }>
            {filters.endDate ?? 'Any'}
          </ThemedText>
        </View>
        <View style={styles.filterColumn}>
          <ThemedText style={styles.filterLabel}>Type</ThemedText>
          <ThemedText
            style={styles.filterValue}
            onPress={() =>
              setFilters(current => ({
                ...current,
                typeFilter:
                  current.typeFilter === 'all'
                    ? 'income'
                    : current.typeFilter === 'income'
                    ? 'expense'
                    : 'all',
              }))
            }>
            {filters.typeFilter === 'all'
              ? 'All'
              : filters.typeFilter === 'income'
              ? 'Income'
              : 'Expense'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.filterColumn}>
          <ThemedText style={styles.filterLabel}>Sort by</ThemedText>
          <ThemedText
            style={styles.filterValue}
            onPress={() =>
              setFilters(current => ({
                ...current,
                sortField:
                  current.sortField === 'date'
                    ? 'amount'
                    : current.sortField === 'amount'
                    ? 'category'
                    : 'date',
              }))
            }>
            {filters.sortField === 'date'
              ? 'Date'
              : filters.sortField === 'amount'
              ? 'Amount'
              : 'Category'}
          </ThemedText>
        </View>
        <View style={styles.filterColumn}>
          <ThemedText style={styles.filterLabel}>Direction</ThemedText>
          <ThemedText
            style={styles.filterValue}
            onPress={() =>
              setFilters(current => ({
                ...current,
                sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
              }))
            }>
            {filters.sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </ThemedText>
        </View>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <ThemedText>Unable to load transactions. Try again later.</ThemedText>
        </View>
      )}

      {!isLoading && !isError && transactions.length === 0 ? (
        <View style={styles.center}>
          <ThemedText>
            No transactions found. Adjust filters or add one from the web.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => String(item.id ?? `${item.date}-${item.amount}-${item.title}`)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <TransactionRow transaction={item} />}
        />
      )}
    </ThemedView>
  );
}

const TransactionRow = ({ transaction }: { transaction: Transaction }) => {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? '#2ecc71' : '#e74c3c';

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <ThemedText style={styles.rowTitle}>
          {transaction.title ?? transaction.categoryName ?? String(transaction.category)}
        </ThemedText>
        <ThemedText style={styles.rowMeta}>
          {dayjs(transaction.date).format('MMM D, YYYY')}
        </ThemedText>
      </View>
      <ThemedText style={[styles.rowAmount, { color: amountColor }]}>
        {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  filterValue: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowMeta: {
    fontSize: 12,
    opacity: 0.7,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
