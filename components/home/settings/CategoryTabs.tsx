import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  activeTab: 'income' | 'expense';
  onTabChange: (tab: 'income' | 'expense') => void;
  incomeCount: number;
  expenseCount: number;
  maxCount: number;
};

export function CategoryTabs({
  activeTab,
  onTabChange,
  incomeCount,
  expenseCount,
  maxCount,
}: Props) {
  const { colors } = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = activeTab === 'expense' ? 1 : 0;

  // Animation values
  const translateX = useSharedValue(0);
  const progress = useSharedValue(0); // 0 for income, 1 for expense

  useEffect(() => {
    if (containerWidth > 0) {
      const tabWidth = (containerWidth - 8) / 2; // Subtract padding/gap if needed
      translateX.value = withSpring(activeIndex * tabWidth, {
        mass: 1,
        damping: 20,
        stiffness: 200,
      });
      progress.value = withTiming(activeIndex, { duration: 300 });
    }
  }, [activeIndex, containerWidth, translateX, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const pillStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#22c55e', '#ef4444'] // Green to Red
    );

    return {
      transform: [{ translateX: translateX.value }],
      width: (containerWidth - 8) / 2, // Accounting for padding
      backgroundColor,
    };
  });

  const incomeTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      ['#ffffff', colors.textMuted]
    );
    return { color };
  });

  const expenseTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [colors.textMuted, '#ffffff']
    );
    return { color };
  });

  return (
    <View
      style={[
        styles.tabContainer,
        { backgroundColor: colors.surfaceGlass, borderColor: colors.borderSoft },
      ]}
      onLayout={onLayout}>

      {/* Animated Pill */}
      {containerWidth > 0 && (
        <Animated.View style={[styles.pill, pillStyle]} />
      )}

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('income')}
        activeOpacity={0.7}>
        <Animated.Text style={[styles.tabText, incomeTextStyle]}>
          Income ({incomeCount}/{maxCount})
        </Animated.Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('expense')}
        activeOpacity={0.7}>
        <Animated.Text style={[styles.tabText, expenseTextStyle]}>
          Expense ({expenseCount}/{maxCount})
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 24, // Rounder implementation
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    height: 56, // Fixed height for consistent pill sizing
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Ensure text is above pill
  },
  tabText: {
    fontWeight: '600',
    fontSize: 15,
  },
  pill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 20,
  },
});
