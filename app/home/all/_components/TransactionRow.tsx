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
  const color = isIncome ? '#27ae60' : '#c0392b';
  const displayTitle = transaction.title || transaction.categoryName || 'Untitled';
  const timeString = dayjs(transaction.date).format('h:mm A');

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconDot,
          { backgroundColor: isIncome ? '#d4efdf' : '#fadbd8' },
        ]}
      >
        <View style={[styles.innerDot, { backgroundColor: color }]} />
      </View>

      <View style={styles.info}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {displayTitle}
        </ThemedText>
        <ThemedText style={styles.meta}>
          {transaction.categoryName ? `${transaction.categoryName} • ` : ''}
          {timeString}
        </ThemedText>
      </View>

      <ThemedText style={[styles.amount, { color }]}>
        {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  iconDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

