import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { Category } from '@/types';

type Props = {
  category: Category;
  isDefault: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onSetDefault: () => void;
};

export function CategoryRow({
  category,
  isDefault,
  canDelete,
  isDeleting,
  onDelete,
  onSetDefault,
}: Props) {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryInfo}>
        <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
      </View>

      <View style={styles.categoryActions}>
        <TouchableOpacity
          onPress={!isDefault ? onSetDefault : undefined}
          disabled={isDefault}
          style={styles.iconButton}>
          <ThemedText
            style={[styles.iconDefault, isDefault && styles.iconDefaultActive]}>
            {isDefault ? '★' : '☆'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDelete}
          disabled={!canDelete || isDeleting}
          style={styles.iconButton}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#e74c3c" />
          ) : (
            <ThemedText
              style={[
                styles.iconDelete,
                (!canDelete || isDeleting) && styles.iconDeleteDisabled,
              ]}>
              ×
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  iconDefault: {
    fontSize: 26,
    lineHeight: 28,
    color: '#f1c40f',
  },
  iconDefaultActive: {
    opacity: 1,
  },
  iconDelete: {
    fontSize: 26,
    lineHeight: 28,
    color: '#e74c3c',
  },
  iconDeleteDisabled: {
    color: '#bdc3c7',
  },
});