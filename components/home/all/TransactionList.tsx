import React from 'react';
import {
  SectionList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { HOME_LIST_ITEM_GAP } from '@/components/home/layout/spacing';
import { TransactionRow } from '@/components/home/TransactionRow';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import type { GroupedSection } from '@/hooks/home/useTransactionLogic';
import type { Transaction } from '@/types';

// FIX: Create the animated component with a type cast to preserve Generics
const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

interface Props {
  data: Transaction[];
  groupedData: GroupedSection[] | null;
  HeaderComponent: React.ComponentType<any>;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  openNoteId?: string | null;
  onToggleNote?: (id: string) => void;
  onRowPress?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onScroll?: any;
  onLayout?: (event: LayoutChangeEvent) => void;
  onContentSizeChange?: (width: number, height: number) => void;
  scrollEnabled?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function TransactionList({
  data,
  groupedData,
  HeaderComponent,
  onDelete,
  canDelete = true,
  openNoteId,
  onToggleNote,
  onRowPress,
  contentContainerStyle,
  onScroll,
  onLayout,
  onContentSizeChange,
  scrollEnabled,
  refreshControl,
}: Props) {
  const { colors } = useAppTheme();

  if (groupedData) {
    return (
      <AnimatedSectionList
        // FIX: Cast sections to any to bypass SectionList's strict internal type check
        sections={groupedData as any}
        // FIX: Use 'any' for the item here to satisfy the generic requirement
        keyExtractor={(item: any) => item._id ?? item.id ?? Math.random().toString()}
        ListHeaderComponent={HeaderComponent}
        showsVerticalScrollIndicator={false}
        // FIX: Explicitly type the section info object
        renderSectionHeader={({ section }: { section: any }) => {
          const typedSection = section as GroupedSection;
          return (
            <View
              style={[
                styles.sectionHeader,
                {
                  backgroundColor: colors.surfaceGlassThick,
                  borderBottomColor: colors.borderSoft,
                },
              ]}>
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionAccentBar, { backgroundColor: colors.primaryAccent }]} />
                <ThemedText style={[styles.sectionTitle, { color: colors.textMain }]}>
                  {typedSection.title}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.sectionBadge,
                  { backgroundColor: colors.surface1, borderColor: colors.borderGlass },
                ]}>
                <ThemedText style={[styles.sectionBadgeText, { color: colors.primaryAccent }]}>
                  {typedSection.data.length} ITEMS
                </ThemedText>
              </View>
            </View>
          );
        }}
        // FIX: Explicitly type the item info object
        renderItem={({ item }: any) => {
          const txn = item as Transaction;
          const id = txn._id ?? txn.id ?? '';
          return (
            <TransactionRow
              transaction={txn}
              mode="all"
              onDelete={onDelete}
              canDelete={canDelete}
              isNoteOpen={Boolean(id && openNoteId === id)}
              onToggleNote={() => onToggleNote?.(id)}
              onRowPress={onRowPress}
            />
          );
        }}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        scrollEnabled={scrollEnabled}
        refreshControl={refreshControl}
        stickySectionHeadersEnabled={false}
      />
    );
  }

  return (
    <Animated.FlatList
      data={data}
      keyExtractor={(item: any) => item._id ?? item.id ?? Math.random().toString()}
      ListHeaderComponent={HeaderComponent}
      renderItem={({ item }: any) => {
        const txn = item as Transaction;
        const id = txn._id ?? txn.id ?? '';
        return (
          <TransactionRow
            transaction={txn}
            mode="all"
            onDelete={onDelete}
            canDelete={canDelete}
            isNoteOpen={Boolean(id && openNoteId === id)}
            onToggleNote={() => onToggleNote?.(id)}
            onRowPress={onRowPress}
          />
        );
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      scrollEnabled={scrollEnabled}
      refreshControl={refreshControl}
      ListEmptyComponent={
        <View style={styles.center}>
          <ThemedText>No transactions found.</ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { gap: HOME_LIST_ITEM_GAP },
  center: { padding: 40, alignItems: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccentBar: { width: 4, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  sectionBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
