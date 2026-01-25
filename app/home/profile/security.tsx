import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HomeContent } from '@/components/home/layout/HomeContent';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';

import { ChangePasswordSheet } from '@/components/profile/ChangePasswordSheet';

export default function SecuritySettingsScreen() {
  const { colors } = useAppTheme();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <>
      <HomeContent>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass },
          ]}
        >
          <Pressable
            onPress={() => setShowChangePassword(true)}
            style={styles.settingRow}
          >
            <View>
              <ThemedText style={[styles.settingTitle]}>Change Password</ThemedText>
              <ThemedText style={{ color: colors.textMuted, fontSize: 13 }}>
                Update your password to keep your account secure.
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
      </HomeContent>

      <ChangePasswordSheet visible={showChangePassword} onClose={() => setShowChangePassword(false)} />
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
});
