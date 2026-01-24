import { OfflinePromptHost } from '@/components/offline/OfflinePromptHost';
import { SyncOverlay } from '@/components/sync/SyncOverlay';
import { AppToastHost } from '@/components/toast/AppToastHost';
import { AuthProvider } from '@/context/AuthContext'; // Ensure this path is correct
import { OfflineProvider } from '@/context/OfflineContext';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

// Prevent native splash from hiding immediately
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    // Load stored tokens
    import('@/context/auth-store').then(({ useAuthStore }) => {
      void useAuthStore.getState().loadCookies();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineProvider>
          <AppThemeProvider>
            <OfflineLifecycle />
            <OfflinePromptHost />
            <SyncOverlay />
            <AppToastHost />
            <ThemedNavigation />
          </AppThemeProvider>
        </OfflineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function OfflineLifecycle() {
  // Startup check + background health monitoring.
  useHeartbeat();
  return null;
}

function ThemedNavigation() {
  const { resolvedTheme, colors } = useAppTheme();
  const navigationTheme = useMemo(() => {
    const baseTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: colors.pageBg,
        text: colors.textMain,
        primary: colors.primaryAccent,
        card: colors.surface1,
        border: colors.borderSoft,
        notification: colors.primaryAccent,
      },
    };
  }, [resolvedTheme, colors]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="home" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
