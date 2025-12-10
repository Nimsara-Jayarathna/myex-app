import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/themed-text';
import { HomeBackground } from './_components/HomeBackground';
import { AddTransactionSheet } from './_components/AddTransactionSheet';

// Sub-components
import { TransactionList } from './all/_components/TransactionList';
import { 
  type AllFilters, 
  type Grouping, 
  useGroupedTransactions, 
  useTransactionCategories 
} from './all/_hooks/useTransactionLogic';
import { AllFiltersSheet } from './all/_components/AllFiltersSheet';

export default function AllTransactionsScreen() {
  const { isAuthenticated, user } = useAuth();
  const today = dayjs().format('YYYY-MM-DD');

  // --- STATE ---
  const [filters, setFilters] = useState<AllFilters>({
    startDate: today,
    endDate: today,
    typeFilter: 'all',
    categoryFilter: 'all',
    sortField: 'date',
    sortDirection: 'desc',
  });
  const [grouping, setGrouping] = useState<Grouping>('none');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // --- DATA ---
  const { data, isLoading } = useQuery({
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
  
  // Apply category filtering locally (API handles Type/Date, Client handles Category specific ID)
  const filteredTransactions = transactions.filter((txn) => {
    if (filters.categoryFilter === 'all') return true;
    const catId = typeof txn.category === 'string' ? txn.category : txn.category?.id ?? txn.category?._id;
    return catId === filters.categoryFilter;
  });

  // --- HOOKS ---
  const { categoriesForType } = useTransactionCategories(filters, setFilters);
  const groupedData = useGroupedTransactions(filteredTransactions, grouping);

  // --- RENDER ---
  return (
    <HomeBackground>
      <ProfileHeader user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null} />

      <View style={styles.container}>
        <TransactionList 
          data={filteredTransactions}
          groupedData={groupedData}
          HeaderComponent={() => (
            <View style={styles.headerContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.filtersButton,
                  pressed && styles.filtersButtonPressed,
                ]}
                onPress={() => setIsFiltersOpen(true)}
              >
                <ThemedText style={styles.filtersButtonLabel}>
                  Filters, sort &amp; group
                </ThemedText>
                <ThemedText style={styles.filtersButtonSummary}>
                  {filters.startDate} → {filters.endDate} •{' '}
                  {filters.typeFilter === 'all'
                    ? 'All types'
                    : filters.typeFilter === 'income'
                    ? 'Income'
                    : 'Expense'}
                </ThemedText>
              </Pressable>
              {isLoading && <ActivityIndicator style={{ marginTop: 20 }} />}
            </View>
          )}
        />

        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setIsAddOpen(true)}>
          <ThemedText style={styles.fabText}>+</ThemedText>
        </Pressable>
      </View>

      <AddTransactionSheet
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <AllFiltersSheet
        visible={isFiltersOpen}
        filters={filters}
        grouping={grouping}
        categories={categoriesForType}
        onClose={() => setIsFiltersOpen(false)}
        onApply={(nextFilters, nextGrouping) => {
          setFilters(nextFilters);
          setGrouping(nextGrouping);
        }}
      />
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerContainer: { paddingBottom: 16, paddingTop: 8 },
  filtersButton: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(211,216,224,0.9)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  filtersButtonPressed: {
    opacity: 0.9,
  },
  filtersButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  filtersButtonSummary: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    backgroundColor: '#2980b9',
    transform: [{ scale: 0.95 }],
  },
  fabText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '400',
    marginTop: -2,
  },
});
