import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import dayjs from 'dayjs';

import { ThemedText } from '@/components/themed-text';
import type { AllFilters } from '../_hooks/useTransactionLogic';

const accentColor = '#3498db';

interface Props {
  filters: AllFilters;
  categories: { id: string; name: string; type: string }[];
  onChange: (f: AllFilters) => void;
}

export function FilterControls({ filters, categories, onChange }: Props) {
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // Helper to update a single field
  const update = (overrides: Partial<AllFilters>) => onChange({ ...filters, ...overrides });

  return (
    <View style={styles.container}>
      {/* 1. Date Range with Platform-Specific Pickers */}
      <ControlCard title="Date Range">
        <View style={styles.dateColumn}>
          <View style={styles.dateRow}>
            <ThemedText style={styles.dateLabel}>From</ThemedText>
            <DateSelector
              value={filters.startDate}
              onChange={(d) => update({ startDate: d })}
            />
          </View>
          <View style={styles.dateRow}>
            <ThemedText style={styles.dateLabel}>To</ThemedText>
            <DateSelector
              value={filters.endDate}
              onChange={(d) => update({ endDate: d })}
            />
          </View>
        </View>
      </ControlCard>

      {/* 2. Type Filter */}
      <ControlCard title="Type">
        <View style={styles.row}>
          {(['all', 'income', 'expense'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => update({ typeFilter: t, categoryFilter: 'all' })}
              style={[styles.pill, filters.typeFilter === t && styles.pillActive]}
            >
              <ThemedText style={[styles.pillText, filters.typeFilter === t && styles.pillTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ControlCard>

      {/* 3. Category Filter */}
      <ControlCard title="Category">
        <Pressable style={styles.dropdownTrigger} onPress={() => setIsCatModalOpen(true)}>
          <ThemedText>
            {filters.categoryFilter === 'all'
              ? 'All categories'
              : categories.find((c) => c.id === filters.categoryFilter)?.name ?? 'Select'}
          </ThemedText>
          <MaterialIcons name="arrow-drop-down" size={24} color="#95a5a6" />
        </Pressable>
      </ControlCard>

      {/* Category Selection Modal */}
      <Modal visible={isCatModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Select Category</ThemedText>
              <Pressable onPress={() => setIsCatModalOpen(false)}>
                 <MaterialIcons name="close" size={24} color="#555" />
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
                  style={[styles.modalItem, filters.categoryFilter === cat.id && styles.modalItemActive]}
                  onPress={() => {
                    update({ categoryFilter: cat.id });
                    setIsCatModalOpen(false);
                  }}
                >
                  <ThemedText>{cat.name}</ThemedText>
                  <View style={[styles.tinyBadge, cat.type === 'income' ? styles.badgeIncome : styles.badgeExpense]}>
                     <ThemedText style={[styles.tinyBadgeText, cat.type === 'income' ? styles.textIncome : styles.textExpense]}>
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

const ControlCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.card}>
    <ThemedText style={styles.cardTitle}>{title}</ThemedText>
    {children}
  </View>
);

// --- NEW DATE SELECTOR (Handles Web & Mobile) ---
const DateSelector = ({ value, onChange }: { value: string; onChange: (d: string) => void }) => {
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
      <View style={styles.dateInputWrapper}>
        <MaterialIcons name="calendar-today" size={16} color="#555" style={{marginRight: 8}} />
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
            color: '#333',
            width: '100%'
          }}
        />
      </View>
    );
  }

  // 2. MOBILE RENDER
  return (
    <>
      <Pressable onPress={() => setShow(true)} style={styles.dateInputWrapper}>
        <MaterialIcons name="calendar-today" size={16} color="#555" />
        <ThemedText style={styles.dateText}>{value}</ThemedText>
      </Pressable>

      {show && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade">
            <View style={styles.iosBackdrop}>
               <View style={styles.iosPickerBox}>
                 <DateTimePicker
                   value={dateObj}
                   mode="date"
                   display="spinner"
                   onChange={onMobileChange}
                   textColor="black"
                 />
                 <Pressable onPress={() => setShow(false)} style={styles.iosDoneBtn}>
                   <ThemedText style={{color: accentColor, fontWeight: 'bold'}}>Done</ThemedText>
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
  container: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#95a5a6',
    marginBottom: 8,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  
  // Date Styles
  dateColumn: {
    width: '100%',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateLabel: {
    width: 40,
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 40,
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#333',
  },
  iosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosPickerBox: {
    backgroundColor: 'white',
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
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  pillText: { fontSize: 13, color: '#333', fontWeight: '500' },
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
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { textAlign: 'center' },
  modalList: { paddingBottom: 20 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalItemActive: { backgroundColor: '#f0f9ff' },
  tinyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeIncome: { backgroundColor: 'rgba(46,204,113,0.1)', borderColor: 'rgba(46,204,113,0.2)' },
  badgeExpense: { backgroundColor: 'rgba(231,76,60,0.1)', borderColor: 'rgba(231,76,60,0.2)' },
  tinyBadgeText: { fontSize: 10, fontWeight: '700' },
  textIncome: { color: '#2ecc71' },
  textExpense: { color: '#e74c3c' },
  closeButton: { marginTop: 10, backgroundColor: '#f0f0f0', padding: 14, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { fontWeight: '600' },
});