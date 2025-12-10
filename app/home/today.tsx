import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { ProfileHeader } from '@/components/ProfileHeader';
import { getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/useAuth';
import type { Transaction } from '@/types';

const transactionKey = ['transactions'];

export default function TodayScreen() {
  const { user, isAuthenticated } = useAuth();
  const todayDate = dayjs().format('YYYY-MM-DD');

  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todayIncome, setTodayIncome] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [todayBalance, setTodayBalance] = useState(0);

  const {
    data: todayData,
    isLoading: isTodayLoading,
    isError: isTodayError,
  } = useQuery({
    queryKey: [...transactionKey, 'today', todayDate],
    queryFn: () =>
      getTransactionsFiltered({
        startDate: todayDate,
        endDate: todayDate,
      } as TransactionFilters),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const items = todayData?.transactions ?? [];
    setTodayTransactions(items);
    const income = items
      .filter(item => item.type === 'income')
      .reduce((total, item) => total + item.amount, 0);
    const expense = items
      .filter(item => item.type === 'expense')
      .reduce((total, item) => total + item.amount, 0);
    setTodayIncome(income);
    setTodayExpense(expense);
    setTodayBalance(income - expense);
  }, [todayData]);

  return (
    <ThemedView style={styles.screen}>
      <ProfileHeader user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null} />

      <View style={styles.container}>
        <View style={styles.summaryRow}>
          <SummaryCard label="Income" value={todayIncome} color="#2ecc71" />
          <SummaryCard label="Expenses" value={todayExpense} color="#e74c3c" />
          <SummaryCard label="Balance" value={todayBalance} color="#3498db" />
        </View>

        {isTodayLoading && (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        )}

        {isTodayError && (
          <View style={styles.center}>
            <ThemedText>Unable to load dashboard data.</ThemedText>
          </View>
        )}

        {!isTodayLoading && !isTodayError && todayTransactions.length === 0 ? (
          <View style={styles.center}>
            <ThemedText>
              No activity today. Add a transaction on the web to see it here.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={todayTransactions}
            keyExtractor={item =>
              String(item.id ?? `${item.date}-${item.amount}-${item.title}`)
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <TransactionRow transaction={item} />}
          />
        )}
      </View>
    </ThemedView>
  );
}

const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => {
  return (
    <View style={[styles.summaryCard, { borderColor: color }]}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, { color }]}>
        ${value.toFixed(2)}
      </ThemedText>
    </View>
  );
};

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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderColor: 'rgba(211,216,224,0.9)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  listContent: {
    paddingBottom: 4,
    gap: 8,
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
