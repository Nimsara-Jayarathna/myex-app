import { HOME_STICKY_HEADER_CARD_MIN_HEIGHT } from '@/components/home/layout/spacing';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/context/auth-store';
import { useAppTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// ...

type SummaryCardProps = {
  income: number;
  expense: number;
  balance: number;
};

export function SummaryCard({ income, expense, balance }: SummaryCardProps) {
  const { colors, resolvedTheme } = useAppTheme();
  const { user } = useAuthStore();
  const currencySymbol = user?.currency?.symbol ?? '$';

  const incomeColor = resolvedTheme === 'dark' ? '#22c55e' : '#16a34a';
  const expenseColor = resolvedTheme === 'dark' ? '#ef4444' : '#dc2626';
  const isDark = resolvedTheme === 'dark';
  const blurIntensity = isDark ? 40 : 65;
  const androidFallbackOverlay = isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(226, 232, 240, 0.6)';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : colors.borderSoft;
  // Safe formatting helper
  const formatMoney = (val: number) =>
    `${currencySymbol}${(Number.isFinite(val) ? Math.abs(val) : 0).toFixed(2)}`;

  const cardBorderColor =
    Platform.OS === 'android'
      ? isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(15, 23, 42, 0.08)'
      : colors.borderGlass;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceGlassThick,
          borderColor: cardBorderColor,
          shadowColor: colors.textMain,
        },
      ]}>
      <BlurView
        intensity={blurIntensity}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {Platform.OS === 'android' && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: androidFallbackOverlay }]}
        />
      )}
      <View style={styles.header}>
        <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
          Today&apos;s Balance
        </ThemedText>
        <ThemedText
          style={[
            styles.balanceValue,
            { color: balance >= 0 ? colors.primaryAccent : expenseColor },
          ]}>
          {balance < 0 ? '-' : ''}{formatMoney(balance)}
        </ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      <View style={styles.row}>
        <View style={styles.column}>
          <ThemedText style={[styles.subLabel, { color: colors.textSubtle }]}>
            Income
          </ThemedText>
          <ThemedText style={[styles.incomeValue, { color: incomeColor }]}>
            {formatMoney(income)}
          </ThemedText>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: dividerColor }]} />

        <View style={styles.column}>
          <ThemedText style={[styles.subLabel, { color: colors.textSubtle }]}>
            Expense
          </ThemedText>
          <ThemedText style={[styles.expenseValue, { color: expenseColor }]}>
            {formatMoney(expense)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: HOME_STICKY_HEADER_CARD_MIN_HEIGHT,
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
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    paddingVertical: 2,
  },
  divider: {
    height: 1,
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
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  incomeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  expenseValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SummaryCard;
