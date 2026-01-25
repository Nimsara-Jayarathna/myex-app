import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import type { AllFilters, Grouping } from '@/hooks/home/useTransactionLogic';
import { FilterControls } from './FilterControls';
import { SortGroupControls } from './SortGroupControls';

type CategoryOption = { id: string; name: string; type: string };

type AllFiltersSheetProps = {
  visible: boolean;
  filters: AllFilters;
  grouping: Grouping;
  categories: CategoryOption[];
  onClose: () => void;
  onApply: (nextFilters: AllFilters, nextGrouping: Grouping) => void;
};

export function AllFiltersSheet({
  visible,
  filters,
  grouping,
  categories,
  onClose,
  onApply,
}: AllFiltersSheetProps) {
  const [draftFilters, setDraftFilters] = useState<AllFilters>(filters);
  const [draftGrouping, setDraftGrouping] = useState<Grouping>(grouping);
  const { colors } = useAppTheme();

  useEffect(() => {
    if (visible) {
      setDraftFilters(filters);
      setDraftGrouping(grouping);
    }
  }, [visible, filters, grouping]);

  const handleApply = () => {
    onApply(draftFilters, draftGrouping);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: AllFilters = {
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      typeFilter: 'all',
      categoryFilter: 'all',
      sortField: 'date',
      sortDirection: 'desc',
    };
    const defaultGrouping: Grouping = 'none';

    setDraftFilters(defaultFilters);
    setDraftGrouping(defaultGrouping);
    onApply(defaultFilters, defaultGrouping);
    onClose();
  };

  const visibleCategories = React.useMemo(() => {
    if (draftFilters.typeFilter === 'all') return categories;
    return categories.filter((c) => c.type === draftFilters.typeFilter);
  }, [categories, draftFilters.typeFilter]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceGlassThick,
              borderColor: colors.borderGlass,
              shadowColor: colors.textMain,
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.borderSoft }]} />
          
          <View style={styles.header}>
            <View>
              <ThemedText type="title" style={styles.title}>
                Filters & sorting
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                Tune the date range, type, category, sort and grouping.
              </ThemedText>
            </View>
            <Pressable onPress={handleReset} style={styles.resetButton}>
              <ThemedText style={[styles.resetText, { color: colors.primaryAccent }]}>
                Reset
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <FilterControls
              filters={draftFilters}
              categories={visibleCategories}
              onChange={setDraftFilters}
            />

            <SortGroupControls
              filters={draftFilters}
              grouping={draftGrouping}
              onChangeFilter={setDraftFilters}
              onChangeGrouping={setDraftGrouping}
            />
          </ScrollView>

          <View style={styles.footerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: colors.surface1,
                  borderColor: colors.borderGlass,
                },
                pressed && styles.buttonPressed,
              ]}
              onPress={onClose}
            >
              <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primaryAccent, shadowColor: colors.primaryAccent },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleApply}
            >
              <ThemedText style={styles.primaryButtonText}>Apply</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  title: {
    marginTop: 4,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  content: {
    paddingBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
