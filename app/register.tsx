import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
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
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  
  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [showEmailValidation, setShowEmailValidation] = useState(false);

  // OTP Input Refs
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // Resend Timer
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Start timer when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setResendTimer(60);
      setCanResend(false);
      // Auto-focus first OTP input
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);
    }
  }, [step]);

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    if (step === 'otp' && otpDigits.every(digit => digit !== '')) {
      const otp = otpDigits.join('');
      if (otp.length === 6 && !verifyMutation.isPending) {
        verifyMutation.mutate({ email: email.trim(), otp });
      }
    }
  }, [otpDigits, step]);

  // Email validation with debounce
  useEffect(() => {
    if (!emailTouched || email.trim() === '') {
      setShowEmailValidation(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowEmailValidation(true);
    }, 500); // Show validation 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [email, emailTouched]);

  // Validation helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isEmailStepValid = isValidEmail(email);
  
  const isDetailsStepValid = 
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    password.trim().length >= 6;

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
      
      // Clear OTP inputs on error for easy re-entry
      setTimeout(() => {
        setOtpDigits(['', '', '', '', '', '']);
        setBlockingState('idle');
        setBlockingMessage(undefined);
        // Refocus first input after state updates
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      }, 2000);
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

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length === 0) {
      // Clear current box
      const newOtpDigits = [...otpDigits];
      newOtpDigits[index] = '';
      setOtpDigits(newOtpDigits);
      return;
    }
    
    if (numericValue.length > 1) {
      // Handle paste or multiple characters
      const digits = numericValue.slice(0, 6).split('');
      const newOtpDigits = [...otpDigits];
      
      // Fill from current index
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtpDigits[index + i] = digit;
        }
      });
      setOtpDigits(newOtpDigits);
      
      // Focus last filled box or last box
      const nextIndex = Math.min(index + digits.length - 1, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      // Single digit input
      const newOtpDigits = [...otpDigits];
      newOtpDigits[index] = numericValue;
      setOtpDigits(newOtpDigits);
      
      // Auto-advance to next box
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move to previous box on backspace if current is empty
      otpRefs.current[index - 1]?.focus();
    }
  };



  const handleResendOtp = () => {
    if (!canResend) return;
    
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
    initMutation.mutate({ email: email.trim() });
  };

  const handleChangeEmail = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
    setStep('email');
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
              {step === 'otp' ? (
                <View style={styles.subtitleContainer}>
                  <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                    We sent a code to{' '}
                    <ThemedText style={[styles.subtitle, { color: colors.textMain, fontWeight: '600' }]}>
                      {email}
                    </ThemedText>
                  </ThemedText>
                  <Pressable onPress={handleChangeEmail} disabled={isLoading} style={styles.changeEmailLink}>
                    <ThemedText style={[styles.linkText, { color: accentColor }]}>
                      Change email
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                  {step === 'email' && 'Enter your email to get started.'}
                  {step === 'details' && 'One last step to set up your profile.'}
                </ThemedText>
              )}
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
                      onChangeText={(text) => {
                        setEmail(text);
                        if (!emailTouched) setEmailTouched(true);
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.input, { color: colors.textMain }]}
                    />
                  </View>
                  
                  {/* Email Validation Feedback - Error Only */}
                  {showEmailValidation && email.trim() !== '' && !isEmailStepValid && (
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
              )}

              {step === 'otp' && (
                <>
                  <View style={styles.fieldGroup}>
                    <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                      Enter 6-Digit Code
                    </ThemedText>
                    
                    {/* OTP Input Boxes */}
                    <View style={styles.otpContainer}>
                      {otpDigits.map((digit, index) => (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            {
                              backgroundColor: colors.inputBg,
                              borderColor: digit ? accentColor : colors.inputBorder,
                              borderWidth: digit ? 2 : 1,
                            },
                          ]}
                        >
                          <TextInput
                            ref={(ref) => { otpRefs.current[index] = ref; }}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleOtpKeyPress(e, index)}
                            keyboardType="number-pad"
                            selectTextOnFocus
                            style={[styles.otpInput, { color: colors.textMain }]}
                          />
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Resend Link */}
                  <View style={styles.resendContainer}>
                    <ThemedText style={[styles.resendText, { color: colors.textMuted }]}>
                      Didn't receive the code?{' '}
                    </ThemedText>
                    <Pressable 
                      onPress={handleResendOtp} 
                      disabled={!canResend || isLoading}
                      style={{ padding: 4 }}
                    >
                      <ThemedText 
                        style={[
                          styles.linkText, 
                          { 
                            color: canResend ? accentColor : colors.textMuted,
                            opacity: canResend ? 1 : 0.6
                          }
                        ]}
                      >
                        {canResend ? 'Resend' : `Resend (${resendTimer}s)`}
                      </ThemedText>
                    </Pressable>
                  </View>
                </>
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
                    <View style={styles.labelRow}>
                      <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Password</ThemedText>
                      <ThemedText 
                        style={[
                          styles.charCounter, 
                          { color: password.length >= 6 ? '#27ae60' : colors.textMuted }
                        ]}
                      >
                        {password.length}/6 characters
                      </ThemedText>
                    </View>
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

              {/* Submit Button - Hidden for OTP step (auto-verifies) */}
              {step !== 'otp' && (
                <Pressable
                  onPress={step === 'email' ? handleEmailSubmit : handleDetailsSubmit}
                  disabled={
                    isLoading || 
                    (step === 'email' && !isEmailStepValid) ||
                    (step === 'details' && !isDetailsStepValid)
                  }
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { 
                      backgroundColor: accentColor, 
                      shadowColor: accentColor,
                      opacity: (
                        isLoading || 
                        (step === 'email' && !isEmailStepValid) ||
                        (step === 'details' && !isDetailsStepValid)
                      ) ? 0.5 : 1
                    },
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
              )}

            </View>

            {/* --- Footer --- */}
            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: colors.textMuted }]}>
                Already have an account?
              </ThemedText>
              <Pressable onPress={() => router.push('/login')} style={{ padding: 4 }}>
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

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
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
  subtitleContainer: {
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    maxWidth: '80%',
    lineHeight: 20,
  },
  changeEmailLink: {
    padding: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Card
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

  // OTP Styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },

  // Resend Link
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  resendText: {
    fontSize: 13,
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

  // Label Row (for password with counter)
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
  },
  charCounter: {
    fontSize: 11,
    fontWeight: '600',
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

  // Primary Button
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
