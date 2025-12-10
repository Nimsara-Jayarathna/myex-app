import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type Props = {
  activeTab: 'income' | 'expense';
  onTabChange: (tab: 'income' | 'expense') => void;
  incomeCount: number;
  expenseCount: number;
  maxCount: number;
};

export function CategoryTabs({
  activeTab,
  onTabChange,
  incomeCount,
  expenseCount,
  maxCount,
}: Props) {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'income' && styles.tabActiveIncome]}
        onPress={() => onTabChange('income')}>
        <ThemedText
          style={[
            styles.tabText,
            activeTab === 'income' && styles.tabTextActiveIncome,
          ]}>
          Income ({incomeCount}/{maxCount})
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'expense' && styles.tabActiveExpense]}
        onPress={() => onTabChange('expense')}>
        <ThemedText
          style={[
            styles.tabText,
            activeTab === 'expense' && styles.tabTextActiveExpense,
          ]}>
          Expense ({expenseCount}/{maxCount})
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActiveIncome: {
    backgroundColor: '#e8f5e9',
  },
  tabActiveExpense: {
    backgroundColor: '#ffebee',
  },
  tabText: {
    fontWeight: '600',
    color: '#7f8c8d',
  },
  tabTextActiveIncome: {
    color: '#2ecc71',
  },
  tabTextActiveExpense: {
    color: '#e74c3c',
  },
});