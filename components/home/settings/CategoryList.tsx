import { BlurView } from 'expo-blur';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import type { Category } from '@/types';
import { CategoryRow } from './CategoryRow';

// Helper for consistent ID handling
const getCategoryId = (cat: Category) => cat._id ?? cat.id ?? '';

type Props = {
  data: Category[];
  activeTab: 'income' | 'expense';
  isLoading: boolean;
  defaultId?: string;
  deletingId?: string;
  onDelete: (cat: Category) => void;
  onSetDefault: (cat: Category) => void;
};

export function CategoryList({
  data,
  activeTab,
  isLoading,
  defaultId,
  deletingId,
  onDelete,
  onSetDefault,
}: Props) {
  const { colors, resolvedTheme } = useAppTheme();

  // Glassy styling constants (matching SmartFilterHeader/HomeTabBar)
  const isDark = resolvedTheme === 'dark';
  const blurIntensity = isDark ? 40 : 65;
  const androidFallbackOverlay = isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(226, 232, 240, 0.6)';
  const glassBorderColor = Platform.OS === 'android'
    ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)')
    : colors.borderGlass;

  if (isLoading) {
    return <ActivityIndicator style={styles.loading} color={colors.primaryAccent} />;
  }

  if (data.length === 0) {
    return (
      <View style={[styles.listContainer, { borderColor: glassBorderColor, backgroundColor: colors.surfaceGlassThick }]}>
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        {Platform.OS === 'android' && (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: androidFallbackOverlay }]}
          />
        )}
        <ThemedText style={styles.emptyText}>
          No {activeTab} categories yet.
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.listContainer,
        {
          borderColor: glassBorderColor,
          backgroundColor: colors.surfaceGlassThick,
        },
      ]}>
      {/* Glass Background Layers */}
      <BlurView
        intensity={blurIntensity}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      {Platform.OS === 'android' && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: androidFallbackOverlay }]}
        />
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {data.map((item, index) => {
          const id = getCategoryId(item);
          const isDefault = id === defaultId;
          const canDelete = !isDefault;
          const isDeleting = deletingId === id;
          const isLast = index === data.length - 1;

          return (
            <CategoryRow
              key={id}
              category={item}
              isDefault={isDefault}
              canDelete={canDelete}
              isDeleting={isDeleting}
              onDelete={() => onDelete(item)}
              onSetDefault={() => onSetDefault(item)}
              isLast={isLast}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  contentContainer: {
    zIndex: 1,
  },
  loading: {
    marginTop: 30,
  },
  emptyText: {
    textAlign: 'center',
    margin: 20,
    opacity: 0.7,
  },
});
