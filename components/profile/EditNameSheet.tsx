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

import { updateProfile } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { runFullSync } from '@/utils/sync-service';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';

interface EditNameSheetProps {
    visible: boolean;
    onClose: () => void;
}

export function EditNameSheet({ visible, onClose }: EditNameSheetProps) {
    const { colors } = useAppTheme();
    const { user, updateUser } = useAuth();

    const [fname, setFname] = useState(user?.fname ?? '');
    const [lname, setLname] = useState(user?.lname ?? '');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const [blockingState, setBlockingState] = useState<BlockingState>('idle');
    const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

    // Track if changes were made
    const hasChanges = 
      fname.trim() !== (user?.fname ?? '') || 
      lname.trim() !== (user?.lname ?? '');

    const isFormValid = 
      fname.trim().length > 0 && 
      lname.trim().length > 0 && 
      hasChanges;

    const mutation = useMutation({
        mutationFn: updateProfile,
        onMutate: () => {
            setErrorMessage(null);
            setBlockingState('loading');
            setBlockingMessage('Updating profile...');
        },
        onSuccess: (data) => {
            setBlockingState('success');
            setBlockingMessage('Profile updated!');
            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);
                updateUser(data.user);
                void runFullSync(data.user);
                onClose();
            }, 1000);
        },
        onError: (error: any) => {
             setBlockingState('error');
             const msg = error?.response?.data?.error?.message 
                || error?.response?.data?.message 
                || 'Failed to update name.';
             setBlockingMessage(msg);
        },
    });

    const handleSave = () => {
        if (!fname.trim() || !lname.trim()) {
            setErrorMessage('First and Last name are required.');
            return;
        }
        setErrorMessage(null);
        mutation.mutate({ fname: fname.trim(), lname: lname.trim() });
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
                <Pressable style={styles.backdrop} onPress={onClose} accessible={false} />
                <View style={[styles.sheet, { backgroundColor: colors.surface1 }]}>

                    <View style={styles.header}>
                        <ThemedText style={[styles.title, { color: colors.textMain }]}>Edit Name</ThemedText>
                        <Pressable
                            onPress={onClose}
                            style={styles.closeBtn}
                            accessibilityRole="button"
                            accessibilityLabel="Close edit name">
                            <MaterialIcons name="close" size={24} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    {errorMessage && (
                        <ThemedText style={{ color: '#ef4444', marginBottom: 16 }}>{errorMessage}</ThemedText>
                    )}

                    <View style={styles.row}>
                        <View style={styles.half}>
                            <View style={styles.labelRow}>
                                <ThemedText style={[styles.label, { color: colors.textSubtle }]}>First Name</ThemedText>
                                <ThemedText style={[styles.charCounter, { color: fname.length >= 10 ? '#ef4444' : colors.textMuted }]}>
                                    {fname.length}/10
                                </ThemedText>
                            </View>
                            <TextInput
                                value={fname}
                                onChangeText={setFname}
                                maxLength={10}
                                style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                            />
                        </View>
                        <View style={styles.half}>
                            <View style={styles.labelRow}>
                                <ThemedText style={[styles.label, { color: colors.textSubtle }]}>Last Name</ThemedText>
                                <ThemedText style={[styles.charCounter, { color: lname.length >= 10 ? '#ef4444' : colors.textMuted }]}>
                                    {lname.length}/10
                                </ThemedText>
                            </View>
                            <TextInput
                                value={lname}
                                onChangeText={setLname}
                                maxLength={10}
                                style={[styles.input, { color: colors.textMain, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                            />
                        </View>
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
                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</ThemedText>
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
    row: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    half: { flex: 1 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 12, fontWeight: '600' },
    charCounter: { fontSize: 11, fontWeight: '600' },
    input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 16 },
    saveBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
