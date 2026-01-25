import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { logoutSession } from '@/api/auth';
import { HomeContent } from '@/components/home/layout/HomeContent';
import { ThemedText } from '@/components/themed-text';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const version = Constants.expoConfig?.version ?? '1.1.0';
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { offlineMode, capabilities, tryGoOnline, reconnectionState, reconnectionMessage, resetReconnectionState } = useOffline();
  const router = useRouter();

  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

  const handleGoOnline = async () => {
    if (!offlineMode || reconnectionState === 'loading') return;
    await tryGoOnline();
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
      setBlockingState('loading');
      setBlockingMessage('Logging out...');
      await logoutSession();
      // Delay slightly for effect
      setTimeout(() => {
        setBlockingState('success'); // Optional: show success before redirect? Or just redirect.
        // Usually logout is quick. Let's just redirect after a brief moment or immediately.
        // Actually, let's show success "Logged out" for 1s.
        setBlockingMessage('See you soon!');
        setTimeout(() => {
          setBlockingState('idle');
          logout();
          router.replace('/welcome');
        }, 1000);
      }, 500);
    } catch {
      // If logout fails, forced local logout
      setBlockingState('idle');
      logout();
      router.replace('/welcome');
    }
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
          disabled={!offlineMode}
          style={({ pressed }) => [
            styles.goOnlineButton,
            {
              backgroundColor: offlineMode ? colors.primaryAccent : colors.surface2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.goOnlineText,
              { color: offlineMode ? '#ffffff' : colors.textMuted },
            ]}
          >
            {offlineMode ? 'Go online' : 'Online'}
          </ThemedText>
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
      <BlockingModal
        state={blockingState}
        message={blockingMessage}
        onClose={() => setBlockingState('idle')} // Usually logout error doesn't need dismissal but fallback
      />

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
