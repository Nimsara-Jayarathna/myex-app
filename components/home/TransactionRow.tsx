import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/context/auth-store';
import { useAppTheme } from '@/context/ThemeContext';

// ...

type TransactionRowProps = {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  mode?: 'today' | 'all'; // Functional switch for different views
  isNoteOpen?: boolean;
  onToggleNote?: () => void;
  onRowPress?: () => void;
};

export function TransactionRow({
  transaction,
  onDelete,
  canDelete = true,
  mode = 'today',
  isNoteOpen = false,
  onToggleNote,
  onRowPress,
}: TransactionRowProps) {
  const { colors, resolvedTheme } = useAppTheme();
  const { user } = useAuthStore();
  const currencySymbol = user?.currency?.symbol ?? '$';

  const isIncome = transaction.type === 'income';

  // LOGIC: Check if record was created today to allow deletion
  const isDeletable = dayjs(transaction.date).isSame(dayjs(), 'day');

  const descriptionText = [transaction.description, transaction.note]
    .map((value) => value?.trim())
    .find((value) => value && value !== 'r');
  const hasNote = Boolean(descriptionText);

  const statusColor = isIncome
    ? (resolvedTheme === 'dark' ? '#22c55e' : '#16a34a')
    : (resolvedTheme === 'dark' ? '#ef4444' : '#dc2626');

  const iconBg = isIncome
    ? (resolvedTheme === 'dark' ? 'rgba(34, 197, 94, 0.12)' : '#d4efdf')
    : (resolvedTheme === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fadbd8');

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: colors.surfaceGlass, borderColor: colors.borderSoft }
      ]}
      onPress={(event) => {
        event.stopPropagation();
        onRowPress?.();
      }}
    >

      {/* 1. COMPACT STATUS INDICATOR */}
      <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
        <MaterialIcons
          name={isIncome ? "arrow-downward" : "arrow-upward"}
          size={16}
          color={statusColor}
        />
      </View>

      {/* 2. CATEGORY & NOTE HINT */}
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <ThemedText style={[styles.categoryName, { color: colors.textMain }]} numberOfLines={1}>
            {transaction.categoryName || "Uncategorized"}
          </ThemedText>

          {/* INNOVATION: Subtle Note Indicator */}
          {hasNote && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onToggleNote?.();
              }}
              style={[styles.noteIndicator, { backgroundColor: colors.primaryAccent + '40' }]}
              accessibilityRole="button"
              accessibilityLabel="Toggle note"
            >
              <Ionicons name="document-text" size={10} color={colors.primaryAccent} />
            </Pressable>
          )}
        </View>
        {descriptionText && isNoteOpen && (
          <ThemedText
            style={[styles.description, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {descriptionText}
          </ThemedText>
        )}
      </View>

      {/* 3. DYNAMIC RIGHT SECTION (Amount + Contextual Date) */}
      <View style={styles.rightSection}>
        <View style={styles.amountColumn}>
          <ThemedText style={[styles.amount, { color: statusColor }]}>
            {isIncome ? '+' : '-'}{currencySymbol}{Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </ThemedText>

          {/* MODE SWITCH: Show Date Capsule only in 'All' view */}
          {mode === 'all' && (
            <View style={styles.dateCapsule}>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {dayjs(transaction.date).format('DD MMM')}
              </Text>
            </View>
          )}
        </View>

        {/* DELETE ACTION: Only if record is from Today */}
        {isDeletable && canDelete && (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              const id = transaction.id || transaction._id;
              if (id) onDelete?.(id);
            }}
            style={({ pressed }) => [
              styles.deleteBtn,
              { opacity: pressed ? 0.6 : 1 }
            ]}
          >
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 4,
    width: '100%',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  noteIndicator: {
    padding: 3,
    borderRadius: 4,
  },
  description: {
    marginTop: 2,
    fontSize: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountColumn: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateCapsule: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    padding: 2,
  },
});

export default TransactionRow;
