import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HOME_TAB_BAR_HEIGHT,
  HOME_TAB_BAR_MARGIN,
} from '@/components/home/layout/spacing';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';

type HomeTabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
  onAddPress: () => void;
};

export function HomeTabBar({ state, descriptors, navigation, onAddPress }: HomeTabBarProps) {
  const [width, setWidth] = useState(0);
  const { colors, resolvedTheme } = useAppTheme();
  const { offlineMode } = useOffline();
  const insets = useSafeAreaInsets();
  const extraBottom = Math.max(insets.bottom, 0);
  const translateX = useSharedValue(0);
  const isDark = resolvedTheme === 'dark';
  const wrapperBlurIntensity = isDark ? 32 : 26;
  const innerBlurIntensity = isDark ? 60 : 90;
  const glassContainerColor = isDark ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.22)';
  const glassOverlayColor = isDark ? 'rgba(15, 23, 42, 0.1)' : 'rgba(241, 245, 249, 0.18)';
  const barGradient = isDark ? 'rgba(2, 6, 23, 0.28)' : 'rgba(203, 213, 225, 0.08)';
  const androidFallbackOverlay = isDark ? 'rgba(2, 6, 23, 0.45)' : 'rgba(226, 232, 240, 0.3)';
  const highlightGradient: readonly [string, string] = isDark
    ? ['rgba(255, 255, 255, 0.12)', 'transparent']
    : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.08)'];

  const visibleRoutes = state.routes.filter((route: any) =>
    ['today', 'all'].includes(route.name)
  );
  const todayRoute = visibleRoutes.find((route: any) => route.name === 'today');
  const allRoute = visibleRoutes.find((route: any) => route.name === 'all');
  const activeRouteName = state.routes[state.index].name;
  const showPill = activeRouteName === 'today' || activeRouteName === 'all';
  const isAllDisabled = offlineMode;

  const slotWidth = width / 3;

  useEffect(() => {
    const activeSlot = activeRouteName === 'today' ? 0 : activeRouteName === 'all' ? 2 : -1;

    if (activeSlot >= 0 && slotWidth > 0) {
      translateX.value = withTiming(activeSlot * slotWidth, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [slotWidth, state.index, state.routes, translateX, activeRouteName]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + 6 }],
    width: Math.max(slotWidth - 12, 0),
  }));

  const addButtonShadow = Platform.OS === 'android'
    ? { shadowOpacity: 0, elevation: 0 }
    : { shadowOpacity: 0.25, elevation: 8 };

  return (
    <View
      style={[
        styles.barWrapper,
        {
          paddingBottom: extraBottom + HOME_TAB_BAR_MARGIN,
        },
      ]}
    >
      <BlurView
        intensity={wrapperBlurIntensity}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[
          'transparent',
          barGradient,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[
          styles.tabBarContainer,
          {
            borderColor: colors.borderGlass,
            height: HOME_TAB_BAR_HEIGHT,
            backgroundColor: glassContainerColor,
          },
        ]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.glassLayer}>
          <BlurView
            intensity={innerBlurIntensity}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.glassOverlay,
                { backgroundColor: androidFallbackOverlay },
              ]}
            />
          )}
          <View style={[styles.glassOverlay, { backgroundColor: glassOverlayColor }]} />
          <LinearGradient
            colors={highlightGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
        {width > 0 && showPill && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePill,
              {
                backgroundColor:
                  isDark
                    ? 'rgba(96, 165, 250, 0.18)'
                    : 'rgba(59, 130, 246, 0.08)',
              },
              pillStyle,
            ]}
          />
        )}

        {todayRoute && (() => {
          const route = todayRoute;
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index].key === route.key;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: React.ComponentProps<typeof MaterialIcons>['name'] = 'circle';
          if (route.name === 'today') iconName = 'today';
          if (route.name === 'all') iconName = 'list-alt';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityState={{ selected: isFocused }}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name={iconName}
                  size={22}
                  color={isFocused ? colors.primaryAccent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? colors.primaryAccent : colors.textMuted },
                  ]}
                >
                  {options.title}
                </Text>
              </View>
            </Pressable>
          );
        })()}

        <Pressable
          onPress={onAddPress}
          style={styles.addItem}
          accessibilityRole="button"
          accessibilityLabel="Add transaction"
          accessibilityHint="Opens the add transaction form"
        >
          <View style={[styles.addButton, { backgroundColor: colors.primaryAccent }, addButtonShadow]}>
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </View>
          <Text style={[styles.tabLabel, { color: colors.textMuted }]}>Add</Text>
        </Pressable>

        {allRoute && (() => {
          const route = allRoute;
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index].key === route.key;

          const onPress = () => {
            // Let the listener handle validation (offline check)
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: React.ComponentProps<typeof MaterialIcons>['name'] = 'circle';
          if (route.name === 'today') iconName = 'today';
          if (route.name === 'all') iconName = 'list-alt';

          const iconColor = isFocused ? colors.primaryAccent : colors.textMuted;
          const labelColor = isFocused ? colors.primaryAccent : colors.textMuted;
          // Apply visual disabled style if needed, but keep interaction enabled for the alert
          const disabledTint = colors.textSubtle ?? colors.textMuted;
          const visualDisabled = isAllDisabled;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              // disabled={isAllDisabled} // REMOVED: Need to fire press event so listener can show alert
              accessibilityState={{ selected: isFocused, disabled: isAllDisabled }}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name={iconName}
                  size={22}
                  color={visualDisabled ? disabledTint : iconColor}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: visualDisabled ? disabledTint : labelColor },
                  ]}
                >
                  {options.title}
                </Text>
              </View>
            </Pressable>
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: HOME_TAB_BAR_MARGIN,
    paddingTop: HOME_TAB_BAR_MARGIN,
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'visible',
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  activePill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 18,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  addItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    gap: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
