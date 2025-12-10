import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type SummaryCardProps = {
  income: number;
  expense: number;
  balance: number;
};

export function SummaryCard({ income, expense, balance }: SummaryCardProps) {
  // Safe formatting helper
  const formatMoney = (val: number) => 
    `$${(Number.isFinite(val) ? Math.abs(val) : 0).toFixed(2)}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.label}>Today's Balance</ThemedText>
        <ThemedText style={[styles.balanceValue, { color: balance >= 0 ? '#3498db' : '#e74c3c' }]}>
          {balance < 0 ? '-' : ''}{formatMoney(balance)}
        </ThemedText>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.column}>
          <ThemedText style={styles.subLabel}>Income</ThemedText>
          <ThemedText style={styles.incomeValue}>{formatMoney(income)}</ThemedText>
        </View>
        
        <View style={styles.verticalDivider} />

        <View style={styles.column}>
          <ThemedText style={styles.subLabel}>Expense</ThemedText>
          <ThemedText style={styles.expenseValue}>{formatMoney(expense)}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  subLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  incomeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2ecc71',
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
  },
});

export default SummaryCard;
