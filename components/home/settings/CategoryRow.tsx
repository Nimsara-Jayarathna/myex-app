import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import type { Category } from '@/types';

type Props = {
  category: Category;
  isDefault: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onSetDefault: () => void;
  isLast?: boolean;
};

export function CategoryRow({
  category,
  isDefault,
  canDelete,
  isDeleting,
  onDelete,
  onSetDefault,
  isLast = false,
}: Props) {
  const { colors, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : colors.borderSoft;

  return (
    <View style={[styles.categoryRow, !isLast && { borderBottomWidth: 1, borderBottomColor: dividerColor }]}>
      <View style={styles.categoryInfo}>
        <View style={[styles.iconPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
           <ThemedText style={styles.initial}>
             {category.name.charAt(0).toUpperCase()}
           </ThemedText>
        </View>
        <ThemedText style={styles.categoryName} numberOfLines={1}>{category.name}</ThemedText>
      </View>

      <View style={styles.categoryActions}>
        <TouchableOpacity
          onPress={!isDefault ? onSetDefault : undefined}
          disabled={isDefault}
          style={[
            styles.actionButton, 
            isDefault && styles.actionButtonActive,
            { backgroundColor: isDefault ? (isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)') : 'transparent' }
          ]}
          accessibilityLabel={isDefault ? "Default category" : "Set as default"}
        >
          <MaterialIcons 
            name={isDefault ? "star" : "star-outline"} 
            size={20} 
            color={isDefault ? colors.primaryAccent : colors.textSubtle} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDelete}
          disabled={!canDelete || isDeleting}
          style={[styles.actionButton, styles.deleteButton]}
          accessibilityLabel="Delete category"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <MaterialIcons 
              name="delete-outline" 
              size={20} 
              color={(!canDelete) ? colors.textSubtle : "#ef4444"} 
              style={{ opacity: !canDelete ? 0.3 : 1 }}
            />
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    // optional styling for active state bg
  },
  deleteButton: {
    // optional specific delete button styling
  },
});
