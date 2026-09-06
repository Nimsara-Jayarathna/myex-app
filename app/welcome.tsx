import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeBackground } from '@/components/home/HomeBackground';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';


export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { colors } = useAppTheme();
  const accentColor = colors.primaryAccent;
  const appIcon = require('../assets/images/icon.png');

  // Shared Values for Animations
  const fadeDetails = useSharedValue(0); // For content fade-in
  const textTranslateY = useSharedValue(50); // For logo/text slide up
  const sheetTranslateY = useSharedValue(100); // For bottom sheet slide up

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home' as any);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // 1. Fade in content
    fadeDetails.value = withTiming(1, { duration: 800 });

    // 2. Slide up logo/text
    textTranslateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // 3. Slide up bottom sheet (delayed)
    sheetTranslateY.value = withDelay(
      300,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.back(1)),
      })
    );
  }, [fadeDetails, sheetTranslateY, textTranslateY]);

  const handleLoginPress = () => router.navigate('/login');
  const handleRegisterPress = () => router.navigate('/register');

  // Animated Styles
  const topSectionStyle = useAnimatedStyle(() => ({
    opacity: fadeDetails.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <HomeBackground showSecondaryGlow={false}>
        <SafeAreaView style={styles.safeArea}>

          {/* --- TOP SECTION: BRANDING --- */}
          <View style={styles.topSection}>
            <Animated.View style={[styles.centerContent, topSectionStyle]}>

              {/* Modern Glow Logo */}
              <View style={styles.logoWrapper}>
                <View style={[styles.logoGlow, { backgroundColor: accentColor, shadowColor: accentColor }]} />
                <View style={[styles.logoCircle, { backgroundColor: accentColor }]}>
                  <Image source={appIcon} style={styles.logoImage} resizeMode="contain" />
                </View>
                {/* Decorative floating dot */}
                <View style={[styles.floatingDot, { borderColor: colors.surface1 }]} />
              </View>

              <ThemedText type="title" style={[styles.appTitle, { color: colors.textMain }]}>
                Blipzo
              </ThemedText>
              <ThemedText style={[styles.tagline, { color: colors.textMuted }]}>
                Master your finances.{'\n'}Effortlessly.
              </ThemedText>
            </Animated.View>
          </View>

          {/* --- BOTTOM SECTION: ACTIONS --- */}
          <Animated.View
            style={[
              styles.bottomSheet,
              { backgroundColor: colors.surfaceGlassThick, shadowColor: colors.pageFg },
              sheetStyle,
            ]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.surface3 }]} />

            <ThemedText style={[styles.welcomeHeader, { color: colors.textMain }]}>
              Let&apos;s get started
            </ThemedText>
            <ThemedText style={[styles.welcomeSub, { color: colors.textMuted }]}>
              Track expenses, set budgets, and achieve your financial goals today.
            </ThemedText>

            <View style={styles.buttonGroup}>
              {/* Login Button */}
              <Pressable
                onPress={handleLoginPress}
                accessibilityRole="button"
                accessibilityLabel="Log in"
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: accentColor, shadowColor: accentColor },
                  pressed && styles.buttonPressed,
                ]}>
                <ThemedText style={styles.primaryButtonText}>Log In</ThemedText>
                <View style={[styles.iconCircle, { backgroundColor: colors.surface1 }]}>
                  <MaterialIcons name="arrow-forward" size={18} color={accentColor} />
                </View>
              </Pressable>

              {/* Register Button */}
              <Pressable
                onPress={handleRegisterPress}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: colors.surface2, borderColor: colors.borderGlass },
                  pressed && styles.buttonPressed,
                ]}>
                <ThemedText style={[styles.secondaryButtonText, { color: colors.textMain }]}>
                  Create Account
                </ThemedText>
                <View style={[styles.iconCircle, { backgroundColor: colors.surface1 }]}>
                  <MaterialIcons name="person-add-alt-1" size={18} color={accentColor} />
                </View>
              </Pressable>
            </View>
          </Animated.View>

        </SafeAreaView>
      </HomeBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // --- BRANDING STYLES ---
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60, // Push content slightly up visual center
  },
  logoWrapper: {
    width: 100,
    height: 100,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 50,
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 26, // Squircle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    transform: [{ rotate: '-10deg' }], // Stylish tilt
  },
  logoImage: {
    width: 46,
    height: 46,
  },
  floatingDot: {
    position: 'absolute',
    top: 0,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2ecc71',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    lineHeight: 24,
  },

  // --- BOTTOM SHEET STYLES ---
  bottomSheet: {
    backgroundColor: '#fff',
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  welcomeHeader: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 32,
    lineHeight: 20,
  },
  buttonGroup: {
    gap: 16,
  },

  // --- BUTTONS ---
  primaryButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Text left, icon right
    paddingHorizontal: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  centerContent: {
    alignItems: 'center',
  },
});
