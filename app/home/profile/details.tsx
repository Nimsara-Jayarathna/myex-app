import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HomeContent } from '@/components/home/layout/HomeContent';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

import { ChangeEmailSheet } from '@/components/profile/ChangeEmailSheet';
import { EditNameSheet } from '@/components/profile/EditNameSheet';

export default function ProfileDetailsScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();

  const [showEditName, setShowEditName] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  return (
    <>
      <HomeContent>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass },
          ]}
        >
          <View style={styles.settingRow}>
            <View>
              <ThemedText style={[styles.label, { color: colors.textMuted }]}>Name</ThemedText>
              <ThemedText style={styles.value}>{user?.fname} {user?.lname}</ThemedText>
            </View>
            <Pressable onPress={() => setShowEditName(true)} style={styles.editBtn}>
              <MaterialIcons name="edit" size={20} color={colors.primaryAccent} />
            </Pressable>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSoft, marginVertical: 12 }]} />

          <View style={styles.settingRow}>
            <View>
              <ThemedText style={[styles.label, { color: colors.textMuted }]}>Email</ThemedText>
              <ThemedText style={styles.value}>{user?.email}</ThemedText>
            </View>
            <Pressable onPress={() => setShowChangeEmail(true)} style={styles.editBtn}>
              <MaterialIcons name="edit" size={20} color={colors.primaryAccent} />
            </Pressable>
          </View>

        </View>
      </HomeContent>

      <EditNameSheet visible={showEditName} onClose={() => setShowEditName(false)} />
      <ChangeEmailSheet visible={showChangeEmail} onClose={() => setShowChangeEmail(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  label: {
    fontSize: 13,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    padding: 8,
  },
  rowDivider: {
    height: 1,
  },
});
