import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/api/auth';
import { HomeBackground } from '@/components/home/HomeBackground';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { logDebug, logError } from '@/utils/logger';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { colors } = useAppTheme();
  const accentColor = colors.primaryAccent;
  const appIcon = require('../assets/images/icon.png');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

  // Validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [showEmailValidation, setShowEmailValidation] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onMutate: variables => {
      logDebug('Login mutation started', { email: variables.email });
      setErrorMessage(null);
      setBlockingState('loading');
      setBlockingMessage('Logging in...');
      return { email: variables.email };
    },
    onSuccess: (data, variables, context) => {
      logDebug('Login mutation success', { data, context });
      setBlockingState('success');
      setBlockingMessage('Welcome back!');
      setTimeout(() => {
        // Do NOT reset blocking state here. Let navigation flow naturally.
        setAuth(data);
        router.replace('/home');
      }, 1500);
    },
    onError: (error: any, variables, context) => {
      logError('Login mutation failed', { error, variables, context });
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || 'Invalid email or password';
      setBlockingMessage(msg);
    },
  });

  // Email validation with debounce
  useEffect(() => {
    if (!emailTouched || email.trim() === '') {
      setShowEmailValidation(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowEmailValidation(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [email, emailTouched]);

  // Validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isEmailValid = isValidEmail(email);
  const isFormValid = isEmailValid && password.trim().length > 0;

  const isLoading = loginMutation.isPending;

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorMessage('Please fill in all fields');
      return;
    }
    setErrorMessage(null);
    logDebug('Login request started', { email });
    loginMutation.mutate({ email, password });
  };

  return (
    <>
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
                <View style={[styles.logoCircle, { backgroundColor: accentColor, shadowColor: accentColor }]}>
                  <Image source={appIcon} style={styles.logoImage} resizeMode="contain" />
                </View>
                <ThemedText type="title" style={[styles.title, { color: colors.textMain }]}>
                  Welcome Back!
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                  Sign in to continue managing your finances.
                </ThemedText>
              </View>
  
              {/* --- Form Section --- */}
              <View style={[styles.card, { backgroundColor: colors.surface1 }]}>
  
                {/* Error Banner */}
                {errorMessage && (
                  <View style={[styles.errorBanner, { backgroundColor: colors.surface2 }]}>
                    <MaterialIcons name="error-outline" size={20} color="#c0392b" />
                    <ThemedText style={[styles.errorText, { color: colors.textMain }]}>
                      {errorMessage}
                    </ThemedText>
                  </View>
                )}
  
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                    Email Address
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                    ]}
                  >
                    <MaterialIcons
                      name="mail-outline"
                      size={20}
                      color={colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (!emailTouched) setEmailTouched(true);
                      }}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.input, { color: colors.textMain }]}
                    />
                  </View>
                  
                  {/* Email Validation Feedback - Error Only */}
                  {showEmailValidation && email.trim() !== '' && !isEmailValid && (
                    <View style={styles.validationFeedback}>
                      <View style={styles.validationRow}>
                        <MaterialIcons name="error-outline" size={16} color="#e74c3c" />
                        <ThemedText style={[styles.validationText, { color: '#e74c3c' }]}>
                          Please enter a valid email address
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
  
                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                    Password
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                    ]}
                  >
                    <MaterialIcons
                      name="lock-outline"
                      size={20}
                      color={colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      style={[styles.input, { color: colors.textMain }]}
                    />
                  </View>
                  <Pressable onPress={() => router.push('/auth/forgot-password')} style={styles.forgotPassRow}>
                    <ThemedText style={[styles.forgotPassText, { color: accentColor }]}>
                      Forgot Password?
                    </ThemedText>
                  </Pressable>
                </View>
  
                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={blockingState !== 'idle' || !isFormValid}
                style={({ pressed }) => [
                    styles.primaryButton,
                    { 
                      backgroundColor: accentColor, 
                      shadowColor: accentColor,
                      opacity: (blockingState !== 'idle' || !isFormValid) ? 0.5 : 1
                    },
                    pressed && styles.buttonPressed,
                  ]}>
                    <View style={styles.btnContent}>
                      <ThemedText style={styles.primaryButtonText}>Log In</ThemedText>
                      <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                    </View>
                </Pressable>
  
              </View>
  
              {/* --- Footer Section --- */}
              <View style={styles.footer}>
                <ThemedText style={styles.footerText}>New to Blipzo?</ThemedText>
                <Pressable onPress={() => router.navigate('/register')} style={{ padding: 4 }}>
                  <ThemedText style={[styles.footerLink, { color: accentColor }]}>
                    Create Account
                  </ThemedText>
                </Pressable>
              </View>
  
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </HomeBackground>
      <BlockingModal 
        state={blockingState} 
        message={blockingMessage} 
        onClose={() => setBlockingState('idle')}
      />
    </>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ rotate: '-10deg' }],
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '80%',
  },

  // --- Card Form ---
  card: {
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
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },

  // Validation Feedback
  validationFeedback: {
    marginTop: 6,
    marginLeft: 4,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '500',
  },

  forgotPassRow: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // --- Buttons ---
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
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
    fontSize: 14,
  },
  footerLink: {
    fontWeight: '700',
    fontSize: 14,
  },
});
