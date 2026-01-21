import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { logoutSession } from '@/api/auth';
import { HomeContent } from '@/components/home/layout/HomeContent';
import { ThemedText } from '@/components/themed-text';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { offlineMode, capabilities, tryGoOnline } = useOffline();
  const router = useRouter();

  const [onlineCheckState, setOnlineCheckState] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (onlineCheckState === 'success' || onlineCheckState === 'failed') {
      const timer = setTimeout(() => setOnlineCheckState('idle'), 1600);
      return () => clearTimeout(timer);
    }
  }, [onlineCheckState]);

  const handleGoOnline = async () => {
    if (!offlineMode || onlineCheckState === 'checking') return;
    setOnlineCheckState('checking');
    const success = await tryGoOnline();
    setOnlineCheckState(success ? 'success' : 'failed');
  };

  const handleRestrictedAction = (action: () => void) => {
    if (offlineMode) {
      Alert.alert(
        'You are offline',
        'You need to go online content to proceed.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go Online', 
            onPress: handleGoOnline 
          }
        ]
      );
      return;
    }
    action();
  };

  const handleLogout = async () => {
    try {
      await logoutSession();
    } catch {
      // silent
    }
    logout();
    router.replace('/welcome');
  };

  return (
    <HomeContent>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass },
          ]}
        >
          {/* Profile Setting */}
          <Pressable
            onPress={() => handleRestrictedAction(() => router.navigate('/home/profile/details'))}
            style={styles.listRow}
          >
            <View style={styles.listRowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.surface2 }]}>
                <MaterialIcons name="person" size={18} color={colors.textMuted} />
              </View>
              <ThemedText style={[styles.listLabel, offlineMode && { color: colors.textSubtle }]}>Profile setting</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSoft }]} />

          {/* Security Setting */}
          <Pressable
            onPress={() => handleRestrictedAction(() => router.navigate('/home/profile/security'))}
            style={styles.listRow}
          >
            <View style={styles.listRowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.surface2 }]}>
                <MaterialIcons name="security" size={18} color={colors.textMuted} />
              </View>
              <ThemedText style={[styles.listLabel, offlineMode && { color: colors.textSubtle }]}>Security setting</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSoft }]} />

          {/* Category Setting */}
          <Pressable
            onPress={() => {
               if (!capabilities.canManageCategories && !offlineMode) return;
               handleRestrictedAction(() => router.navigate('/home/profile/categories'));
            }}
            disabled={!capabilities.canManageCategories && !offlineMode}
            style={styles.listRow}
          >
            <View style={styles.listRowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.surface2 }]}>
                <MaterialIcons name="category" size={18} color={colors.textMuted} />
              </View>
              <ThemedText
                style={[
                  styles.listLabel,
                  (offlineMode || !capabilities.canManageCategories) && { color: colors.textSubtle },
                ]}
              >
                Category setting
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSoft }]} />

          {/* Currency Setting */}
          <Pressable
            onPress={() => handleRestrictedAction(() => router.navigate('/home/profile/currency'))}
            style={styles.listRow}
          >
            <View style={styles.listRowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.surface2 }]}>
                <MaterialIcons name="attach-money" size={18} color={colors.textMuted} />
              </View>
              <ThemedText
                style={[
                  styles.listLabel,
                  offlineMode && { color: colors.textSubtle },
                ]}
              >
                Currency setting
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass },
          ]}
        >
          <ThemedText style={[styles.label, { color: colors.textMuted }]}>Theme</ThemedText>
          <ThemeSwitcher />
        </View>

        <View style={styles.sectionSpacer} />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass },
          ]}
        >
          <ThemedText style={[styles.label, { color: colors.textMuted }]}>Connectivity</ThemedText>
          <Pressable
            onPress={handleGoOnline}
            disabled={!offlineMode || onlineCheckState === 'checking'}
            style={({ pressed }) => [
              styles.goOnlineButton,
              {
                backgroundColor:
                  onlineCheckState === 'success'
                    ? '#22c55e'
                    : onlineCheckState === 'failed'
                      ? '#f59e0b'
                      : offlineMode
                        ? colors.primaryAccent
                        : colors.surface2,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {onlineCheckState === 'checking' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText
                style={[
                  styles.goOnlineText,
                  { color: offlineMode ? '#ffffff' : colors.textMuted },
                ]}
              >
                {onlineCheckState === 'success'
                  ? 'Online'
                  : onlineCheckState === 'failed'
                    ? 'Still offline'
                    : offlineMode
                      ? 'Go online'
                      : 'Online'}
              </ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              { backgroundColor: '#ef4444' },
              pressed && styles.logoutButtonPressed,
            ]}>
            <ThemedText style={styles.logoutText}>Log out</ThemedText>
          </Pressable>

        </View>
    </HomeContent>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 6,
    marginBottom: 16,
  },
  listRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },
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
  sectionSpacer: {
    height: 12,
  },
  label: {
    fontSize: 13,
    opacity: 0.7,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 24,
  },
  goOnlineButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goOnlineText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  versionText: {
    marginTop: 24,
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
});
