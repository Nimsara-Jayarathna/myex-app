import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProfileHeader } from '@/components/ProfileHeader';
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

const accentColor = '#3498db';

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

  return (
    <ThemedView style={styles.screen}>
      <ProfileHeader user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null} />

      <View style={styles.container}>
        <View style={styles.filterCard}>
          <View style={styles.filtersRow}>
            <View style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>From</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set start date"
                style={({ pressed }) => [
                  styles.filterPill,
                  pressed && styles.filterPillPressed,
                ]}
                onPress={() =>
                  setFilters(current => ({
                    ...current,
                    startDate: today,
                  }))
                }>
                <ThemedText style={styles.filterPillText}>
                  {filters.startDate ?? 'Any'}
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>To</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set end date"
                style={({ pressed }) => [
                  styles.filterPill,
                  pressed && styles.filterPillPressed,
                ]}
                onPress={() =>
                  setFilters(current => ({
                    ...current,
                    endDate: today,
                  }))
                }>
                <ThemedText style={styles.filterPillText}>
                  {filters.endDate ?? 'Any'}
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>Type</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle transaction type filter"
                style={({ pressed }) => [
                  styles.filterPill,
                  styles.filterPillSegmented,
                  pressed && styles.filterPillPressed,
                ]}
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
                <ThemedText style={styles.filterPillTextAccent}>
                  {filters.typeFilter === 'all'
                    ? 'All'
                    : filters.typeFilter === 'income'
                    ? 'Income'
                    : 'Expense'}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.filtersRow}>
            <View style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>Sort by</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change sort field"
                style={({ pressed }) => [
                  styles.filterPill,
                  pressed && styles.filterPillPressed,
                ]}
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
                <ThemedText style={styles.filterPillText}>
                  {filters.sortField === 'date'
                    ? 'Date'
                    : filters.sortField === 'amount'
                    ? 'Amount'
                    : 'Category'}
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.filterColumn}>
              <ThemedText style={styles.filterLabel}>Direction</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle sort direction"
                style={({ pressed }) => [
                  styles.filterPill,
                  pressed && styles.filterPillPressed,
                ]}
                onPress={() =>
                  setFilters(current => ({
                    ...current,
                    sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
                  }))
                }>
                <ThemedText style={styles.filterPillText}>
                  {filters.sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                </ThemedText>
              </Pressable>
            </View>
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
      </View>
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
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 6,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  filterCard: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(211,216,224,0.9)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    gap: 12,
  },
  filterPill: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(211,216,224,0.9)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillSegmented: {
    borderColor: accentColor,
    backgroundColor: 'rgba(52,152,219,0.06)',
  },
  filterPillPressed: {
    opacity: 0.9,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillTextAccent: {
    fontSize: 13,
    fontWeight: '600',
    color: accentColor,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(211,216,224,0.9)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
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
