import dayjs from 'dayjs';
import React from 'react';
import { FlatList, SectionList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Transaction } from '@/types';
import type { GroupedSection } from '../_hooks/useTransactionLogic';
import { TransactionRow } from './TransactionRow';

interface Props {
  data: Transaction[];
  groupedData: GroupedSection[] | null;
  HeaderComponent: React.ComponentType<any>;
}

export function TransactionList({ data, groupedData, HeaderComponent }: Props) {
  // If grouped, use SectionList
  if (groupedData) {
    return (
      <SectionList
        sections={groupedData}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        ListHeaderComponent={HeaderComponent}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionAccentBar} />
              <ThemedText style={styles.sectionTitle}>GROUP: {title}</ThemedText>
            </View>
            <View style={styles.sectionBadge}>
              <ThemedText style={styles.sectionBadgeText}>{data.length} ITEMS</ThemedText>
            </View>
          </View>
        )}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    );
  }

  // Otherwise, standard FlatList
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id ?? Math.random().toString()}
      ListHeaderComponent={HeaderComponent}
      renderItem={({ item }) => <TransactionRow transaction={item} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.center}>
          <ThemedText>No transactions found.</ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 140, gap: 12 },
  center: { padding: 40, alignItems: 'center' },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginTop: 16,
    borderRadius: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccentBar: { width: 4, height: 16, borderRadius: 2, backgroundColor: '#3498db' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#2c3e50', textTransform: 'uppercase' },
  sectionBadge: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(52,152,219,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', color: '#3498db', letterSpacing: 0.5 },
});
