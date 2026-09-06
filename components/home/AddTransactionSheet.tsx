import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { getCategories } from '@/api/categories';
import { createTransaction } from '@/api/transactions';
import { ThemedText } from '@/components/themed-text';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useAuthStore } from '@/context/auth-store';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';
import type { Category, Transaction, TransactionInput } from '@/types';
import { createClientId } from '@/utils/identifiers';
// eslint-disable-next-line import/no-unresolved
import { getLocalCategories, initDb, insertPendingTransaction } from '@/utils/local-db';
import { parsePositiveMoneyInput } from '@/utils/money';

const GRID_GAP = 8;
const PADDING_H = 24;
const MAX_SHEET_WIDTH = 680;

type AddTransactionStep = 1 | 2;
type CategoryOption = { id: string; name: string; type: 'income' | 'expense'; isDefault?: boolean };
type AddTransactionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onTransactionCreated?: (transaction: Transaction) => void;
};

export function AddTransactionSheet({ visible, onClose, onTransactionCreated }: AddTransactionSheetProps) {
  const queryClient = useQueryClient();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, resolvedTheme } = useAppTheme();
  const { offlineMode, capabilities } = useOffline();
  const inputRef = useRef<TextInput>(null);
  const submissionIdRef = useRef(createClientId());
  const { user } = useAuthStore();
  const currencySymbol = user?.currency?.symbol ?? '$';

  const [step, setStep] = useState<AddTransactionStep>(1);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [draftDate, setDraftDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>();
  const [isOfflineSaving, setIsOfflineSaving] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const isDark = resolvedTheme === 'dark';
  const canAdd = capabilities.canAdd;
  const sheetWidth = Math.min(windowWidth, MAX_SHEET_WIDTH);
  const chipWidth = Math.max(52, (sheetWidth - PADDING_H * 2 - GRID_GAP * 4 - 2) / 5);
  const filteredCategories = useMemo(
    () => categories.filter(category => category.type === transactionType),
    [categories, transactionType],
  );

  useEffect(() => {
    if (!visible) return;
    const now = new Date();
    setStep(1);
    setTransactionType('expense');
    setDate(now);
    setDraftDate(now);
    setAmount('');
    setSelectedCategory('');
    setNote('');
    setIsExpanded(false);
    setBlockingState('idle');
    setBlockingMessage(undefined);
    setIsOfflineSaving(false);
    submissionIdRef.current = createClientId();
  }, [visible]);

  const handleModalShow = () => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => inputRef.current?.focus(), 150);
    });
  };

  useEffect(() => {
    if (!visible || step !== 2) return;

    const loadCategories = async () => {
      setBlockingState('loading');
      setBlockingMessage('Loading categories...');

      if (offlineMode) {
        try {
          await initDb();
          const local = await getLocalCategories();
          const mapped = local
            .filter(item => Boolean(item.serverId))
            .map(item => ({
              id: item.serverId,
              name: item.name,
              type: item.type,
              isDefault: item.isDefault === 1,
            }));

          setCategories(mapped);
          if (mapped.length === 0) {
            setBlockingState('error');
            setBlockingMessage('Connect to the internet once to sync valid categories before adding offline transactions.');
          } else {
            setBlockingState('idle');
            setBlockingMessage(undefined);
          }
        } catch {
          setCategories([]);
          setBlockingState('error');
          setBlockingMessage('Cached categories are unavailable. Reconnect before adding an offline transaction.');
        }
        return;
      }

      try {
        const result = await getCategories();
        const mapped = (result.categories ?? [])
          .map((item: Category) => ({
            id: item.id ?? item._id ?? '',
            name: item.name,
            type: item.type,
            isDefault: item.isDefault,
          }))
          .filter(item => Boolean(item.id));
        setCategories(mapped);
        setBlockingState('idle');
        setBlockingMessage(undefined);
      } catch {
        setCategories([]);
        setBlockingState('error');
        setBlockingMessage('Unable to load categories.');
      }
    };

    void loadCategories();
  }, [visible, step, offlineMode]);

  useEffect(() => {
    const defaultForType = filteredCategories.find(category => category.isDefault);
    setSelectedCategory(defaultForType?.id ?? filteredCategories[0]?.id ?? '');
  }, [filteredCategories]);

  const mutation = useMutation({
    mutationFn: (payload: TransactionInput) =>
      createTransaction(payload, { idempotencyKey: submissionIdRef.current }),
    onMutate: () => {
      setBlockingState('loading');
      setBlockingMessage('Saving...');
    },
    onSuccess: transaction => {
      setBlockingState('success');
      setBlockingMessage('Saved!');
      setTimeout(() => {
        setBlockingState('idle');
        void queryClient.invalidateQueries({ queryKey: ['transactions'] });
        onTransactionCreated?.(transaction);
        onClose();
      }, 700);
    },
    onError: (error: any) => {
      setBlockingState('error');
      setBlockingMessage(error?.response?.data?.message || 'Error saving transaction.');
    },
  });

  const validateTransaction = () => {
    const normalizedAmount = parsePositiveMoneyInput(amount);
    if (normalizedAmount === null) {
      setBlockingState('error');
      setBlockingMessage('Enter an amount greater than zero with no more than two decimal places.');
      return null;
    }
    if (!dayjs(date).isValid()) {
      setBlockingState('error');
      setBlockingMessage('Select a valid transaction date.');
      return null;
    }
    if (!selectedCategory || !filteredCategories.some(category => category.id === selectedCategory)) {
      setBlockingState('error');
      setBlockingMessage('Select a valid category.');
      return null;
    }
    return normalizedAmount;
  };

  const handleSave = () => {
    if (mutation.isPending || isOfflineSaving) return;
    const normalizedAmount = validateTransaction();
    if (normalizedAmount === null) return;

    if (offlineMode) {
      setIsOfflineSaving(true);
      setBlockingState('loading');
      setBlockingMessage('Saving offline...');
      const now = new Date().toISOString();
      const localId = submissionIdRef.current;
      const category = categories.find(item => item.id === selectedCategory);

      void initDb()
        .then(() =>
          insertPendingTransaction({
            localId,
            serverId: null,
            type: transactionType,
            amount: normalizedAmount,
            categoryId: selectedCategory,
            categoryName: category?.name ?? null,
            note: note.trim() || null,
            date: dayjs(date).format('YYYY-MM-DD'),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          }),
        )
        .then(() => {
          setBlockingState('success');
          setBlockingMessage('Saved offline');
          setTimeout(() => {
            setBlockingState('idle');
            void queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onClose();
          }, 700);
        })
        .catch(() => {
          setIsOfflineSaving(false);
          setBlockingState('error');
          setBlockingMessage('Unable to save this transaction offline.');
        });
      return;
    }

    mutation.mutate({
      amount: normalizedAmount,
      type: transactionType,
      category: selectedCategory,
      date: dayjs(date).format('YYYY-MM-DD'),
      note: note.trim() || undefined,
    });
  };

  const triggerLimitReached = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if ((cleaned.match(/\./g) || []).length > 1) {
      triggerLimitReached();
      return;
    }
    const decimalIndex = cleaned.indexOf('.');
    if (decimalIndex !== -1 && cleaned.slice(decimalIndex + 1).length > 2) {
      triggerLimitReached();
      return;
    }

    let final = cleaned;
    if (final.startsWith('.')) final = `0${final}`;
    if (final.length > 1 && final[0] === '0' && final[1] !== '.') final = final.replace(/^0+/, '') || '0';
    setAmount(final);
  };

  const chooseType = (type: 'income' | 'expense') => {
    if (parsePositiveMoneyInput(amount) === null) {
      triggerLimitReached();
      setBlockingState('error');
      setBlockingMessage('Enter a valid amount greater than zero first.');
      return;
    }
    setTransactionType(type);
    setStep(2);
  };

  const openDatePicker = () => {
    setDraftDate(date);
    setShowDatePicker(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleModalShow}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />

        <View style={[styles.sheet, { backgroundColor: colors.surface1, borderColor: colors.borderSoft, maxWidth: MAX_SHEET_WIDTH }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderSoft }]} />

          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <ThemedText style={styles.titleText}>New Transaction</ThemedText>
              {step === 2 && (
                <Pressable
                  onPress={() => setStep(1)}
                  style={styles.editAmountPill}
                  accessibilityRole="button"
                  accessibilityLabel="Edit transaction amount"
                >
                  <MaterialIcons name="edit" size={12} color={colors.primaryAccent} />
                  <ThemedText style={[styles.editAmountText, { color: colors.primaryAccent }]}>
                    {currencySymbol}{amount}
                  </ThemedText>
                </Pressable>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {step === 1 ? (
              <View style={styles.stepContainer}>
                <View style={styles.amountContainer}>
                  <Animated.View style={[styles.amountInputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
                    <Text style={[styles.currency, { color: colors.textMain }]}>{currencySymbol}</Text>
                    <TextInput
                      ref={inputRef}
                      value={amount}
                      onChangeText={handleAmountChange}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.textSubtle}
                      style={[styles.mainInput, { color: colors.textMain }]}
                      maxLength={12}
                      accessibilityLabel="Transaction amount"
                    />
                  </Animated.View>
                </View>

                <ThemedText style={styles.typeLabel}>Select transaction type</ThemedText>
                <View style={styles.typeRow}>
                  <Pressable
                    style={[styles.typeBtn, styles.incomeBtn, isDark && styles.incomeBtnDark]}
                    onPress={() => chooseType('income')}
                    accessibilityRole="button"
                    accessibilityLabel="Add income transaction"
                  >
                    <View style={styles.typeIconBg}><MaterialIcons name="add" size={18} color="#22c55e" /></View>
                    <ThemedText style={styles.btnLabel}>Income</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.typeBtn, styles.expenseBtn, isDark && styles.expenseBtnDark]}
                    onPress={() => chooseType('expense')}
                    accessibilityRole="button"
                    accessibilityLabel="Add expense transaction"
                  >
                    <View style={styles.typeIconBg}><MaterialIcons name="remove" size={18} color="#ef4444" /></View>
                    <ThemedText style={styles.btnLabel}>Expense</ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.stepContainer}>
                <View style={styles.section}>
                  <ThemedText style={styles.label}>Category</ThemedText>
                  {filteredCategories.length === 0 ? (
                    <ThemedText style={[styles.emptyCategoryText, { color: colors.textMuted }]}>No valid cached categories are available for this transaction type.</ThemedText>
                  ) : (
                    <View style={styles.categoryGrid}>
                      {(isExpanded ? filteredCategories : filteredCategories.slice(0, 10)).map(cat => (
                        <Pressable
                          key={cat.id}
                          onPress={() => setSelectedCategory(cat.id)}
                          accessibilityRole="radio"
                          accessibilityLabel={cat.name}
                          accessibilityState={{ selected: selectedCategory === cat.id }}
                          style={[
                            styles.catChip,
                            { width: chipWidth, backgroundColor: colors.surface2, borderColor: colors.borderSoft },
                            selectedCategory === cat.id && { borderColor: colors.primaryAccent, backgroundColor: `${colors.primaryAccent}15` },
                          ]}
                        >
                          <Text numberOfLines={1} style={[styles.catName, { color: colors.textMain }, selectedCategory === cat.id && { color: colors.primaryAccent, fontWeight: 'bold' }]}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      ))}
                      {filteredCategories.length > 10 && (
                        <Pressable onPress={() => setIsExpanded(value => !value)} style={styles.showMoreBtn} accessibilityRole="button">
                          <ThemedText style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                            {isExpanded ? 'Show Less' : `+${filteredCategories.length - 10} More`}
                          </ThemedText>
                          <MaterialIcons name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={16} color={colors.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <ThemedText style={styles.label}>Date</ThemedText>
                  <Pressable
                    onPress={openDatePicker}
                    style={[styles.inputBox, { backgroundColor: colors.surface2, borderColor: colors.borderSoft }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Transaction date ${dayjs(date).format('DD MMMM YYYY')}`}
                  >
                    <MaterialIcons name="event" size={20} color={colors.textMuted} />
                    <ThemedText style={styles.inputText}>{dayjs(date).format('DD MMMM, YYYY')}</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.section}>
                  <ThemedText style={styles.label}>Note</ThemedText>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Short description..."
                    placeholderTextColor={colors.textSubtle}
                    style={[styles.noteInput, { backgroundColor: colors.surface2, borderColor: colors.borderSoft, color: colors.textMain }]}
                    maxLength={240}
                    accessibilityLabel="Transaction note"
                  />
                </View>

                <Pressable
                  onPress={handleSave}
                  disabled={!canAdd || mutation.isPending || isOfflineSaving || filteredCategories.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Save transaction"
                  accessibilityState={{ disabled: !canAdd || mutation.isPending || isOfflineSaving || filteredCategories.length === 0, busy: mutation.isPending || isOfflineSaving }}
                  style={[
                    styles.saveBtn,
                    { backgroundColor: colors.primaryAccent },
                    (!canAdd || mutation.isPending || isOfflineSaving || filteredCategories.length === 0) && { opacity: 0.6 },
                  ]}
                >
                  {mutation.isPending || isOfflineSaving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveText}>Complete</ThemedText>}
                </Pressable>
                <View style={{ height: 40 }} />
              </View>
            )}
          </ScrollView>

          {showDatePicker && Platform.OS === 'ios' && (
            <View style={[styles.iosPickerPanel, { borderTopColor: colors.borderSoft }]}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="spinner"
                onChange={(_, value) => value && setDraftDate(value)}
              />
              <View style={styles.pickerActions}>
                <Pressable onPress={() => setShowDatePicker(false)} style={styles.pickerAction} accessibilityRole="button">
                  <ThemedText style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => { setDate(draftDate); setShowDatePicker(false); }}
                  style={styles.pickerAction}
                  accessibilityRole="button"
                >
                  <ThemedText style={{ color: colors.primaryAccent, fontWeight: '800' }}>Done</ThemedText>
                </Pressable>
              </View>
            </View>
          )}

          {showDatePicker && Platform.OS !== 'ios' && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(_, value) => { setShowDatePicker(false); if (value) setDate(value); }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
      <BlockingModal state={blockingState} message={blockingMessage} onClose={() => { setBlockingState('idle'); setBlockingMessage(undefined); }} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderBottomWidth: 0, maxHeight: '90%', width: '100%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 10 },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleText: { fontSize: 18, fontWeight: '900' },
  editAmountPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)' },
  editAmountText: { fontSize: 13, fontWeight: 'bold' },
  closeBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: PADDING_H, paddingBottom: 40 },
  stepContainer: { gap: 20 },
  amountContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  amountInputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  currency: { fontSize: 32, fontWeight: '600', marginRight: 4 },
  mainInput: { fontSize: 56, fontWeight: 'bold', textAlign: 'center', padding: 0, minWidth: 100 },
  typeLabel: { textAlign: 'center', fontSize: 13, opacity: 0.6 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, minHeight: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  typeIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  btnLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  incomeBtn: { backgroundColor: '#22c55e' },
  incomeBtnDark: { backgroundColor: 'rgba(34, 197, 94, 0.4)' },
  expenseBtn: { backgroundColor: '#ef4444' },
  expenseBtnDark: { backgroundColor: 'rgba(239, 68, 68, 0.4)' },
  section: { gap: 10 },
  label: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  catChip: { height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5 },
  catName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  emptyCategoryText: { fontSize: 13, lineHeight: 19 },
  inputBox: { minHeight: 54, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  inputText: { fontSize: 15, fontWeight: 'bold' },
  noteInput: { minHeight: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  saveBtn: { minHeight: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  showMoreBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  iosPickerPanel: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingBottom: 12 },
  pickerActions: { flexDirection: 'row', justifyContent: 'space-between' },
  pickerAction: { minWidth: 72, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
