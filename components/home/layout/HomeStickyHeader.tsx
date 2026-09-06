import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SmartFilterHeader } from '@/components/home/all/SmartFilterHeader';
import { StickyHeaderShell } from '@/components/home/layout/StickyHeaderShell';
import {
  HOME_STICKY_HEADER_COLLAPSED_HEIGHT,
  HOME_STICKY_HEADER_EXPANDED_HEIGHT,
  HOME_STICKY_HEADER_LIST_GAP,
} from '@/components/home/layout/spacing';
import { SummaryCard } from '@/components/home/today/SummaryCard';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/context/auth-store';
import { useAppTheme } from '@/context/ThemeContext';
import { formatMoney } from '@/utils/money';
import type { AllFilters, Grouping } from '@/hooks/home/useTransactionLogic';

type BaseProps = {
  children: Parameters<typeof StickyHeaderShell>[0]['children'];
  disableTransition?: boolean; // Pass down to shell
};

type TodayVariant = {
  variant: 'today';
  income: number;
  expense: number;
  balance: number;
} & BaseProps;

type AllVariant = {
  variant: 'all';
  filters: AllFilters;
  grouping: Grouping;
  isLoading: boolean;
  onOpenFilters: () => void;
  collapsedSummary: string;
} & BaseProps;

export type HomeStickyHeaderProps = TodayVariant | AllVariant;

export function HomeStickyHeader(props: HomeStickyHeaderProps) {
  const { colors, resolvedTheme } = useAppTheme();
  const { user } = useAuthStore();
  const currencySymbol = user?.currency?.symbol ?? '$';
  const expenseColor = resolvedTheme === 'dark' ? '#ef4444' : '#dc2626';

  return (
    <StickyHeaderShell
      expandedHeight={HOME_STICKY_HEADER_EXPANDED_HEIGHT}
      collapsedHeight={HOME_STICKY_HEADER_COLLAPSED_HEIGHT}
      contentTopPadding={HOME_STICKY_HEADER_LIST_GAP}
      disableTransition={props.disableTransition}
      renderExpanded={() => {
        if (props.variant === 'today') {
          return (
            <View style={styles.expandedWrapper}>
              <SummaryCard income={props.income} expense={props.expense} balance={props.balance} />
            </View>
          );
        }
        return (
          <View style={styles.expandedWrapper}>
            <SmartFilterHeader
              filters={props.filters}
              grouping={props.grouping}
              isLoading={props.isLoading}
              onOpenFilters={props.onOpenFilters}
            />
          </View>
        );
      }}
      renderCollapsed={() => {
        if (props.variant === 'today') {
          return (
            <View style={[styles.collapsedCard, { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass }]}>
              <ThemedText style={[styles.collapsedLabel, { color: colors.textSubtle }]}>Today&apos;s Balance</ThemedText>
              <ThemedText style={[styles.collapsedValue, { color: props.balance >= 0 ? colors.primaryAccent : expenseColor }]}>
                {props.balance < 0 ? '-' : ''}{formatMoney(props.balance, currencySymbol)}
              </ThemedText>
            </View>
          );
        }
        return (
          <Pressable onPress={props.onOpenFilters} style={[styles.collapsedCard, { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass }]}>
            <ThemedText style={[styles.collapsedLabel, { color: colors.textSubtle }]}>Filters summary</ThemedText>
            <ThemedText style={[styles.collapsedValue, { color: colors.textMain }]} numberOfLines={1}>
              {props.collapsedSummary}
            </ThemedText>
          </Pressable>
        );
      }}
    >
      {props.children}
    </StickyHeaderShell>
  );
}

const styles = StyleSheet.create({
  expandedWrapper: { marginBottom: 0 },
  collapsedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: HOME_STICKY_HEADER_COLLAPSED_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  collapsedLabel: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  collapsedValue: { fontSize: 18, fontWeight: '700' },
});