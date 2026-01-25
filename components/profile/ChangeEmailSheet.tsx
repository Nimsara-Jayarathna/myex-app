import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import {
    changeEmailConfirm,
    changeEmailInit,
    changeEmailRequestNew,
    changeEmailVerifyCurrent,
} from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

interface ChangeEmailSheetProps {
    visible: boolean;
    onClose: () => void;
}

type Step = 'init' | 'verify-current' | 'request-new' | 'confirm-new';

export function ChangeEmailSheet({ visible, onClose }: ChangeEmailSheetProps) {
    const { colors } = useAppTheme();
    const { user, updateUser } = useAuth();

    const [step, setStep] = useState<Step>('init');
    const [currentOtpDigits, setCurrentOtpDigits] = useState(['', '', '', '', '', '']);
    const [newEmail, setNewEmail] = useState('');
    const [newOtpDigits, setNewOtpDigits] = useState(['', '', '', '', '', '']);

    // Email validation
    const [emailTouched, setEmailTouched] = useState(false);
    const [showEmailValidation, setShowEmailValidation] = useState(false);

    // OTP Input Refs
    const currentOtpRefs = useRef<(TextInput | null)[]>([]);
    const newOtpRefs = useRef<(TextInput | null)[]>([]);

    // Temporary tokens
    const [changeToken, setChangeToken] = useState('');

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [blockingState, setBlockingState] = useState<BlockingState>('idle');
    const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

    // Resend timer
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

    // Email validation with debounce
    useEffect(() => {
        if (!emailTouched || newEmail.trim() === '') {
            setShowEmailValidation(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowEmailValidation(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [newEmail, emailTouched]);

    // Start timer when entering OTP steps
    useEffect(() => {
        if (step === 'verify-current' || step === 'confirm-new') {
            setResendTimer(60);
            setCanResend(false);
            setTimeout(() => {
                if (step === 'verify-current') {
                    currentOtpRefs.current[0]?.focus();
                } else {
                    newOtpRefs.current[0]?.focus();
                }
            }, 300);
        }
    }, [step]);



    // Validation helpers
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const isEmailValid = isValidEmail(newEmail);

    // OTP Handlers
    const handleOtpChange = (value: string, index: number, isCurrentEmail: boolean) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        const otpDigits = isCurrentEmail ? currentOtpDigits : newOtpDigits;
        const setOtpDigits = isCurrentEmail ? setCurrentOtpDigits : setNewOtpDigits;
        const otpRefs = isCurrentEmail ? currentOtpRefs : newOtpRefs;

        if (numericValue.length === 0) {
            const newOtpDigits = [...otpDigits];
            newOtpDigits[index] = '';
            setOtpDigits(newOtpDigits);
            return;
        }

        if (numericValue.length > 1) {
            // Handle paste
            const digits = numericValue.slice(0, 6).split('');
            const newOtpDigits = [...otpDigits];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtpDigits[index + i] = digit;
                }
            });
            setOtpDigits(newOtpDigits);
            const nextIndex = Math.min(index + digits.length - 1, 5);
            otpRefs.current[nextIndex]?.focus();
        } else {
            // Single digit
            const newOtpDigits = [...otpDigits];
            newOtpDigits[index] = numericValue;
            setOtpDigits(newOtpDigits);
            if (index < 5) {
                otpRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleOtpKeyPress = (e: any, index: number, isCurrentEmail: boolean) => {
        const otpDigits = isCurrentEmail ? currentOtpDigits : newOtpDigits;
        const otpRefs = isCurrentEmail ? currentOtpRefs : newOtpRefs;

        if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // --- Mutations ---

    const initMutation = useMutation({
        mutationFn: changeEmailInit,
        onMutate: () => {
            setBlockingState('loading');
            setBlockingMessage('Sending code...');
        },
        onSuccess: () => {
            setBlockingState('success');
            setBlockingMessage('Code sent!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                setErrorMessage(null);
                setStep('verify-current');
            }, 1000);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message
                || error?.response?.data?.message
                || 'Failed to send code.';
            setBlockingMessage(msg);
        }
    });

    const verifyCurrentMutation = useMutation({
        mutationFn: changeEmailVerifyCurrent,
        onMutate: () => {
            setBlockingState('loading');
            setBlockingMessage('Verifying...');
        },
        onSuccess: (data) => {
            setBlockingState('success');
            setBlockingMessage('Verified!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                setChangeToken(data.changeToken);
                setErrorMessage(null);
                setStep('request-new');
            }, 1000);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message
                || error?.response?.data?.message
                || 'Invalid code.';
            setBlockingMessage(msg);

            // Clear OTP on error
            setTimeout(() => {
                setCurrentOtpDigits(['', '', '', '', '', '']);
                setBlockingState('idle');
                setTimeout(() => {
                    currentOtpRefs.current[0]?.focus();
                }, 100);
            }, 2000);
        }
    });

    const requestNewMutation = useMutation({
        mutationFn: changeEmailRequestNew,
        onMutate: () => {
            setBlockingState('loading');
            setBlockingMessage('Sending code...');
        },
        onSuccess: () => {
            setBlockingState('success');
            setBlockingMessage('Code sent!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                setErrorMessage(null);
                setStep('confirm-new');
            }, 1000);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message
                || error?.response?.data?.message
                || 'Failed to send code. Email might be in use.';
            setBlockingMessage(msg);
        }
    });

    const confirmNewMutation = useMutation({
        mutationFn: changeEmailConfirm,
        onMutate: () => {
            setBlockingState('loading');
            setBlockingMessage('Updating email...');
        },
        onSuccess: (data) => {
            setBlockingState('success');
            setBlockingMessage('Email updated!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                updateUser({ email: data.email });
                onClose();
                setStep('init');
                setCurrentOtpDigits(['', '', '', '', '', '']);
                setNewEmail('');
                setNewOtpDigits(['', '', '', '', '', '']);
            }, 1500);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message
                || error?.response?.data?.message
                || 'Invalid code.';
            setBlockingMessage(msg);

            // Clear OTP on error
            setTimeout(() => {
                setNewOtpDigits(['', '', '', '', '', '']);
                setBlockingState('idle');
                setTimeout(() => {
                    newOtpRefs.current[0]?.focus();
                }, 100);
            }, 2000);
        }
    });

    // Auto-verify when all 6 digits are entered
    useEffect(() => {
        if (step === 'verify-current' && currentOtpDigits.every(digit => digit !== '')) {
            const otp = currentOtpDigits.join('');
            if (otp.length === 6 && !verifyCurrentMutation.isPending) {
                verifyCurrentMutation.mutate({ otp });
            }
        }
    }, [currentOtpDigits, step, verifyCurrentMutation]);

    useEffect(() => {
        if (step === 'confirm-new' && newOtpDigits.every(digit => digit !== '')) {
            const otp = newOtpDigits.join('');
            if (otp.length === 6 && !confirmNewMutation.isPending) {
                confirmNewMutation.mutate({ otp });
            }
        }
    }, [newOtpDigits, step, confirmNewMutation]);

    // --- Handlers ---

    const handleNext = () => {
        setErrorMessage(null);

        if (step === 'init') {
            initMutation.mutate();
        } else if (step === 'request-new') {
            if (!isEmailValid) {
                setErrorMessage('Enter valid email.');
                return;
            }
            requestNewMutation.mutate({ changeToken, newEmail });
        }
    };

    const handleResend = () => {
        if (!canResend) return;

        if (step === 'verify-current') {
            setCurrentOtpDigits(['', '', '', '', '', '']);
            initMutation.mutate();
        } else if (step === 'confirm-new') {
            setNewOtpDigits(['', '', '', '', '', '']);
            requestNewMutation.mutate({ changeToken, newEmail });
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { backgroundColor: colors.surface1 }]}>

                    <View style={styles.header}>
                        <ThemedText style={[styles.title, { color: colors.textMain }]}>Change Email</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={24} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    {errorMessage && (
                        <ThemedText style={{ color: '#ef4444', marginBottom: 16 }}>{errorMessage}</ThemedText>
                    )}

                    {step === 'init' && (
                        <View style={styles.content}>
                            <ThemedText style={{ color: colors.textMuted, marginBottom: 16 }}>
                                We will send a verification code to your current email: {user?.email}
                            </ThemedText>
                        </View>
                    )}

                    {step === 'verify-current' && (
                        <>
                            <View style={styles.field}>
                                <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                                    Enter 6-Digit Code (Current Email)
                                </ThemedText>

                                {/* OTP Input Boxes */}
                                <View style={styles.otpContainer}>
                                    {currentOtpDigits.map((digit, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.otpBox,
                                                {
                                                    backgroundColor: colors.inputBg,
                                                    borderColor: digit ? colors.primaryAccent : colors.inputBorder,
                                                    borderWidth: digit ? 2 : 1,
                                                },
                                            ]}
                                        >
                                            <TextInput
                                                ref={(ref) => { currentOtpRefs.current[index] = ref; }}
                                                value={digit}
                                                onChangeText={(value) => handleOtpChange(value, index, true)}
                                                onKeyPress={(e) => handleOtpKeyPress(e, index, true)}
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
                                    Didn&apos;t receive the code?{' '}
                                </ThemedText>
                                <Pressable
                                    onPress={handleResend}
                                    disabled={!canResend}
                                    style={{ padding: 4 }}
                                >
                                    <ThemedText
                                        style={[
                                            styles.linkText,
                                            {
                                                color: canResend ? colors.primaryAccent : colors.textMuted,
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

                    {step === 'request-new' && (
                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSubtle }]}>New Email Address</ThemedText>
                            <TextInput
                                value={newEmail}
                                onChangeText={(text) => {
                                    setNewEmail(text);
                                    if (!emailTouched) setEmailTouched(true);
                                }}
                                placeholder="new@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                            />

                            {/* Email Validation Feedback */}
                            {showEmailValidation && newEmail.trim() !== '' && !isEmailValid && (
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

                    {step === 'confirm-new' && (
                        <>
                            <View style={styles.field}>
                                <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                                    Enter 6-Digit Code (New Email)
                                </ThemedText>

                                {/* OTP Input Boxes */}
                                <View style={styles.otpContainer}>
                                    {newOtpDigits.map((digit, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.otpBox,
                                                {
                                                    backgroundColor: colors.inputBg,
                                                    borderColor: digit ? colors.primaryAccent : colors.inputBorder,
                                                    borderWidth: digit ? 2 : 1,
                                                },
                                            ]}
                                        >
                                            <TextInput
                                                ref={(ref) => { newOtpRefs.current[index] = ref; }}
                                                value={digit}
                                                onChangeText={(value) => handleOtpChange(value, index, false)}
                                                onKeyPress={(e) => handleOtpKeyPress(e, index, false)}
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
                                    Didn&apos;t receive the code?{' '}
                                </ThemedText>
                                <Pressable
                                    onPress={handleResend}
                                    disabled={!canResend}
                                    style={{ padding: 4 }}
                                >
                                    <ThemedText
                                        style={[
                                            styles.linkText,
                                            {
                                                color: canResend ? colors.primaryAccent : colors.textMuted,
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

                    {/* Only show button for init and request-new steps */}
                    {(step === 'init' || step === 'request-new') && (
                        <Pressable
                            onPress={handleNext}
                            disabled={step === 'request-new' && !isEmailValid}
                            style={({ pressed }) => [
                                styles.saveBtn,
                                {
                                    backgroundColor: colors.primaryAccent,
                                    opacity: (step === 'request-new' && !isEmailValid) ? 0.5 : 1
                                },
                                pressed && { opacity: 0.8 },
                            ]}
                        >
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                                {step === 'init' ? 'Send Code' : 'Continue'}
                            </ThemedText>
                        </Pressable>
                    )}

                </View>
            </KeyboardAvoidingView>
            <BlockingModal
                state={blockingState}
                message={blockingMessage}
                onClose={() => setBlockingState('idle')}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 4 },
    content: { marginBottom: 20 },
    field: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
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
    linkText: {
        fontSize: 14,
        fontWeight: '600',
    },
    validationFeedback: {
        marginTop: 6,
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
    saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
