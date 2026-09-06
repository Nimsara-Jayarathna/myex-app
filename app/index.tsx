import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

import { getSession } from '@/api/auth';
import { apiClient } from '@/api/client';
import { HomeBackground } from '@/components/home/HomeBackground';
import { ThemedText } from '@/components/themed-text';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types';
import { isAuthError, isNetworkOrTimeoutError, withRetry } from '@/utils/api-retry';
// eslint-disable-next-line import/no-unresolved
import { getLocalProfile, initDb } from '@/utils/local-db';

const ACCENT_COLOR = '#3498db';
export default function IndexScreen() {
  const router = useRouter();
  const { setAuth, logout, hydrateOfflineAuth, restoreSessionMetadata } = useAuth();
  const { offlineMode, promptToGoOffline, setIsBooting } = useOffline();
  const { colors } = useAppTheme();
  const hasNavigatedRef = useRef(false);
  const localProfileRef = useRef<UserProfile | null>(null);

  // Animation Values
  const logoScale = useSharedValue(0);
  const loadingOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Start Logo Animation
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });

    // 2. Pulse Loading Text
    loadingOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    const loadLocalProfile = async () => {
      if (localProfileRef.current) return localProfileRef.current;
      try {
        await initDb();
        const profile = await getLocalProfile();
        if (!profile) return null;
        const normalizedProfile: UserProfile = {
          id: profile.id,
          name: profile.name,
          fname: profile.fname ?? undefined,
          lname: profile.lname ?? undefined,
          email: profile.email,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          categoryLimit: profile.categoryLimit ?? undefined,
          defaultIncomeCategories: profile.defaultIncomeCategories,
          defaultExpenseCategories: profile.defaultExpenseCategories,
          currency: profile.currency_id && profile.currency_name && profile.currency_code && profile.currency_symbol
            ? {
                id: profile.currency_id,
                name: profile.currency_name,
                code: profile.currency_code,
                symbol: profile.currency_symbol,
              }
            : undefined,
        };
        localProfileRef.current = normalizedProfile;
        return normalizedProfile;
      } catch {
        return null;
      }
    };

    // 3. Run Auth Logic
    const runSessionCheck = async () => {
      try {
        const session = await getSession();
        if (!session?.user) {
          return { status: 'unauth' as const };
        }

        // Don't manually refresh here - let the API client handle it automatically
        // when tokens expire via the response interceptor
        return { status: 'ok' as const, authData: session };
      } catch (e) {
        if (isNetworkOrTimeoutError(e)) {
          return { status: 'network' as const };
        }
        if (isAuthError(e)) {
          return { status: 'unauth' as const };
        }
        return { status: 'error' as const };
      }
    };

    const checkAuth = async (skipMinWait = false) => {
      try {
        // Minimum wait time for aesthetic purposes (1.5s)
        const minWait = skipMinWait ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, 1500));
        await minWait;

        const hasValidOfflineSession = await restoreSessionMetadata();
        const localProfile = await loadLocalProfile();
        if (!hasValidOfflineSession) {
          // If we are not focused (e.g., covered by Login screen), don't redirect/prompt
          // This prevents background 'index' logic from interfering with top-level auth flow.
          // We can check if we are still the root path? 
          // For now, rely on safe retry or silent failure.

          try {
            await withRetry(() => apiClient.get('/health', { timeout: 5000 }), 2);
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              router.replace('/welcome');
            }
          } catch {
            promptToGoOffline(
              'You need to be online to sign in.',
              async () => {
                await apiClient.get('/health', { timeout: 5000 });
                hasNavigatedRef.current = true;
                router.replace('/welcome');
              },
              { allowOffline: false, primaryLabel: 'Retry', force: true }
            );
          }
          return;
        }


        const result = await runSessionCheck();

        if (result.status === 'ok') {
          setAuth(result.authData);
          hasNavigatedRef.current = true;
          router.replace('/home' as any);
          return;
        }

        if (result.status === 'unauth') {
          logout();
          promptToGoOffline(
            'You need to be online to sign in.',
            async () => {
              await apiClient.get('/health', { timeout: 5000 });
              hasNavigatedRef.current = true;
              router.replace('/welcome');
            },
            { allowOffline: false, primaryLabel: 'Go to sign in' }
          );
          return;
        }

        if (result.status === 'network') {
          const allowOffline = hasValidOfflineSession && Boolean(localProfile);
          promptToGoOffline(
            allowOffline
              ? 'Unable to reach the server.'
              : 'You need to be online to continue.',
            async () => {
              const retryResult = await runSessionCheck();
              if (retryResult.status === 'ok') {
                setAuth(retryResult.authData);
                hasNavigatedRef.current = true;
                router.replace('/home' as any);
                return;
              }
              if (retryResult.status === 'unauth') {
                // Don't throw - explicitly navigate to welcome so we don't get stuck in the loop
                // "Connected" success message will show briefly, then we route.
                hasNavigatedRef.current = true;
                router.replace('/welcome');
                return;
              }
              throw new Error('NETWORK');
            },
            {
              allowOffline,
              primaryLabel: 'Retry',
              onConfirm: allowOffline
                ? () => {
                  if (localProfile) {
                    hydrateOfflineAuth(localProfile);
                  }
                  hasNavigatedRef.current = true;
                  router.replace('/home/today' as any);
                }
                : undefined,
              force: true,
            }
          );
          return;
        }

        logout();
        hasNavigatedRef.current = true;
        router.replace('/welcome');
      } catch {
        logout();
        hasNavigatedRef.current = true;
        router.replace('/welcome');
      }
    };

    setIsBooting(true);
    void checkAuth().finally(() => setIsBooting(false));
  }, [setAuth, logout, hydrateOfflineAuth, restoreSessionMetadata, offlineMode, promptToGoOffline, setIsBooting, router, loadingOpacity, logoScale]);

  useEffect(() => {
    if (offlineMode && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      router.replace('/home' as any);
    }
  }, [offlineMode, router]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  return (
    <HomeBackground>
      <View style={styles.container}>

        {/* Animated Logo */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <View style={styles.logoGlow} />
          <View style={styles.logoCircle}>
            <MaterialIcons name="donut-large" size={48} color="#fff" />
          </View>
        </Animated.View>

        {/* Text */}
        <View style={styles.textWrapper}>
          <ThemedText type="title" style={[styles.title, { color: colors.textMain }]}>Blipzo</ThemedText>
          <ThemedText style={[styles.tagline, { color: colors.textMuted }]}>Everything you earn and spend.</ThemedText>
        </View>

        {/* Loader Footer */}
        <Animated.View style={[styles.loaderContainer, textStyle]}>
          <ThemedText style={[styles.loaderText, { color: colors.textSubtle }]}>Setting up your workspace...</ThemedText>
        </Animated.View>

      </View>
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ACCENT_COLOR,
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 28, // Squircle
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    transform: [{ rotate: '-10deg' }],
  },
  textWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#2c3e50',
    letterSpacing: -1,
    marginBottom: 4,
    lineHeight: 52,
  },
  tagline: {
    fontSize: 16,
    color: '#7f8c8d',
    letterSpacing: 0.5,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 60,
  },
  loaderText: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
