import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

import { registerComplete, registerInit, registerVerify } from '@/api/auth';
import { HomeBackground } from '@/components/home/HomeBackground';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';

// Enable animations for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RegistrationStep = 'email' | 'otp' | 'details';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { colors } = useAppTheme();
  const accentColor = colors.primaryAccent;
  const appIcon = require('../assets/images/icon.png');

  // State
  const [step, setStep] = useState<RegistrationStep>('email');

  // Form Data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  
  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutations
  // Mutations
  const initMutation = useMutation({
    mutationFn: registerInit,
    onMutate: () => {
      setErrorMessage(null);
      setBlockingState('loading');
      setBlockingMessage('Sending verification code...');
    },
    onSuccess: () => {
      setBlockingState('success');
      setBlockingMessage('Code sent!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStep('otp');
      }, 1500);
    },
    onError: (error: any) => {
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || 'Unable to send verification code.';
      setBlockingMessage(msg);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: registerVerify,
    onMutate: () => {
      setErrorMessage(null);
      setBlockingState('loading');
      setBlockingMessage('Verifying code...');
    },
    onSuccess: (data) => {
      setBlockingState('success');
      setBlockingMessage('Verified!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        setRegistrationToken(data.registrationToken);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStep('details');
      }, 1500);
    },
    onError: (error: any) => {
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || 'Invalid verification code.';
      setBlockingMessage(msg);
    },
  });

  const completeMutation = useMutation({
    mutationFn: registerComplete,
    onMutate: () => {
      setErrorMessage(null);
      setBlockingState('loading');
      setBlockingMessage('Creating account...');
    },
    onSuccess: (data) => {
      setBlockingState('success');
      setBlockingMessage('Welcome to Blipzo!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        setAuth(data);
        router.replace('/home');
      }, 2000);
    },
    onError: (error: any) => {
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || 'Failed to create account.';
      setBlockingMessage(msg);
    },
  });

  const isLoading = initMutation.isPending || verifyMutation.isPending || completeMutation.isPending;

  // Handlers
  const handleEmailSubmit = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email.');
      return;
    }
    setErrorMessage(null);
    initMutation.mutate({ email: trimmedEmail });
  };

  const handleOtpSubmit = () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit code.');
      return;
    }
    setErrorMessage(null);
    verifyMutation.mutate({ email: email.trim(), otp: trimmedOtp });
  };

  const handleDetailsSubmit = () => {
    const trimmed = {
      fname: firstName.trim(),
      lname: lastName.trim(),
      password: password.trim(),
    };

    if (!trimmed.fname || !trimmed.lname || !trimmed.password) {
      setErrorMessage('Please fill in all details.');
      return;
    }
    setErrorMessage(null);
    completeMutation.mutate({
      registrationToken,
      email: email.trim(),
      ...trimmed,
    });
  };



  return (
    <HomeBackground>
      <SafeAreaView style={styles.safeArea}>
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

            {/* --- Header --- */}
            <View style={styles.header}>

              <View style={[styles.logoCircle, { backgroundColor: accentColor, shadowColor: accentColor }]}>
                <Image source={appIcon} style={styles.logoImage} resizeMode="contain" />
              </View>
              <ThemedText type="title" style={[styles.title, { color: colors.textMain }]}>
                Create Account
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                {step === 'email' && 'Enter your email to get started.'}
                {step === 'otp' && `We sent a code to ${email}`}
                {step === 'details' && 'One last step to set up your profile.'}
              </ThemedText>
            </View>

            {/* --- Card Form --- */}
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

              {/* Steps Content */}
              {step === 'email' && (
                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                    Email Address
                  </ThemedText>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <MaterialIcons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.input, { color: colors.textMain }]}
                    />
                  </View>
                </View>
              )}

              {step === 'otp' && (
                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                    Verification Code
                  </ThemedText>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <MaterialIcons name="lock-clock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="123456"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[styles.input, { color: colors.textMain }]}
                    />
                  </View>
                </View>
              )}

              {step === 'details' && (
                <>
                  <View style={styles.row}>
                    <View style={styles.fieldGroupHalf}>
                      <ThemedText style={[styles.label, { color: colors.textSubtle }]}>First Name</ThemedText>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                        <TextInput
                          value={firstName}
                          onChangeText={setFirstName}
                          placeholder="Alex"
                          placeholderTextColor={colors.textMuted}
                          style={[styles.input, { color: colors.textMain }]}
                        />
                      </View>
                    </View>
                    <View style={styles.fieldGroupHalf}>
                      <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Last Name</ThemedText>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                        <TextInput
                          value={lastName}
                          onChangeText={setLastName}
                          placeholder="Doe"
                          placeholderTextColor={colors.textMuted}
                          style={[styles.input, { color: colors.textMain }]}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Password</ThemedText>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                      <MaterialIcons name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Min. 6 characters"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        style={[styles.input, { color: colors.textMain }]}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={
                  step === 'email' ? handleEmailSubmit :
                    step === 'otp' ? handleOtpSubmit :
                      handleDetailsSubmit
                }
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: accentColor, shadowColor: accentColor },
                  pressed && styles.buttonPressed,
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.btnContent}>
                    <ThemedText style={styles.primaryButtonText}>
                      {step === 'details' ? 'Complete Sign Up' : 'Continue'}
                    </ThemedText>
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>

            </View>

            {/* --- Footer --- */}
            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: colors.textMuted }]}>
                Already have an account?
              </ThemedText>
              <Pressable onPress={() => router.navigate('/login')} style={{ padding: 4 }}>
                <ThemedText style={[styles.footerLink, { color: accentColor }]}>
                  Log in
                </ThemedText>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
        <BlockingModal 
          state={blockingState} 
          message={blockingMessage} 
          onClose={() => setBlockingState('idle')}
        />
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

  // Header styles updated
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  // backButton style removed
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ rotate: '-5deg' }],
  },
  logoImage: {
    width: 34,
    height: 34,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    maxWidth: '80%',
    lineHeight: 20,
  },

  // --- Card ---
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

  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fieldGroupHalf: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },

  // Input Styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },

  // Error Banner
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
    flex: 1,
  },

  // Button
  primaryButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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

  // Footer
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
