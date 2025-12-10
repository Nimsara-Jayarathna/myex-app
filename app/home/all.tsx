import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { ThemedText } from '@/components/themed-text';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useAuth } from '@/hooks/useAuth';
import type { Transaction } from '@/types';
import { TransactionRow } from './all/_components/TransactionRow';
import { FilterCard } from './all/_components/FilterCard';
import { AddTransactionSheet } from './_components/AddTransactionSheet';
import { HomeBackground } from './_components/HomeBackground';

type TypeFilter = 'all' | 'income' | 'expense';

export interface AllFilters {
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
  const [isAddOpen, setIsAddOpen] = useState(false);

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
    <HomeBackground>
      <ProfileHeader user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null} />

      <View style={styles.container}>
        <FilterCard filters={filters} today={today} setFilters={setFilters} />

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add transaction"
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={() => setIsAddOpen(true)}>
          <ThemedText style={styles.fabText}>+</ThemedText>
        </Pressable>
      </View>

      <AddTransactionSheet
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </HomeBackground>
  );
}

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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
  },
});
