import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { AllFilters, Grouping } from '../_hooks/useTransactionLogic';
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

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ThemedText type="title" style={styles.title}>
            Filters &amp; sorting
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Tune the date range, type, category, sort and grouping for this view.
          </ThemedText>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <FilterControls
              filters={draftFilters}
              categories={categories}
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
                pressed && styles.buttonPressed,
              ]}
              onPress={onClose}
            >
              <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
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
    backgroundColor: 'rgba(0,0,0,0.22)',
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
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
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
    backgroundColor: 'rgba(0,0,0,0.12)',
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
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    borderColor: 'rgba(211,216,224,0.9)',
    backgroundColor: 'rgba(255,255,255,0.96)',
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
