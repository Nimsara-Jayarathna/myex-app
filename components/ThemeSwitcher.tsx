import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme, type ThemePreference } from '@/context/ThemeContext';

const options: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export function ThemeSwitcher() {
  const { colors, preference, setPreference, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const [optionWidth, setOptionWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const selectedIndex = options.findIndex(o => o.value === preference);
    if (selectedIndex !== -1 && optionWidth > 0) {
      translateX.value = withSpring(selectedIndex * optionWidth, {
        mass: 0.5,
        damping: 12,
        stiffness: 120,
      });
    }
  }, [preference, optionWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    // Assuming equal width for all 3 options, this is roughly correct if container width is fixed or shared equally.
    // However, since we flex: 1, they should be equal. We measure the first one.
    if (width > 0 && Math.abs(width - optionWidth) > 1) {
      setOptionWidth(width);
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Glass Pill */}
      <View style={[styles.shadowContainer, { shadowColor: isDark ? '#000' : '#888' }]}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.glassPill, { borderColor: colors.borderGlass }]}
        >
          {/* Animated Background Pill */}
          {optionWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingPill,
                {
                  width: optionWidth - 8, // Subtract padding/gap adjustment
                  backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.02)',
                  borderWidth: 1,
                },
                animatedStyle,
              ]}
            />
          )}

          {options.map((option, index) => {
            const isActive = preference === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setPreference(option.value)}
                onLayout={index === 0 ? handleLayout : undefined}
                accessibilityRole="button"
                accessibilityLabel={`Switch theme to ${option.label}`}
                style={[styles.option, { flex: 1 }]}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    {
                      color: isActive ? colors.textMain : colors.textMuted,
                      fontWeight: isActive ? '700' : '500',
                      opacity: isActive ? 1 : 0.7,
                      // Z-index to ensure text is above the sliding pill
                      zIndex: 2,
                    },
                  ]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  shadowContainer: {
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  glassPill: {
    flexDirection: 'row',
    borderRadius: 30,
    borderWidth: 1,
    padding: 4, // Reduce padding to allow pill to fit nicely
    overflow: 'hidden',
    position: 'relative', // For absolute positioning of sliding pill
    width: '90%', // Ensure consistent width
    maxWidth: 320,
    alignSelf: 'center',
  },
  slidingPill: {
    position: 'absolute',
    height: '100%',
    top: 4, // Match padding of container
    left: 4, // Match padding of container
    borderRadius: 24,
  },
  option: {
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
});
