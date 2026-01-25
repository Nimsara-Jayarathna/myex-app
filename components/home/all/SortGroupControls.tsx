import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import type { AllFilters, Grouping } from '@/hooks/home/useTransactionLogic';

interface Props {
  filters: AllFilters;
  grouping: Grouping;
  onChangeFilter: (f: AllFilters) => void;
  onChangeGrouping: (g: Grouping) => void;
}

export function SortGroupControls({
  filters,
  grouping,
  onChangeFilter,
  onChangeGrouping,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.grid}>
      {/* Sort: three criteria + separate direction */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface1,
            borderColor: colors.borderSoft,
            shadowColor: colors.textMain,
          },
        ]}>
        <ThemedText style={[styles.sectionTitle, { color: colors.textSubtle }]}>Sort</ThemedText>

        <View style={styles.sortRowContainer}>
          <View style={styles.buttonRow}>
            {(['date', 'amount', 'category'] as const).map(field => (
              <ControlButton
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                isActive={filters.sortField === field}
                colors={colors}
                onPress={() =>
                  onChangeFilter({
                    ...filters,
                    sortField: field,
                  })
                }
              />
            ))}
          </View>

          <View style={styles.directionGroup}>
            <Pressable
              onPress={() => onChangeFilter({ ...filters, sortDirection: 'asc' })}
              style={[
                styles.iconButton,
                filters.sortDirection === 'asc' && { backgroundColor: colors.primaryAccent },
              ]}
            >
              <MaterialIcons 
                name="arrow-upward" 
                size={16} 
                color={filters.sortDirection === 'asc' ? '#fff' : colors.textMuted} 
              />
            </Pressable>
            <Pressable
              onPress={() => onChangeFilter({ ...filters, sortDirection: 'desc' })}
              style={[
                styles.iconButton,
                filters.sortDirection === 'desc' && { backgroundColor: colors.primaryAccent },
              ]}
            >
              <MaterialIcons 
                name="arrow-downward" 
                size={16} 
                color={filters.sortDirection === 'desc' ? '#fff' : colors.textMuted} 
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Grouping */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface1,
            borderColor: colors.borderSoft,
            shadowColor: colors.textMain,
          },
        ]}>
        <ThemedText style={[styles.sectionTitle, { color: colors.textSubtle }]}>
          Group by
        </ThemedText>
        <View style={styles.buttonRow}>
          {(['none', 'month', 'category'] as const).map(g => (
            <ControlButton
              key={g}
              label={g === 'none' ? 'None' : g.charAt(0).toUpperCase() + g.slice(1)}
              isActive={grouping === g}
              colors={colors}
              onPress={() => onChangeGrouping(g)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const ControlButton = ({
  label,
  isActive,
  colors,
  onPress,
}: {
  label: string;
  isActive: boolean;
  colors: {
    surface1: string;
    surface2: string; // Ensure this exists or use a fallback
    borderSoft: string;
    primaryAccent: string;
    textMain: string;
    textMuted: string;
  };
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.button,
      { 
        backgroundColor: isActive ? colors.primaryAccent : colors.surface2, 
        borderColor: isActive ? colors.primaryAccent : colors.borderSoft 
      },
      isActive && {
        shadowColor: colors.primaryAccent,
      },
    ]}>
    <ThemedText
      style={[
        styles.buttonText,
        { color: isActive ? '#fff' : colors.textMain },
      ]}>
      {label}
    </ThemedText>
  </Pressable>
);

const styles = StyleSheet.create({
  grid: { gap: 8, marginTop: 10 },
  section: {
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  sortRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  directionGroup: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(150,150,150,0.2)',
    paddingLeft: 8,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: 6,
    // flex: 1 is tricky in restricted width, removing it to rely on content width or just centering.
  },
  button: {
    paddingHorizontal: 12, // Slightly increased for touch target, balanced by nowrap
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonActive: {
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: { fontSize: 12, fontWeight: '500' },
  // buttonTextActive removed as logic handles it inline
});
