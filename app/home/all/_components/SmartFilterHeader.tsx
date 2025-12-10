import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { AllFilters, Grouping } from '../_hooks/useTransactionLogic';

type SmartFilterHeaderProps = {
  filters: AllFilters;
  grouping: Grouping;
  isLoading: boolean;
  onOpenFilters: () => void;
};

export function SmartFilterHeader({
  filters,
  grouping,
  isLoading,
  onOpenFilters,
}: SmartFilterHeaderProps) {
  const typeLabel =
    filters.typeFilter === 'all'
      ? 'All types'
      : filters.typeFilter === 'income'
      ? 'Income'
      : 'Expense';

  const sortLabel =
    filters.sortField === 'date'
      ? `Date (${filters.sortDirection === 'asc' ? '↑' : '↓'})`
      : filters.sortField === 'amount'
      ? `Amount (${filters.sortDirection === 'asc' ? '↑' : '↓'})`
      : `Category (${filters.sortDirection === 'asc' ? '↑' : '↓'})`;

  const groupLabel =
    grouping === 'none' ? 'None' : grouping === 'month' ? 'Month' : 'Category';

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onOpenFilters}
      >
        <View style={styles.header}>
          <ThemedText style={styles.label}>Filters overview</ThemedText>
          <ThemedText style={styles.primary}>
            {filters.startDate} → {filters.endDate}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.column}>
            <ThemedText style={styles.subLabel}>Type</ThemedText>
            <ThemedText style={styles.valueAccent}>{typeLabel}</ThemedText>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.column}>
            <ThemedText style={styles.subLabel}>Sort / Group</ThemedText>
            <ThemedText style={styles.valueMuted} numberOfLines={1}>
              {sortLabel}
            </ThemedText>
            <ThemedText style={styles.valueMuted} numberOfLines={1}>
              Group: {groupLabel}
            </ThemedText>
          </View>
        </View>
      </Pressable>

      {isLoading && (
        <View style={styles.loadingRow}>
          {/* Caller renders ActivityIndicator beside this if desired */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
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
  cardPressed: {
    opacity: 0.95,
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
  primary: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
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
  valueAccent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
  },
  valueMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  loadingRow: {
    marginTop: 8,
  },
});

export default SmartFilterHeader;
