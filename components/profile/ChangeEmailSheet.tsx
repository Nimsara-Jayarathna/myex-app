import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { useAppTheme } from '@/context/ThemeContext';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
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
    const [currentOtp, setCurrentOtp] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newOtp, setNewOtp] = useState('');

    // Temporary tokens
    const [changeToken, setChangeToken] = useState('');

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const [blockingState, setBlockingState] = useState<BlockingState>('idle');
    const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

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
                setCurrentOtp('');
                setNewEmail('');
                setNewOtp('');
            }, 1500);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message 
                || error?.response?.data?.message 
                || 'Invalid code.';
            setBlockingMessage(msg);
        }
    });

    const isLoading =
        initMutation.isPending ||
        verifyCurrentMutation.isPending ||
        requestNewMutation.isPending ||
        confirmNewMutation.isPending;

    // --- Handlers ---

    const handleNext = () => {
        setErrorMessage(null);

        if (step === 'init') {
            initMutation.mutate();
        } else if (step === 'verify-current') {
            if (!currentOtp || currentOtp.length !== 6) {
                setErrorMessage('Enter valid 6-digit code.');
                return;
            }
            verifyCurrentMutation.mutate({ otp: currentOtp });
        } else if (step === 'request-new') {
            if (!newEmail.includes('@')) {
                setErrorMessage('Enter valid email.');
                return;
            }
            requestNewMutation.mutate({ changeToken, newEmail });
        } else if (step === 'confirm-new') {
            if (!newOtp || newOtp.length !== 6) {
                setErrorMessage('Enter valid 6-digit code.');
                return;
            }
            confirmNewMutation.mutate({ otp: newOtp });
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
                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Verification Code (Current Email)</ThemedText>
                            <TextInput
                                value={currentOtp}
                                onChangeText={setCurrentOtp}
                                placeholder="123456"
                                keyboardType="number-pad"
                                maxLength={6}
                                style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                            />
                        </View>
                    )}

                    {step === 'request-new' && (
                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSubtle }]}>New Email Address</ThemedText>
                            <TextInput
                                value={newEmail}
                                onChangeText={setNewEmail}
                                placeholder="new@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                            />
                        </View>
                    )}

                    {step === 'confirm-new' && (
                        <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Verification Code (New Email)</ThemedText>
                            <TextInput
                                value={newOtp}
                                onChangeText={setNewOtp}
                                placeholder="123456"
                                keyboardType="number-pad"
                                maxLength={6}
                                style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                            />
                        </View>
                    )}

                    <Pressable
                        onPress={handleNext}
                        disabled={isLoading}
                        style={({ pressed }) => [
                            styles.saveBtn,
                            { backgroundColor: colors.primaryAccent },
                            pressed && { opacity: 0.8 },
                        ]}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                                {step === 'init' ? 'Send Code' : 'Continue'}
                            </ThemedText>
                        )}
                    </Pressable>

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
    saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
