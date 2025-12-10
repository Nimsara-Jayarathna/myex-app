import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { HomeBackground } from './home/_components/HomeBackground';

const { width } = Dimensions.get('window');
const accentColor = '#3498db';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity for everything
  const slideUpAnim = useRef(new Animated.Value(50)).current; // For text/logo
  const sheetSlideAnim = useRef(new Animated.Value(100)).current; // For bottom sheet

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home' as any);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Staggered Entrance Animation
    Animated.parallel([
      // 1. Fade in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // 2. Slide up logo/text
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 3. Slide up bottom sheet (slightly delayed)
      Animated.timing(sheetSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.back(1)), // Slight bounce effect
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideUpAnim, sheetSlideAnim]);

  const handleLoginPress = () => router.navigate('/login');
  const handleRegisterPress = () => router.navigate('/register');

  return (
    <View style={styles.container}>
      <HomeBackground>
        <SafeAreaView style={styles.safeArea}>
          
          {/* --- TOP SECTION: BRANDING --- */}
          <View style={styles.topSection}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
                alignItems: 'center',
              }}>
              
              {/* Modern Glow Logo */}
              <View style={styles.logoWrapper}>
                <View style={styles.logoGlow} />
                <View style={styles.logoCircle}>
                  <MaterialIcons name="donut-large" size={48} color="#fff" />
                </View>
                {/* Decorative floating dot */}
                <View style={styles.floatingDot} />
              </View>

              <ThemedText type="title" style={styles.appTitle}>
                MyEx
              </ThemedText>
              <ThemedText style={styles.tagline}>
                Master your finances.{'\n'}Effortlessly.
              </ThemedText>
            </Animated.View>
          </View>

          {/* --- BOTTOM SECTION: ACTIONS --- */}
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: sheetSlideAnim }] },
            ]}>
            <View style={styles.sheetHandle} />
            
            <ThemedText style={styles.welcomeHeader}>Let's get started</ThemedText>
            <ThemedText style={styles.welcomeSub}>
              Track expenses, set budgets, and achieve your financial goals today.
            </ThemedText>

            <View style={styles.buttonGroup}>
              {/* Login Button */}
              <Pressable
                onPress={handleLoginPress}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}>
                <ThemedText style={styles.primaryButtonText}>Log In</ThemedText>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="arrow-forward" size={18} color={accentColor} />
                </View>
              </Pressable>

              {/* Register Button */}
              <Pressable
                onPress={handleRegisterPress}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}>
                <MaterialIcons name="person-add-alt-1" size={20} color={accentColor} />
                <ThemedText style={styles.secondaryButtonText}>Create Account</ThemedText>
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
    backgroundColor: accentColor,
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
    shadowColor: accentColor,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 26, // Squircle
    backgroundColor: accentColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    transform: [{ rotate: '-10deg' }], // Stylish tilt
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
    letterSpacing: -1,
    color: '#2c3e50',
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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
    backgroundColor: accentColor,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Text left, icon right
    paddingHorizontal: 24,
    shadowColor: accentColor,
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
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
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
});
