import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { forgotPassword } from '@/api/auth';
import { HomeBackground } from '@/components/home/HomeBackground';
import { ThemedText } from '@/components/themed-text';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useAppTheme } from '@/context/ThemeContext';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const accentColor = colors.primaryAccent;

    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [blockingState, setBlockingState] = useState<BlockingState>('idle');
    const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

    // Validation states
    const [emailTouched, setEmailTouched] = useState(false);
    const [showEmailValidation, setShowEmailValidation] = useState(false);

    // Rate limiting timer
    const [resendTimer, setResendTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const mutation = useMutation({
        mutationFn: forgotPassword,
        onMutate: () => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setBlockingState('loading');
            setBlockingMessage('Sending reset link...');
        },
        onSuccess: () => {
            setBlockingState('success');
            setBlockingMessage('Link sent!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                setSuccessMessage('If that email exists, we sent a reset link.');

                // Start 60-second timer after successful send
                setResendTimer(60);
                setCanResend(false);
            }, 1500);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message
                || error?.response?.data?.message
                || 'Something went wrong.';
            setBlockingMessage(msg);
            // Fallback for non-blocking error display if needed, but modal handles it.
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

    // Timer effect for rate limiting
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
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

    // Validation helper
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const isEmailValid = isValidEmail(email);

    const isLoading = mutation.isPending;

    const handleSubmit = () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setErrorMessage('Please enter your email.');
            return;
        }
        setErrorMessage(null);
        setSuccessMessage(null);
        mutation.mutate({ email: trimmedEmail, platform: 'mobile' });
    };

    return (
        <HomeBackground>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            {/* Back Button */}
                            <Pressable
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
                            </Pressable>

                            <ThemedText type="title" style={[styles.title, { color: colors.textMain }]}>
                                Reset Password
                            </ThemedText>
                            <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                                Enter your email to receive a reset link.
                            </ThemedText>
                        </View>

                        {/* Form */}
                        <View style={[styles.card, { backgroundColor: colors.surface1 }]}>

                            {errorMessage && (
                                <View style={[styles.banner, { backgroundColor: colors.surface2 }]}>
                                    <MaterialIcons name="error-outline" size={20} color="#c0392b" />
                                    <ThemedText style={[styles.bannerText, { color: colors.textMain }]}>
                                        {errorMessage}
                                    </ThemedText>
                                </View>
                            )}

                            {successMessage && (
                                <View style={[styles.banner, { backgroundColor: '#dcfce7' }]}>
                                    <MaterialIcons name="check-circle-outline" size={20} color="#166534" />
                                    <ThemedText style={[styles.bannerText, { color: '#14532d' }]}>
                                        {successMessage}
                                    </ThemedText>
                                </View>
                            )}

                            <View style={styles.fieldGroup}>
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
                                        autoCorrect={false}
                                        textContentType={Platform.OS === 'ios' ? 'username' : undefined}
                                        autoComplete={Platform.OS === 'android' ? 'email' : undefined}
                                        importantForAutofill="yes"
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

                            <Pressable
                                onPress={handleSubmit}
                                disabled={isLoading || !isEmailValid || !canResend}
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    {
                                        backgroundColor: accentColor,
                                        shadowColor: accentColor,
                                        opacity: (isLoading || !isEmailValid || !canResend) ? 0.5 : 1
                                    },
                                    pressed && styles.buttonPressed,
                                ]}>
                                <View style={styles.btnContent}>
                                    <ThemedText style={styles.primaryButtonText}>
                                        {canResend ? 'Send Reset Link' : `Resend (${resendTimer}s)`}
                                    </ThemedText>
                                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                                </View>
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
    safeArea: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { marginBottom: 32, alignItems: 'center', position: 'relative' },
    backButton: { position: 'absolute', left: 0, top: 0, padding: 8 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    subtitle: { textAlign: 'center', fontSize: 14 },
    card: { borderRadius: 24, padding: 24, shadowOpacity: 0.1, elevation: 4 },
    banner: { padding: 12, borderRadius: 12, marginBottom: 16, flexDirection: 'row', gap: 8, alignItems: 'center' },
    bannerText: { fontSize: 13, flex: 1 },
    fieldGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, height: '100%' },

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

    primaryButton: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowOpacity: 0.2, elevation: 4 },
    btnContent: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
    buttonPressed: { opacity: 0.9 },
});
