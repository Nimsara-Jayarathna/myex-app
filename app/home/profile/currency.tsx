import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getCurrencies, updateUserCurrency } from '@/api/currency';
import { HOME_CONTENT_PADDING_H } from '@/components/home/layout/spacing';
import { ThemedText } from '@/components/themed-text';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useAuthStore } from '@/context/auth-store';
import { useAppTheme } from '@/context/ThemeContext';
import type { Currency } from '@/types';

export default function CurrencySettingsScreen() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const queryClient = useQueryClient();
    const { user, setAuth } = useAuthStore();

    const [blockingState, setBlockingState] = useState<BlockingState>('idle');
    const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

    // Fetch currencies
    const { data: currencies, isLoading } = useQuery({
        queryKey: ['currencies'],
        queryFn: getCurrencies,
    });

    // Update currency mutation
    const mutation = useMutation({
        mutationFn: updateUserCurrency,
        onMutate: () => {
            setBlockingState('loading');
            setBlockingMessage('Updating currency...');
        },
        onSuccess: (newCurrency, variables, context) => {
            // Check if API returns a message wrapper (v1.1) or just the object
            // The API reference says: { success: true, message: "...", data: { currency: ... } }
            // So `newCurrency` might be the response wrapper or the currency itself depending on the api function adapter.
            // Assuming the api function returns the data payload or the currency object.

            setBlockingState('success');
            setBlockingMessage('Currency updated!'); // or use data.message if available

            setTimeout(() => {
                setBlockingState('idle');
                setBlockingMessage(undefined);

                // Manually patch local user state
                if (user) {
                    const currencyData = (newCurrency as any).data?.currency || newCurrency;
                    const updatedUser = { ...user, currency: currencyData };
                    // Fix: Type cast to any or use partial update if supported
                    setAuth({ user: updatedUser } as any);
                }
                queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
                queryClient.invalidateQueries({ queryKey: ['currencies'] });
                router.back();
            }, 1000);
        },
        onError: (error: any) => {
            setBlockingState('error');
            const msg = error?.response?.data?.error?.message
                || error?.response?.data?.message
                || 'Failed to update currency.';
            setBlockingMessage(msg);
        },
    });

    const handleSelect = (currency: Currency) => {
        const id = currency.id ?? currency._id;
        console.log('Selecting currency:', { name: currency.name, id, originalId: currency.id, _id: currency._id });
        if (mutation.isPending || !id) return;
        mutation.mutate(id);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.pageBg }]}>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primaryAccent} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.grid}>
                        {currencies?.map((currency) => {
                            const currencyId = currency.id ?? currency._id ?? '';
                            // Use user preference as the source of truth to ensure immediate UI update after mutation
                            const isSelected = user?.currency?.id === currencyId;
                            return (
                                <Pressable
                                    key={currencyId}
                                    disabled={isSelected}
                                    onPress={() => handleSelect(currency)}
                                    style={({ pressed }) => [
                                        styles.card,
                                        {
                                            backgroundColor: isSelected
                                                ? colors.primaryAccent
                                                : colors.surfaceGlassThick,
                                            borderColor: isSelected
                                                ? colors.primaryAccent
                                                : colors.borderGlass,
                                            opacity: pressed ? 0.9 : 1,
                                        },
                                    ]}
                                >
                                    <View style={styles.cardContent}>
                                        <View style={styles.iconRow}>
                                            <View style={[
                                                styles.iconBadge,
                                                { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.primaryAccent }
                                            ]}>
                                                <ThemedText style={[
                                                    styles.symbolText,
                                                    { color: '#fff' }
                                                ]}>
                                                    {currency.symbol}
                                                </ThemedText>
                                            </View>

                                            {isSelected && (
                                                <View style={styles.checkIcon}>
                                                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                                                </View>
                                            )}
                                        </View>

                                        <View style={styles.textContainer}>
                                            <ThemedText style={[
                                                styles.codeText,
                                                { color: isSelected ? '#fff' : colors.primaryAccent }
                                            ]}>
                                                {currency.code}
                                            </ThemedText>
                                            <ThemedText
                                                style={[
                                                    styles.nameText,
                                                    { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {currency.name}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            {mutation.isPending && (
                <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <ActivityIndicator size="large" color={colors.primaryAccent} />
                </View>
            )}

            <BlockingModal
                state={blockingState}
                message={blockingMessage}
                onClose={() => setBlockingState('idle')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    headerWrapper: {
        paddingHorizontal: 0,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: HOME_CONTENT_PADDING_H,
        paddingTop: 16,
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '48%', // roughly 2 columns with gap
        borderRadius: 12, // User image shows somewhat small radius
        padding: 16,
        borderWidth: 1,
        minHeight: 100,
        justifyContent: 'center',
    },
    cardContent: {
        gap: 12,
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    symbolText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    checkIcon: {
        // positioned via flex row
    },
    textContainer: {
        gap: 4,
    },
    codeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    nameText: {
        fontSize: 12,
    },
});
