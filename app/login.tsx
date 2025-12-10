import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { login } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { HomeBackground } from './home/_components/HomeBackground';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const accentColor = '#3498db';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: data => {
      setAuth(data);
      setErrorMessage(null);
      router.replace('/home');
    },
    onError: () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorMessage('Invalid email or password');
    },
  });

  const isLoading = loginMutation.isPending;

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorMessage('Please fill in all fields');
      return;
    }
    setErrorMessage(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <HomeBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Fix: KeyboardAvoidingView + ScrollView ensures inputs move up */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            
            {/* --- Header Section --- */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="donut-large" size={32} color="#fff" />
              </View>
              <ThemedText type="title" style={styles.title}>Welcome Back!</ThemedText>
              <ThemedText style={styles.subtitle}>
                Sign in to continue managing your finances.
              </ThemedText>
            </View>

            {/* --- Form Section --- */}
            <View style={styles.card}>
              
              {/* Error Banner */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <MaterialIcons name="error-outline" size={20} color="#c0392b" />
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Email Address</ThemedText>
                <View style={styles.inputWrapper}>
                  <MaterialIcons 
                    name="mail-outline" 
                    size={20} 
                    color="#95a5a6"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor="#bdc3c7"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <View style={styles.inputWrapper}>
                  <MaterialIcons 
                    name="lock-outline" 
                    size={20} 
                    color="#95a5a6"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#bdc3c7"
                    secureTextEntry
                    style={styles.input}
                  />
                </View>
                <Pressable onPress={() => { /* TODO */ }} style={styles.forgotPassRow}>
                  <ThemedText style={styles.forgotPassText}>Forgot Password?</ThemedText>
                </Pressable>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  isLoading && styles.buttonLoading
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.btnContent}>
                    <ThemedText style={styles.primaryButtonText}>Log In</ThemedText>
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>

            </View>

            {/* --- Footer Section --- */}
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>New to MyEx?</ThemedText>
              <Pressable onPress={() => router.navigate('/register')} style={{ padding: 4 }}>
                <ThemedText style={styles.footerLink}>Create Account</ThemedText>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  
  // --- Header ---
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: accentColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ rotate: '-10deg' }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    maxWidth: '80%',
  },

  // --- Card Form ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 24,
  },
  
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: accentColor,
    backgroundColor: '#fff',
    shadowColor: accentColor,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    height: '100%',
  },
  
  forgotPassRow: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotPassText: {
    fontSize: 12,
    color: accentColor,
    fontWeight: '600',
  },

  // --- Buttons ---
  primaryButton: {
    height: 56,
    backgroundColor: accentColor,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonLoading: {
    opacity: 0.7,
  },

  // --- Error ---
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcebe6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    fontWeight: '500',
  },

  // --- Footer ---
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  footerLink: {
    color: accentColor,
    fontWeight: '700',
    fontSize: 14,
  },
});
