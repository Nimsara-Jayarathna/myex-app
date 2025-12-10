import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Filter to only show specific tabs
  const visibleRoutes = state.routes.filter((route: any) => 
    ['today', 'all', 'settings'].includes(route.name)
  );

  const tabWidth = dimensions.width / visibleRoutes.length;
  const translateX = useSharedValue(0);

  useEffect(() => {
    const activeRouteName = state.routes[state.index].name;
    const activeIndex = visibleRoutes.findIndex((r: any) => r.name === activeRouteName);

    if (activeIndex >= 0 && tabWidth > 0) {
      // CHANGED: used withTiming instead of withSpring to remove the wobble
      translateX.value = withTiming(activeIndex * tabWidth, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [state.index, tabWidth, visibleRoutes]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth,
    };
  });

  return (
    <View 
      style={styles.tabBarContainer} 
      onLayout={(e) => setDimensions(e.nativeEvent.layout)}
    >
      {/* Sliding Background */}
      {dimensions.width > 0 && (
        <Animated.View style={[styles.slidingBubble, animatedStyle]} />
      )}

      {/* Tabs */}
      {visibleRoutes.map((route: any, index: number) => {
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
        if (route.name === 'settings') iconName = 'settings';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={iconName}
                size={22}
                color={isFocused ? Colors.light.tabIconSelected : Colors.light.tabIconDefault}
              />
              <Text style={[
                styles.tabLabel, 
                { color: isFocused ? Colors.light.tabIconSelected : Colors.light.tabIconDefault }
              ]}>
                {options.title}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomeTabLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/welcome');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="all" options={{ title: 'All' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    height: 60,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  slidingBubble: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(52,152,219,0.12)',
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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