import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type UserSummary = {
  name: string;
  avatarUrl?: string;
};

type ProfileHeaderProps = {
  user: UserSummary | null;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  nameStyle?: TextStyle;
};

const accentColor = '#3498db';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  containerStyle,
  contentStyle,
  nameStyle,
}) => {
  const router = useRouter();

  const handlePressProfile = () => {
    router.navigate('/home/profile');
  };

  const displayName = user?.name?.trim() || 'Guest';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return (
    <SafeAreaView style={[styles.safeArea, containerStyle]}>
      <ThemedView style={styles.headerShadowWrapper}>
        <ThemedView style={[styles.header, contentStyle]}>
          <Pressable
            onPress={handlePressProfile}
            style={styles.leftContent}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            accessibilityHint="Opens profile management so you can edit your details">
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <ThemedText style={styles.avatarInitials}>{initials || '?'}</ThemedText>
              </View>
            )}

            <View>
              <ThemedText style={[styles.greeting, nameStyle]}>Hello</ThemedText>
              <ThemedText style={[styles.name, nameStyle]}>{displayName}</ThemedText>
            </View>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
  },
  headerShadowWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    backgroundColor: accentColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontWeight: '600',
  },
  greeting: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
});
