import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { deleteTransaction, getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { HomeContent } from '@/components/home/layout/HomeContent';
import { HomeStickyHeader } from '@/components/home/layout/HomeStickyHeader';
import {
  HOME_BOTTOM_BAR_CLEARANCE,
  HOME_LIST_ITEM_GAP,
  HOME_STICKY_HEADER_COLLAPSED_HEIGHT,
  HOME_STICKY_HEADER_EXPANDED_HEIGHT,
} from '@/components/home/layout/spacing';
import { TransactionRow } from '@/components/home/TransactionRow';
import { ThemedText } from '@/components/themed-text';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import type { Transaction } from '@/types';
import { subtractMoney, sumMoney } from '@/utils/money';
import { getTransactionKey } from '@/utils/transaction-key';
// eslint-disable-next-line import/no-unresolved
import { deleteTransactionByLocalId, getLocalTransactionsByDate, initDb, type LocalTransactionRow } from '@/utils/local-db';

const transactionKey = ['transactions'];

export default function TodayScreen() {
  const { isAuthenticated } = useAuth();
  const { colors } = useAppTheme();
  const { offlineMode, capabilities } = useOffline();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const todayDate = dayjs().format('YYYY-MM-DD');

  // PRECISION MEASUREMENTS
  const [listLayoutHeight, setListLayoutHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

  const {
    data: todayData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: [...transactionKey, 'today', todayDate],
    queryFn: () =>
      getTransactionsFiltered({
        startDate: todayDate,
        endDate: todayDate,
      } as TransactionFilters),
    // Offline: will switch to local data source later.
    enabled: isAuthenticated && !offlineMode,
  });

  const {
    data: localRows,
    isLoading: isLocalLoading,
    refetch: refetchLocal,
    isRefetching: isLocalRefetching,
  } = useQuery({
    queryKey: [...transactionKey, 'today-local', todayDate],
    queryFn: async () => {
      await initDb();
      return getLocalTransactionsByDate(todayDate);
    },
    enabled: offlineMode,
  });

  const { transactions, income, expense, balance } = useMemo(() => {
    const items = offlineMode ? (localRows ?? []) : (todayData?.transactions ?? []);
    const incomeValues = items.filter(item => item.type === 'income').map(item => item.amount);
    const expenseValues = items.filter(item => item.type === 'expense').map(item => item.amount);
    const incomeTotal = sumMoney(incomeValues);
    const expenseTotal = sumMoney(expenseValues);
    return {
      transactions: items,
      income: incomeTotal,
      expense: expenseTotal,
      balance: subtractMoney(incomeTotal, expenseTotal),
    };
  }, [offlineMode, todayData, localRows]);

  // --- THE BULLETPROOF LOGIC (SAME AS ALL SCREEN) ---
  const { canScroll, enableTransition } = useMemo(() => {
    // 1. Distance header needs to move (168px)
    const distanceToCollapse = HOME_STICKY_HEADER_EXPANDED_HEIGHT - HOME_STICKY_HEADER_COLLAPSED_HEIGHT;

    // 2. The Total Available Scroll distance (Total Height minus the visible box)
    const totalAvailableScroll = contentHeight - listLayoutHeight;

    // CASE 1: Content fits perfectly within the window.
    if (totalAvailableScroll <= 1) {
      return { canScroll: false, enableTransition: false };
    }

    // CASE 2: Scrolling is possible, but NOT enough for full header transformation.
    // Buffer of 10px added for sub-pixel stability.
    if (totalAvailableScroll < (distanceToCollapse + 10)) {
      return { canScroll: true, enableTransition: false };
    }

    // CASE 3: Full transition allowed.
    return { canScroll: true, enableTransition: true };
  }, [contentHeight, listLayoutHeight]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onMutate: () => {
      setBlockingState('loading');
      setBlockingMessage('Deleting transaction...');
    },
    onSuccess: () => {
      setBlockingState('success');
      setBlockingMessage('Deleted!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }, 1500);
    },
    onError: (error: any) => {
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message
        || error?.response?.data?.message
        || 'Failed to delete transaction.';
      setBlockingMessage(msg);
    },
  });

  const deleteLocalMutation = useMutation({
    mutationFn: async (id: string) => {
      // Manual delay for effect if instant
      setBlockingState('loading');
      setBlockingMessage('Deleting locally...');
      await initDb();
      await deleteTransactionByLocalId(id);
    },
    onSuccess: () => {
      setBlockingState('success');
      setBlockingMessage('Deleted!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        refetchLocal();
      }, 1000);
    },
  });

  const renderEmptyState = () => {
    return (
      <View style={styles.center}>
        <ThemedText style={styles.emptyText}>No activity today.</ThemedText>
        <ThemedText style={[styles.emptySubText, { color: colors.textMuted }]}>
          Tap the + button to add one.
        </ThemedText>
      </View>
    );
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!offlineMode && isAuthenticated) {
        void refetch();
      }
    });
    return unsubscribe;
  }, [navigation, offlineMode, isAuthenticated, refetch]);

  return (
    <HomeContent bleedBottom>
      <HomeStickyHeader
        variant="today"
        income={income}
        expense={expense}
        balance={balance}
        // MASTER SWITCH: Prevents halfway overlap in Case 2
        disableTransition={!enableTransition}
      >
        {({ onScroll, contentContainerStyle }) => (
          <Pressable style={styles.listWrapper} onPress={() => setOpenNoteId(null)}>
            <Animated.FlatList
              data={transactions}
              keyExtractor={(item: any, index) => getTransactionKey(item as Transaction, index)}

              // Apply Threshold Logic
              scrollEnabled={canScroll}
              onScroll={enableTransition ? onScroll : undefined}
              scrollEventThrottle={16}

              contentContainerStyle={[
                styles.listContent,
                contentContainerStyle,
                // Ensure list ends clearly above the navigation bar
                { paddingBottom: HOME_BOTTOM_BAR_CLEARANCE },
                transactions.length === 0 ? styles.listEmptyContent : null,
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={offlineMode ? isLocalRefetching : isRefetching}
                  onRefresh={offlineMode ? refetchLocal : refetch}
                  tintColor={colors.primaryAccent}
                />
              }

              // Measurement Hooks
              onLayout={(event) => setListLayoutHeight(event.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setContentHeight(height)}

              ListEmptyComponent={renderEmptyState}
              renderItem={({ item }) => {
                if (offlineMode) {
                  const row = item as LocalTransactionRow;
                  const localTransaction: Transaction = {
                    id: row.localId,
                    localId: row.localId,
                    amount: row.amount,
                    type: row.type,
                    category: row.categoryName ?? row.categoryId,
                    categoryName: row.categoryName ?? undefined,
                    categoryId: row.categoryId,
                    date: row.date,
                    note: row.note ?? undefined,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                  };
                  const canDeleteLocal = row.status === 'pending';
                  const id = localTransaction.id ?? '';
                  return (
                    <TransactionRow
                      transaction={localTransaction}
                      mode="today"
                      canDelete={canDeleteLocal}
                      onDelete={(delId) => deleteLocalMutation.mutate(delId)}
                      isNoteOpen={Boolean(id && openNoteId === id)}
                      onToggleNote={() => setOpenNoteId(curr => (curr === id ? null : id))}
                      onRowPress={() => setOpenNoteId(null)}
                    />
                  );
                }

                const serverItem = item as Transaction;
                const id = serverItem._id ?? serverItem.id ?? '';
                return (
                  <TransactionRow
                    transaction={serverItem}
                    mode="today"
                    canDelete={capabilities.canDelete}
                    onDelete={(delId) => deleteMutation.mutate(delId)}
                    isNoteOpen={Boolean(id && openNoteId === id)}
                    onToggleNote={() => setOpenNoteId(curr => (curr === id ? null : id))}
                    onRowPress={() => setOpenNoteId(null)}
                  />
                );
              }}
            />
          </Pressable>
        )}
      </HomeStickyHeader>
      <BlockingModal
        state={blockingState}
        message={blockingMessage}
        onClose={() => setBlockingState('idle')}
      />
      {(offlineMode ? isLocalLoading : isLoading) && <LoadingOverlay />}
    </HomeContent>
  );
}

const styles = StyleSheet.create({
  listWrapper: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubText: {
    opacity: 0.6,
  },
  listContent: {
    gap: HOME_LIST_ITEM_GAP,
  },
  listEmptyContent: {
    flexGrow: 1,
  },
});
