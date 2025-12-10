import dayjs from 'dayjs';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Transaction } from '@/types';

type TransactionRowProps = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? '#2ecc71' : '#e74c3c';
  const isToday = dayjs(transaction.date).isSame(dayjs(), 'day');

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <ThemedText style={styles.rowTitle}>
          {transaction.title ?? transaction.categoryName ?? String(transaction.category)}
        </ThemedText>
        <ThemedText style={styles.rowMeta}>
          {dayjs(transaction.date).format('MMM D, YYYY')}
          {isToday ? ' • Today' : ''}
        </ThemedText>
      </View>
      <View
        style={[
          styles.amountPill,
          isIncome ? styles.incomePill : styles.expensePill,
        ]}>
        <ThemedText style={[styles.rowAmount, { color: amountColor }]}>
          {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 4,
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
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    minWidth: 88,
    alignItems: 'center',
  },
  incomePill: {
    borderColor: 'rgba(46,204,113,0.55)',
    backgroundColor: 'rgba(46,204,113,0.08)',
  },
  expensePill: {
    borderColor: 'rgba(231,76,60,0.55)',
    backgroundColor: 'rgba(231,76,60,0.08)',
  },
});

