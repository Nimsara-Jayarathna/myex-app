import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getCategories } from '@/api/categories';
import { createTransaction } from '@/api/transactions';
import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/context/auth-store';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';
import type { Category, Transaction, TransactionInput } from '@/types';
import { getLocalCategories, initDb, insertPendingTransaction } from '@/utils/local-db';
import { logError } from '@/utils/logger';
import { triggerToast } from '@/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 5-Column Math
const GRID_GAP = 8;
const PADDING_H = 24;
const CHIP_WIDTH = (SCREEN_WIDTH - (PADDING_H * 2) - (GRID_GAP * 4) - 2) / 5;

const OFFLINE_CATEGORIES: CategoryOption[] = [
  { id: 'offline-income', name: 'Income', type: 'income', isDefault: true },
  { id: 'offline-expense', name: 'Expense', type: 'expense', isDefault: true },
];

type AddTransactionStep = 1 | 2;

type CategoryOption = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault?: boolean;
};

type AddTransactionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onTransactionCreated?: (transaction: Transaction) => void;
};

export function AddTransactionSheet({ visible, onClose, onTransactionCreated }: AddTransactionSheetProps) {
  const queryClient = useQueryClient();
  const { colors, resolvedTheme } = useAppTheme();
  const { offlineMode, capabilities } = useOffline();
  const inputRef = useRef<TextInput>(null);
  const { user } = useAuthStore();
  const currencySymbol = user?.currency?.symbol ?? '$';

  const [step, setStep] = useState<AddTransactionStep>(1);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

  const isDark = resolvedTheme === 'dark';
  const canAdd = capabilities.canAdd;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setTransactionType('expense');
      setDate(new Date());
      setAmount('');
      setSelectedCategory('');
      setNote('');
    }
  }, [visible]);

  const handleModalShow = () => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => inputRef.current?.focus(), 100);
    });
  };

  useEffect(() => {
    if (!visible || step !== 2) return;
    const loadCategories = async () => {
      // Offline: load categories from local DB.
      if (offlineMode) {
        try {
          setIsLoadingCategories(true);
          await initDb();
          const local = await getLocalCategories();
          const mapped = local.map(item => ({
            id: item.serverId,
            name: item.name,
            type: item.type,
            isDefault: item.isDefault === 1,
          }));
          setCategories(mapped.length ? mapped : OFFLINE_CATEGORIES);
        } catch {
          setCategories(OFFLINE_CATEGORIES);
        } finally {
          setIsLoadingCategories(false);
        }
        return;
      }

      try {
        setIsLoadingCategories(true);
        const result = await getCategories();
        const mapped = (result.categories ?? []).map((item: Category) => ({
          id: item.id ?? item._id ?? item.name,
          name: item.name,
          type: item.type,
          isDefault: item.isDefault,
        }));
        setCategories(mapped);
      } catch {
        Alert.alert('Error', 'Unable to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    void loadCategories();
  }, [visible, step, offlineMode]);

  useEffect(() => {
    const nextFiltered = categories.filter(category => category.type === transactionType);
    // Force exactly 10 items (5x2 grid)
    setFilteredCategories(nextFiltered);
    if (nextFiltered.length > 0) {
      const defaultForType = nextFiltered.find(category => category.isDefault);
      setSelectedCategory(defaultForType?.id ?? nextFiltered[0]?.id ?? '');
    }
  }, [categories, transactionType]);

  const mutation = useMutation({
    mutationFn: (payload: TransactionInput) => createTransaction(payload),
    onMutate: () => {
        setBlockingState('loading');
        setBlockingMessage('Saving transaction...');
    },
    onSuccess: transaction => {
      setBlockingState('success');
      setBlockingMessage('Saved!');
      setTimeout(() => {
          setBlockingState('idle');
          setBlockingMessage(undefined);
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          onTransactionCreated?.(transaction);
          onClose();
      }, 1500);
    },
    onError: (error: any) => {
        setBlockingState('error');
        const msg = error?.response?.data?.error?.message 
            || error?.response?.data?.message 
            || 'Unable to add transaction';
        setBlockingMessage(msg);
    },
  });

  const handleSave = () => {
    if (offlineMode) {
      // Offline: enqueue for local sync later.
      const now = new Date().toISOString();
      const localId = `offline-${Date.now()}`;
      const categoryName = categories.find(item => item.id === selectedCategory)?.name ?? null;
      const safeCategoryId =
        typeof selectedCategory === 'string' ? selectedCategory : String(selectedCategory ?? '');
      const safeCategoryName =
        typeof categoryName === 'string'
          ? categoryName
          : categoryName
            ? JSON.stringify(categoryName)
            : null;
      setBlockingState('loading');
      setBlockingMessage('Saving locally...');

      void initDb()
        .then(() =>
          insertPendingTransaction({
            localId,
            serverId: null,
            type: transactionType,
            amount: Number(amount),
            categoryId: safeCategoryId,
            categoryName: safeCategoryName,
            note: note.trim() || null,
            date: dayjs(date).format('YYYY-MM-DD'),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          })
        )
        .then(() => {
          setBlockingState('success');
          setBlockingMessage('Saved locally!');
          setTimeout(() => {
             setBlockingState('idle'); // Close modal
             queryClient.invalidateQueries({ queryKey: ['transactions', 'today-local'] });
             triggerToast({ message: 'Saved locally. This will sync when you are back online.' });
             onClose();
          }, 1500);
        })
        .catch((error) => {
          logError('offline-save: failed', error);
          setBlockingState('error');
          setBlockingMessage('Unable to save offline record.');
        });
      return;
    }

    mutation.mutate({
      amount: Number(amount),
      type: transactionType,
      category: selectedCategory,
      date: dayjs(date).format('YYYY-MM-DD'),
      note: note.trim() || undefined,
    });
  };

  if (!visible) return null;

  const handleAmountChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points - only keep the first one
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places - prevent typing more
    if (parts.length === 2 && parts[1].length > 2) {
      // Don't update if user tries to type more than 2 decimals
      return;
    }
    
    // Prevent leading zeros (except for "0." cases)
    if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
      cleaned = cleaned.substring(1);
    }
    
    setAmount(cleaned);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.surface1, borderColor: colors.borderSoft }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderSoft }]} />

          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <ThemedText style={styles.titleText}>New Transaction</ThemedText>
              {step === 2 && (
                <Pressable onPress={() => setStep(1)} style={styles.editAmountPill}>
                  <MaterialIcons name="edit" size={12} color={colors.primaryAccent} />
                  <ThemedText style={[styles.editAmountText, { color: colors.primaryAccent }]}>{currencySymbol}{amount}</ThemedText>
                </Pressable>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            {step === 1 ? (
              <View style={styles.stepContainer}>
                {/* AMOUNT INPUT: Fixed symbol clipping and alignment */}
                <View style={styles.amountContainer}>
                  <Text style={[styles.currency, { color: colors.textSubtle }]}>{currencySymbol}</Text>
                  <TextInput
                    ref={inputRef}
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType={Platform.OS === 'android' ? 'numeric' : 'decimal-pad'}
                    inputMode="decimal"
                    placeholder="0.00"
                    placeholderTextColor={colors.textSubtle}
                    style={[styles.mainInput, { color: colors.textMain }]}
                    maxLength={10}
                  />
                </View>

                <ThemedText style={styles.typeLabel}>Select transaction type</ThemedText>
                <View style={styles.typeRow}>
                  <Pressable
                    style={[
                      styles.typeBtn,
                      styles.incomeBtn,
                      isDark && styles.incomeBtnDark,
                      !canAdd && { opacity: 0.6 },
                    ]}
                    disabled={!canAdd}
                    onPress={() => { setTransactionType('income'); setStep(2); }}
                  >
                    <View style={styles.typeIconBg}><MaterialIcons name="add" size={18} color="#22c55e" /></View>
                    <ThemedText style={styles.btnLabel}>Income</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.typeBtn,
                      styles.expenseBtn,
                      isDark && styles.expenseBtnDark,
                      !canAdd && { opacity: 0.6 },
                    ]}
                    disabled={!canAdd}
                    onPress={() => { setTransactionType('expense'); setStep(2); }}
                  >
                    <View style={styles.typeIconBg}><MaterialIcons name="remove" size={18} color="#ef4444" /></View>
                    <ThemedText style={styles.btnLabel}>Expense</ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.stepContainer}>
                {/* 5 x 2 CATEGORY GRID */}
                <View style={styles.section}>
                  <ThemedText style={styles.label}>Category</ThemedText>
                  <View style={styles.categoryGrid}>
                    {isLoadingCategories ? <ActivityIndicator size="small" color={colors.primaryAccent} /> :
                      <>
                        {(isExpanded ? filteredCategories : filteredCategories.slice(0, 10)).map(cat => (
                          <Pressable
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            disabled={!capabilities.canSelectCategory}
                            style={[
                              styles.catChip,
                              { backgroundColor: colors.surface2, borderColor: colors.borderSoft },
                              selectedCategory === cat.id && { borderColor: colors.primaryAccent, backgroundColor: colors.primaryAccent + '15' },
                              !capabilities.canSelectCategory && { opacity: 0.6 },
                            ]}
                          >
                            <Text numberOfLines={1} style={[styles.catName, { color: colors.textMain }, selectedCategory === cat.id && { color: colors.primaryAccent, fontWeight: 'bold' }]}>
                              {cat.name}
                            </Text>
                          </Pressable>
                        ))}
                        {filteredCategories.length > 10 && (
                          <Pressable
                            onPress={() => setIsExpanded(!isExpanded)}
                            style={[styles.showMoreBtn, { width: '100%' }]}
                          >
                            <ThemedText style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                              {isExpanded ? 'Show Less' : `+${filteredCategories.length - 10} More`}
                            </ThemedText>
                            <MaterialIcons name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={16} color={colors.textMuted} />
                          </Pressable>
                        )}
                      </>
                    }
                  </View>
                </View>

                <View style={styles.section}>
                  <ThemedText style={styles.label}>Date</ThemedText>
                  <Pressable onPress={() => setShowDatePicker(true)} style={[styles.inputBox, { backgroundColor: colors.surface2, borderColor: colors.borderSoft }]}>
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
                    multiline
                    style={[styles.noteInput, { backgroundColor: colors.surface2, borderColor: colors.borderSoft, color: colors.textMain }]}
                  />
                </View>

                <Pressable
                  onPress={handleSave}
                  disabled={!canAdd}
                  style={[
                    styles.saveBtn,
                    { backgroundColor: colors.primaryAccent },
                    !canAdd && { opacity: 0.6 },
                  ]}
                >
                  {mutation.isPending ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveText}>Complete</ThemedText>}
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* DATE PICKER POPUP (MODAL) */}
          <Modal visible={showDatePicker} transparent animationType="fade">
            <View style={styles.pickerBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} />
              <View style={[styles.pickerPopup, { backgroundColor: colors.surface2 }]}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (d) setDate(d);
                  }}
                  textColor={colors.textMain}
                />
                {Platform.OS === 'ios' && (
                  <Pressable onPress={() => setShowDatePicker(false)} style={styles.pickerDoneBtn}>
                    <ThemedText style={{ color: colors.primaryAccent, fontWeight: 'bold' }}>Done</ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
          </Modal>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, paddingBottom: 40, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 15 },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleText: { fontSize: 18, fontWeight: '900' },
  editAmountPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)' },
  editAmountText: { fontSize: 13, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  stepContainer: { gap: 24 },

  // Amount Section Fixes
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Changed to center for better input compatibility
    justifyContent: 'center',
    paddingVertical: 30,
    height: 120, // Explicit height to prevent clipping
  },
  currency: { fontSize: 32, fontWeight: '600', marginRight: 10 },
  mainInput: { fontSize: 64, fontWeight: 'bold', minWidth: 160, textAlign: 'center', height: 80, padding: 0 },

  typeLabel: { textAlign: 'center', fontSize: 13, opacity: 0.6 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  typeIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  btnLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  incomeBtn: { backgroundColor: '#22c55e' },
  incomeBtnDark: { backgroundColor: 'rgba(34, 197, 94, 0.25)' },
  expenseBtn: { backgroundColor: '#ef4444' },
  expenseBtnDark: { backgroundColor: 'rgba(239, 68, 68, 0.25)' },

  section: { gap: 10 },
  label: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1 },

  // Category Grid Fixes
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  catChip: { width: CHIP_WIDTH, height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 2 },
  catName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  inputBox: { height: 54, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  inputText: { fontSize: 15, fontWeight: 'bold' },
  noteInput: { minHeight: 80, borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, textAlignVertical: 'top' },
  saveBtn: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  // Picker Modal
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerPopup: { width: '85%', padding: 20, borderRadius: 24, overflow: 'hidden' },
  pickerDoneBtn: { alignSelf: 'flex-end', marginTop: 10, padding: 10 },

  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4, marginTop: 4 },
});
