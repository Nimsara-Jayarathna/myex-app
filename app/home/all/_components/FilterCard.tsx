import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type TypeFilter = 'all' | 'income' | 'expense';

interface AllFilters {
  startDate?: string;
  endDate?: string;
  typeFilter: TypeFilter;
  sortField: 'date' | 'amount' | 'category';
  sortDirection: 'asc' | 'desc';
}

type FilterCardProps = {
  filters: AllFilters;
  today: string;
  setFilters: React.Dispatch<React.SetStateAction<AllFilters>>;
};

const accentColor = '#3498db';

export function FilterCard({ filters, today, setFilters }: FilterCardProps) {
  return (
    <View style={styles.filterCard}>
      <View style={styles.filtersRow}>
        <View style={styles.filterColumn}>
          <ThemedText style={styles.filterLabel}>From</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Set start date"
            style={({ pressed }) => [styles.filterPill, pressed && styles.filterPillPressed]}
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
            style={({ pressed }) => [styles.filterPill, pressed && styles.filterPillPressed]}
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
            style={({ pressed }) => [styles.filterPill, pressed && styles.filterPillPressed]}
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
            style={({ pressed }) => [styles.filterPill, pressed && styles.filterPillPressed]}
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
  );
}

const styles = StyleSheet.create({
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
});

