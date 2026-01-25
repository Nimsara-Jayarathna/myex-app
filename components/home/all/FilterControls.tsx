import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import type { AllFilters } from '@/hooks/home/useTransactionLogic';

interface Props {
  filters: AllFilters;
  categories: { id: string; name: string; type: string }[];
  onChange: (f: AllFilters) => void;
}

export function FilterControls({ filters, categories, onChange }: Props) {
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const { colors } = useAppTheme();

  // Helper to update a single field
  const update = (overrides: Partial<AllFilters>) => onChange({ ...filters, ...overrides });

  return (
    <View style={styles.container}>
      {/* 1. Date Range with Platform-Specific Pickers */}
      <ControlCard title="Date Range">
        <View style={styles.dateRowSingle}>
          <DateSelector
            value={filters.startDate}
            onChange={(d) => update({ startDate: d })}
          />
          <MaterialIcons name="arrow-forward" size={16} color={colors.textMuted} />
          <DateSelector
            value={filters.endDate}
            onChange={(d) => update({ endDate: d })}
          />
        </View>
      </ControlCard>

      {/* 2. Type Filter */}
      <ControlCard title="Type">
        <View style={styles.row}>
          {(['all', 'income', 'expense'] as const).map((t) => {
            const isActive = filters.typeFilter === t;
            return (
              <Pressable
                key={t}
                onPress={() => update({ typeFilter: t, categoryFilter: 'all' })}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? colors.primaryAccent : colors.surface2,
                    borderColor: isActive ? colors.primaryAccent : colors.borderSoft,
                  },
                  isActive && {
                    shadowColor: colors.primaryAccent,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.pillText,
                    { color: isActive ? '#fff' : colors.textMain },
                  ]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ControlCard>

      {/* 3. Category Filter */}
      <ControlCard title="Category">
        <Pressable
          style={[
            styles.dropdownTrigger,
            {
              backgroundColor: colors.surface1,
              borderColor: colors.borderSoft,
            },
          ]}
          onPress={() => setIsCatModalOpen(true)}>
          <ThemedText>
            {filters.categoryFilter === 'all'
              ? 'All categories'
              : categories.find((c) => c.id === filters.categoryFilter)?.name ?? 'Select'}
          </ThemedText>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.textMuted} />
        </Pressable>
      </ControlCard>

      {/* Category Selection Modal */}
      <Modal visible={isCatModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface1, borderColor: colors.borderSoft },
            ]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Select Category</ThemedText>
              <Pressable onPress={() => setIsCatModalOpen(false)}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              <Pressable
                style={styles.modalItem}
                onPress={() => {
                  update({ categoryFilter: 'all' });
                  setIsCatModalOpen(false);
                }}
              >
                <ThemedText>All categories</ThemedText>
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.borderSoft },
                    filters.categoryFilter === cat.id && {
                      backgroundColor: colors.surface2,
                    },
                  ]}
                  onPress={() => {
                    update({ categoryFilter: cat.id });
                    setIsCatModalOpen(false);
                  }}
                >
                  <ThemedText>{cat.name}</ThemedText>
                  <View
                    style={[
                      styles.tinyBadge,
                      cat.type === 'income' ? styles.badgeIncome : styles.badgeExpense,
                    ]}>
                    <ThemedText
                      style={[
                        styles.tinyBadgeText,
                        cat.type === 'income' ? styles.textIncome : styles.textExpense,
                      ]}>
                      {cat.type.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- SUB-COMPONENTS ---

const ControlCard = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface1,
          borderColor: colors.borderSoft,
          shadowColor: colors.textMain,
        },
      ]}>
      <ThemedText style={[styles.cardTitle, { color: colors.textSubtle }]}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
};

// --- NEW DATE SELECTOR (Handles Web & Mobile) ---
const DateSelector = ({ value, onChange }: { value: string; onChange: (d: string) => void }) => {
  const { colors, resolvedTheme } = useAppTheme();
  const [show, setShow] = useState(false);
  const dateObj = new Date(value);

  // Handle Mobile Change
  const onMobileChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      onChange(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };

  // 1. WEB RENDER
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.dateInputWrapper,
          { backgroundColor: colors.surface2, borderColor: colors.borderSoft },
        ]}>
        <MaterialIcons
          name="calendar-today"
          size={16}
          color={colors.textMuted}
          style={{ marginRight: 8 }}
        />
        {/* @ts-ignore - Web specific prop handling */}
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            fontFamily: 'System',
            background: 'transparent',
            color: colors.textMain,
            width: '100%'
          }}
        />
      </View>
    );
  }

  // 2. MOBILE RENDER
  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        style={[
          styles.dateInputWrapper,
          { backgroundColor: colors.surface2, borderColor: colors.borderSoft },
        ]}>
        <MaterialIcons name="calendar-today" size={16} color={colors.textMuted} />
        <ThemedText style={[styles.dateText, { color: colors.textMain }]}>{value}</ThemedText>
      </Pressable>

      {show && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade">
            <View style={styles.iosBackdrop}>
              <View
                style={[
                  styles.iosPickerBox,
                  { backgroundColor: colors.surface1, borderColor: colors.borderSoft },
                ]}>
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display="spinner"
                  onChange={onMobileChange}
                  textColor={resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a'}
                />
                <Pressable onPress={() => setShow(false)} style={styles.iosDoneBtn}>
                  <ThemedText style={{ color: colors.primaryAccent, fontWeight: 'bold' }}>
                    Done
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display="default"
            onChange={onMobileChange}
          />
        )
      )}
    </>
  );
};


const styles = StyleSheet.create({
  container: { gap: 8 },
  card: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },

  // Date Styles
  dateRowSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 40,
    gap: 8,
  },
  dateText: {
    fontSize: 13,
  },
  iosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosPickerBox: {
    borderRadius: 12,
    padding: 16,
    width: '80%',
    alignItems: 'center',
  },
  iosDoneBtn: {
    marginTop: 8,
    padding: 8,
  },

  // Pill Styles
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontWeight: '500' },
  pillTextActive: { color: '#fff' },

  // Dropdown Styles
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { textAlign: 'center' },
  modalList: { paddingBottom: 20 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  tinyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeIncome: { backgroundColor: 'rgba(46,204,113,0.1)', borderColor: 'rgba(46,204,113,0.2)' },
  badgeExpense: { backgroundColor: 'rgba(231,76,60,0.1)', borderColor: 'rgba(231,76,60,0.2)' },
  tinyBadgeText: { fontSize: 10, fontWeight: '700' },
  textIncome: { color: '#2ecc71' },
  textExpense: { color: '#e74c3c' },
  closeButton: { marginTop: 10, backgroundColor: '#f0f0f0', padding: 14, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { fontWeight: '600' },
});
