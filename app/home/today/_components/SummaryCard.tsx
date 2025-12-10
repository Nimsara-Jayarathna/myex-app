import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type SummaryCardProps = {
  income: number;
  expense: number;
  balance: number;
};

export function SummaryCard({ income, expense, balance }: SummaryCardProps) {
  const safeIncome = Number.isFinite(income) ? income : 0;
  const safeExpense = Number.isFinite(expense) ? expense : 0;
  const safeBalance = Number.isFinite(balance) ? balance : 0;

  return (
    <View style={styles.summaryCard}>
      <ThemedText style={styles.title}>Today&apos;s snapshot</ThemedText>
      <View style={styles.metricsRow}>
        <View style={styles.metricColumn}>
          <View style={[styles.metricPill, styles.incomePill]}>
            <ThemedText style={[styles.metricLabel, styles.incomeLabel]}>Income</ThemedText>
            <ThemedText style={[styles.metricValue, styles.incomeValue]}>
              ${safeIncome.toFixed(2)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.metricColumn}>
          <View style={[styles.metricPill, styles.expensePill]}>
            <ThemedText style={[styles.metricLabel, styles.expenseLabel]}>Expenses</ThemedText>
            <ThemedText style={[styles.metricValue, styles.expenseValue]}>
              ${safeExpense.toFixed(2)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.metricColumn}>
          <View style={[styles.metricPill, styles.balancePill]}>
            <ThemedText style={[styles.metricLabel, styles.balanceLabel]}>Balance</ThemedText>
            <ThemedText style={[styles.metricValue, styles.balanceValue]}>
              ${safeBalance.toFixed(2)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.58)',
    shadowColor: 'rgba(52,152,219,0.55)',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.22,
    shadowRadius: 42,
    elevation: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.75,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 14,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricPill: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  incomeLabel: {
    color: '#2ecc71',
  },
  incomeValue: {
    color: '#2ecc71',
  },
  incomePill: {
    borderColor: 'rgba(46,204,113,0.55)',
    backgroundColor: 'rgba(46,204,113,0.08)',
  },
  expenseLabel: {
    color: '#e74c3c',
  },
  expenseValue: {
    color: '#e74c3c',
  },
  expensePill: {
    borderColor: 'rgba(231,76,60,0.55)',
    backgroundColor: 'rgba(231,76,60,0.08)',
  },
  balanceLabel: {
    color: '#3498db',
  },
  balanceValue: {
    color: '#3498db',
  },
  balancePill: {
    borderColor: 'rgba(52,152,219,0.55)',
    backgroundColor: 'rgba(52,152,219,0.08)',
  },
});
