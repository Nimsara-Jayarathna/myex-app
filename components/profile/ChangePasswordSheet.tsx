import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { changePassword } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useAppTheme } from '@/context/ThemeContext';
import { IOS_PASSWORD_RULES, isStrongPassword, PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS_LABEL } from '@/utils/password-policy';

interface ChangePasswordSheetProps {
    visible: boolean;
    onClose: () => void;
}

export function ChangePasswordSheet({ visible, onClose }: ChangePasswordSheetProps) {
    const { colors } = useAppTheme();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [blockingState, setBlockingState] = useState<BlockingState>('idle');
    const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

    // Validation
    const passwordsMatch = newPassword === confirmNewPassword;
    const isFormValid =
        currentPassword.length > 0 &&
        isStrongPassword(newPassword) &&
        confirmNewPassword.length > 0 &&
        passwordsMatch;

    const mutation = useMutation({
        mutationFn: changePassword,
        onMutate: () => {
            setErrorMessage(null);
            setBlockingState('loading');
            setBlockingMessage('Changing password...');
        },
        onSuccess: () => {
            setBlockingState('success');
            setBlockingMessage('Password changed!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                onClose();
            }, 1500);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message
                || 'Failed to change password. Check your current password.';
            setBlockingMessage(msg);
        },
    });

    const handleSave = () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setErrorMessage('All fields are required.');
            return;
        }
        if (!isStrongPassword(newPassword)) {
            setErrorMessage(`${PASSWORD_REQUIREMENTS_LABEL}.`);
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }
        setErrorMessage(null);
        mutation.mutate({ currentPassword, newPassword });
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
                        <ThemedText style={[styles.title, { color: colors.textMain }]}>Change Password</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close change password">
                            <MaterialIcons name="close" size={24} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    {errorMessage && (
                        <ThemedText style={{ color: '#ef4444', marginBottom: 16 }}>{errorMessage}</ThemedText>
                    )}

                    <View style={styles.field}>
                        <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Current Password</ThemedText>
                        <TextInput
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType={Platform.OS === 'ios' ? 'password' : undefined}
                            autoComplete={Platform.OS === 'android' ? 'current-password' : undefined}
                            importantForAutofill="yes"
                            style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                        />
                    </View>
                    <View style={styles.field}>
                        <View style={styles.labelRow}>
                            <ThemedText style={[styles.label, { color: colors.textSubtle }]}>New Password</ThemedText>
                            <ThemedText
                                style={[
                                    styles.charCounter,
                                    { color: isStrongPassword(newPassword) ? '#27ae60' : colors.textMuted }
                                ]}
                            >
                                {newPassword.length}/{PASSWORD_MIN_LENGTH}+ characters
                            </ThemedText>
                        </View>
                        <TextInput
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder={PASSWORD_REQUIREMENTS_LABEL}
                            placeholderTextColor={colors.textMuted}
                            textContentType={Platform.OS === 'ios' ? 'newPassword' : undefined}
                            autoComplete={Platform.OS === 'android' ? 'new-password' : undefined}
                            passwordRules={Platform.OS === 'ios' ? IOS_PASSWORD_RULES : undefined}
                            importantForAutofill="yes"
                            style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                        />
                    </View>
                    <View style={styles.field}>
                        <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Confirm New Password</ThemedText>
                        <TextInput
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType={Platform.OS === 'ios' ? 'newPassword' : undefined}
                            autoComplete={Platform.OS === 'android' ? 'new-password' : undefined}
                            passwordRules={Platform.OS === 'ios' ? IOS_PASSWORD_RULES : undefined}
                            importantForAutofill="yes"
                            style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                        />

                        {/* Password match validation */}
                        {confirmNewPassword.length > 0 && !passwordsMatch && (
                            <View style={styles.validationFeedback}>
                                <View style={styles.validationRow}>
                                    <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                                    <ThemedText style={[styles.validationText, { color: '#ef4444' }]}>
                                        Passwords don&apos;t match
                                    </ThemedText>
                                </View>
                            </View>
                        )}
                    </View>

                    <Pressable
                        onPress={handleSave}
                        disabled={!isFormValid}
                        style={({ pressed }) => [
                            styles.saveBtn,
                            {
                                backgroundColor: colors.primaryAccent,
                                opacity: !isFormValid ? 0.5 : 1
                            },
                            pressed && { opacity: 0.8 },
                        ]}
                    >
                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Update Password</ThemedText>
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
    field: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    charCounter: { fontSize: 11, fontWeight: '600' },
    input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
    validationFeedback: { marginTop: 6 },
    validationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    validationText: { fontSize: 12, fontWeight: '500' },
    saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
