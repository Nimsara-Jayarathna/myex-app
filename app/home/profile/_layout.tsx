import { Stack } from 'expo-router';
import React from 'react';

import { HomeHeader } from '@/components/home/layout/HomeHeader';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileLayout() {
  const { colors } = useAppTheme();
  const { user } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.pageBg,
        },
        headerTintColor: colors.textMain,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.pageBg,
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Profile',
          header: () => (
            <HomeHeader 
              user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null} 
            />
          ),
        }} 
      />
      <Stack.Screen 
        name="details" 
        options={{ 
          title: 'Profile Details',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="security" 
        options={{ 
          title: 'Security',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="categories" 
        options={{ 
          title: 'Categories',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="currency" 
        options={{ 
          title: 'Currency',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}
