import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useOffline } from '@/context/OfflineContext';

type UserSummary = {
  name: string;
  avatarUrl?: string;
};

type ProfileHeaderProps = {
  user: UserSummary | null;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  nameStyle?: TextStyle;
  showSettingsButton?: boolean;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  containerStyle,
  contentStyle,
  nameStyle,
  showSettingsButton = false,
}) => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { offlineMode } = useOffline();

  const handlePressProfile = () => {
    router.navigate('/home/profile');
  };

  const handlePressSettings = () => {
    router.navigate('/home/profile/categories');
  };

  const displayName = user?.name?.trim() || 'Guest';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  const statusColor = offlineMode ? '#FFA500' : '#22c55e';

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.surface1 }, containerStyle]}>
      <ThemedView
        style={[
          styles.headerShadowWrapper,
          { backgroundColor: colors.surface1, shadowColor: colors.textMain },
        ]}>
        <ThemedView
          style={[
            styles.header,
            { backgroundColor: colors.surface1 },
            contentStyle,
          ]}>
          <Pressable
            onPress={handlePressProfile}
            style={styles.leftContent}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            accessibilityHint="Opens profile management so you can edit your details">
            <View style={styles.avatarWrapper}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryAccent }]}>
                  <ThemedText style={styles.avatarInitials}>{initials || '?'}</ThemedText>
                </View>
              )}
              {/* Status indicator: green online, orange offline */}
              <View style={[styles.statusDot, { backgroundColor: statusColor, borderColor: colors.surface1 }]} />
            </View>

            <View>
              <ThemedText style={[styles.greeting, nameStyle]}>Hello</ThemedText>
              <ThemedText style={[styles.name, nameStyle]}>{displayName}</ThemedText>
            </View>
          </Pressable>
          {showSettingsButton ? (
            <Pressable
              onPress={handlePressSettings}
              style={[
                styles.settingsButton,
                { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderSoft },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              accessibilityHint="Opens your settings">
              <MaterialIcons name="settings" size={18} color={colors.textMain} />
            </Pressable>
          ) : null}
        </ThemedView>
      </ThemedView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
  },
  headerShadowWrapper: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 40,
    height: 40,
  },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  avatarInitials: {
    color: '#ffffff',
    fontWeight: '600',
  },
  greeting: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
});
