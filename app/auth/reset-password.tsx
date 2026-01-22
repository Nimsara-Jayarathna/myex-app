import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resetPassword } from '@/api/auth';
import { HomeBackground } from '@/components/home/HomeBackground';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const accentColor = colors.primaryAccent;

    const params = useLocalSearchParams<{ token?: string }>();
    const [token, setToken] = useState(params.token ?? '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (params.token) setToken(params.token);
    }, [params.token]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [blockingState, setBlockingState] = useState<BlockingState>('idle');
    const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

    const mutation = useMutation({
        mutationFn: resetPassword,
        onMutate: () => {
            setErrorMessage(null);
            setBlockingState('loading');
            setBlockingMessage('Resetting password...');
        },
        onSuccess: () => {
            setBlockingState('success');
            setBlockingMessage('Password reset!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                Alert.alert('Success', 'Password reset successfully. Please log in.', [
                    { text: 'OK', onPress: () => router.replace('/login') }
                ]);
            }, 1500);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message 
                || error?.response?.data?.message 
                || 'Invalid token or password.';
            setBlockingMessage(msg);
            // Fallback
        },
    });

    const isLoading = mutation.isPending;

    const handleSubmit = () => {
        if (!token.trim() || !password.trim()) {
            setErrorMessage('Please fill in all fields.');
            return;
        }
        if (!token.trim() || !password.trim()) {
            setErrorMessage('Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }
        setErrorMessage(null);
        mutation.mutate({ token: token.trim(), password: password.trim() });
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
                            <ThemedText type="title" style={[styles.title, { color: colors.textMain }]}>
                                New Password
                            </ThemedText>
                            <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
                                Enter the code from your email and your new password.
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
                            
                            {/* If deep linked, maybe hide the token field or make it readonly. 
                                For better UX, let's just show it readonly if present from params. */}
                            {params.token && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 12, backgroundColor: '#dcfce7', borderRadius: 12 }}>
                                    <MaterialIcons name="check-circle" size={20} color="#166534" />
                                    <ThemedText style={{ marginLeft: 8, color: '#166534', fontSize: 13, fontWeight: '600' }}>
                                        Security Token Verified
                                    </ThemedText>
                                </View>
                            )}
                            
                            {!params.token && (
                                <View style={styles.fieldGroup}>
                                <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                                    Reset Token
                                </ThemedText>
                                <View
                                    style={[
                                        styles.inputWrapper,
                                        { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                                    ]}
                                >
                                    <MaterialIcons
                                        name="vpn-key"
                                        size={20}
                                        color={colors.textMuted}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        value={token}
                                        onChangeText={setToken}
                                        placeholder="Enter token"
                                        placeholderTextColor={colors.textMuted}
                                        autoCapitalize="none"
                                        style={[styles.input, { color: colors.textMain }]}
                                    />
                                </View>
                            </View>
                            )}

                            <View style={styles.fieldGroup}>
                                <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                                    New Password
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
                                        placeholder="Min. 6 characters"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry
                                        style={[styles.input, { color: colors.textMain }]}
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldGroup}>
                                <ThemedText style={[styles.label, { color: colors.textSubtle }]}>
                                    Confirm New Password
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
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="Re-enter password"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry
                                        style={[styles.input, { color: colors.textMain }]}
                                    />
                                </View>
                            </View>

                            <Pressable
                                onPress={handleSubmit}
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
                                        <ThemedText style={styles.primaryButtonText}>Reset Password</ThemedText>
                                        <MaterialIcons name="check" size={18} color="#fff" />
                                    </View>
                                )}
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
    primaryButton: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowOpacity: 0.2, elevation: 4 },
    btnContent: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
    buttonPressed: { opacity: 0.9 },
});
