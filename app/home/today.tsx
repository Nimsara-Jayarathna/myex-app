import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Pressable, 
  StyleSheet, 
  View, 
  RefreshControl 
} from 'react-native';

import { ProfileHeader } from '@/components/ProfileHeader';
import { getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import type { Transaction } from '@/types';
import { SummaryCard } from './today/_components/SummaryCard';
import { TransactionRow } from './today/_components/TransactionRow';
import { AddTransactionSheet } from './_components/AddTransactionSheet';
import { HomeBackground } from './_components/HomeBackground';

const transactionKey = ['transactions'];

export default function TodayScreen() {
  const { user, isAuthenticated } = useAuth();
  const todayDate = dayjs().format('YYYY-MM-DD');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const {
    data: todayData,
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: [...transactionKey, 'today', todayDate],
    queryFn: () =>
      getTransactionsFiltered({
        startDate: todayDate,
        endDate: todayDate,
      } as TransactionFilters),
    enabled: isAuthenticated,
  });

  // PERF: Calculate derived state directly (no useEffect needed)
  const { transactions, income, expense, balance } = useMemo(() => {
    const items = todayData?.transactions ?? [];
    
    let inc = 0;
    let exp = 0;

    items.forEach(item => {
      if (item.type === 'income') inc += item.amount;
      else if (item.type === 'expense') exp += item.amount;
    });

    return {
      transactions: items,
      income: inc,
      expense: exp,
      balance: inc - exp,
    };
  }, [todayData]);

  // Helper for IDs
  const getKey = (item: Transaction) => item._id ?? item.id ?? Math.random().toString();

  return (
    <HomeBackground>
      <ProfileHeader user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null} />

      <View style={styles.container}>
        <View style={styles.summaryWrapper}>
          <SummaryCard income={income} expense={expense} balance={balance} />
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        )}

        {isError && (
          <View style={styles.center}>
            <ThemedText>Unable to load dashboard data.</ThemedText>
            <ThemedText onPress={() => refetch()} style={styles.retryText}>Tap to retry</ThemedText>
          </View>
        )}

        {!isLoading && !isError && transactions.length === 0 ? (
          <View style={styles.center}>
            <ThemedText style={styles.emptyText}>No activity today.</ThemedText>
            <ThemedText style={styles.emptySubText}>Tap the + button to add one.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={getKey}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3498db" />
            }
            renderItem={({ item }) => <TransactionRow transaction={item} />}
          />
        )}

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
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  summaryWrapper: {
    marginBottom: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  retryText: {
    marginTop: 8,
    textDecorationLine: 'underline',
    color: '#3498db',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubText: {
    opacity: 0.6,
  },
  listContent: {
    paddingBottom: 140, // Extra space so FAB and tab bar don't cover content
    gap: 12,
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
    // Enhanced Shadow
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
    marginTop: -2, // Visual center correction
  },
});
