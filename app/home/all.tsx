import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { deleteTransaction, getTransactionsFiltered, type TransactionFilters } from '@/api/transactions';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/context/OfflineContext';
import { TransactionList } from '@/components/home/all/TransactionList';
import { HomeContent } from '@/components/home/layout/HomeContent';
import { HomeStickyHeader } from '@/components/home/layout/HomeStickyHeader';
import { useAppTheme } from '@/context/ThemeContext';
import {
  HOME_BOTTOM_BAR_CLEARANCE,
  HOME_STICKY_HEADER_COLLAPSED_HEIGHT,
  HOME_STICKY_HEADER_EXPANDED_HEIGHT,
} from '@/components/home/layout/spacing';
import {
  type AllFilters,
  type Grouping,
  useGroupedTransactions,
  useTransactionCategories,
} from '@/hooks/home/useTransactionLogic';
import { AllFiltersSheet } from '@/components/home/all/AllFiltersSheet';
import { FloatingSummaryButton } from '@/components/home/all/FloatingSummaryButton';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

export default function AllTransactionsScreen() {
  const { isAuthenticated } = useAuth();
  const { colors } = useAppTheme();
  const { offlineMode, capabilities } = useOffline();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const [filters, setFilters] = useState<AllFilters>({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    typeFilter: 'all', categoryFilter: 'all',
    sortField: 'date', sortDirection: 'desc',
  });
  const [grouping, setGrouping] = useState<Grouping>('none');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const [listLayoutHeight, setListLayoutHeight] = useState(0); 
  const [contentHeight, setContentHeight] = useState(0); 
  
  const [isFilterUpdating, setIsFilterUpdating] = useState(false);
  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined); 



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

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['transactions', 'all', filters],
    queryFn: () => getTransactionsFiltered({
      startDate: filters.startDate,
      endDate: filters.endDate,
      type: filters.typeFilter === 'all' ? undefined : filters.typeFilter,
      sortBy: filters.sortField,
      sortDir: filters.sortDirection,
    } as TransactionFilters),
    // Offline: blocked by navigation guard; local data can be wired in later.
    enabled: isAuthenticated && !offlineMode,
  });

  // Get available categories to help with robust matching (ID vs Name)
  const { categoriesForType } = useTransactionCategories(filters, setFilters);

  const filteredTransactions = useMemo(() => {
    const raw = data?.transactions ?? [];
    if (filters.categoryFilter === 'all') return raw;

    // Find the full category object for the selected filter
    const selectedCat = categoriesForType.find(c => c.id === filters.categoryFilter);
    const targetName = selectedCat?.name;

    return raw.filter((txn) => {
      // 1. Resolve Transaction Category Data
      const tCat = txn.category;
      const tCatId = typeof tCat === 'object' ? (tCat?._id ?? tCat?.id) : tCat;
      const tCatName = (typeof tCat === 'object' ? tCat?.name : tCat) ?? txn.categoryName; // Fallback to categoryName field

      // 2. Check Match (ID or Name)
      const matchesId = tCatId === filters.categoryFilter;
      const matchesName = targetName && tCatName === targetName;

      return matchesId || matchesName;
    });
  }, [data?.transactions, filters.categoryFilter, categoriesForType]);
  const groupedData = useGroupedTransactions(filteredTransactions, grouping);

  const typeLabel = filters.typeFilter === 'all' ? 'All types' : filters.typeFilter === 'income' ? 'Income' : 'Expense';
  const formatRange = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (start.isSame(end, 'day')) return start.format('DD MMM YYYY');
    return `${start.format('DD MMM')} – ${end.format('DD MMM YYYY')}`;
  };
  const collapsedSummary = `${formatRange(filters.startDate, filters.endDate)} • ${typeLabel}`;

  const { canScroll, enableTransition } = useMemo(() => {
    const distanceToCollapse = HOME_STICKY_HEADER_EXPANDED_HEIGHT - HOME_STICKY_HEADER_COLLAPSED_HEIGHT;
    const scrollRunway = contentHeight - listLayoutHeight;

    if (scrollRunway <= 1) return { canScroll: false, enableTransition: false };
    if (scrollRunway < (distanceToCollapse + 10)) return { canScroll: true, enableTransition: false };
    return { canScroll: true, enableTransition: true };
  }, [contentHeight, listLayoutHeight]);

  useEffect(() => {
    if (!isFetching && isFilterUpdating) {
      setIsFilterUpdating(false);
    }
  }, [isFetching, isFilterUpdating]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!offlineMode && isAuthenticated) {
        void refetch();
      }
    });
    return unsubscribe;
  }, [navigation, offlineMode, isAuthenticated, refetch]);

  // Determine effective blocking state
  const effectiveBlockingState = blockingState === 'idle' && isFilterUpdating ? 'loading' : blockingState;
  const effectiveBlockingMessage = blockingState === 'idle' && isFilterUpdating ? 'Updating filters...' : blockingMessage;
  
  return (
    <View style={{ flex: 1 }}>
      <HomeContent bleedBottom>
        <HomeStickyHeader
          variant="all"
          filters={filters}
          grouping={grouping}
          isLoading={isFetching || isLoading}
          onOpenFilters={() => setIsFiltersOpen(true)}
          collapsedSummary={collapsedSummary}
          disableTransition={!enableTransition} // Apply switch
        >
          {({ onScroll, contentContainerStyle }) => (
            <View style={styles.listWrapper}>
              <TransactionList
                data={filteredTransactions}
                groupedData={groupedData}
                HeaderComponent={() => null}
                onDelete={(id) => deleteMutation.mutate(id)}
                canDelete={capabilities.canDelete}
                openNoteId={openNoteId}
                onToggleNote={(id) => setOpenNoteId(current => (current === id ? null : id))}
                onRowPress={() => setOpenNoteId(null)}
                scrollEnabled={canScroll}
                onScroll={enableTransition ? onScroll : undefined}
                contentContainerStyle={[contentContainerStyle, { paddingBottom: HOME_BOTTOM_BAR_CLEARANCE }]}
                onLayout={(event) => setListLayoutHeight(event.nativeEvent.layout.height)}
                onContentSizeChange={(_, height) => setContentHeight(height)}
                refreshControl={
                  <RefreshControl
                    refreshing={isFetching}
                    onRefresh={refetch}
                    tintColor={colors.primaryAccent}
                  />
                }
              />
            </View>
          )}
        </HomeStickyHeader>

        <AllFiltersSheet
          visible={isFiltersOpen}
          filters={filters}
          grouping={grouping}
          categories={categoriesForType}
          onClose={() => setIsFiltersOpen(false)}
          onApply={(nextFilters, nextGrouping) => {
            setIsFilterUpdating(true);
            setFilters(nextFilters);
            setGrouping(nextGrouping);
          }}
        />
      </HomeContent>

      <FloatingSummaryButton 
        transactions={filteredTransactions} 
        visible={true} 
      />
      <BlockingModal 
          state={effectiveBlockingState} 
          message={effectiveBlockingMessage} 
          onClose={() => setBlockingState('idle')}
        />
        {(isLoading || isFetching) && !isFilterUpdating && <LoadingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  listWrapper: { flex: 1 },
});
