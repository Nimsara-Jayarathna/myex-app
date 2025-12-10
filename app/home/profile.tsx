import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { logoutSession } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useAuth } from '@/hooks/useAuth';
import { HomeBackground } from './_components/HomeBackground';

const accentColor = '#3498db';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutSession();
    } catch {
      // silent
    }
    logout();
  };

  return (
    <HomeBackground>
      <ProfileHeader user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null} />

      <View style={styles.container}>
        {/* TODO: Implement full profile management (edit name, avatar, etc.) */}
        <View style={styles.card}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <ThemedText style={styles.value}>{user?.name ?? 'Not set'}</ThemedText>

          <ThemedText style={styles.label}>Email</ThemedText>
          <ThemedText style={styles.value}>{user?.email ?? 'Not set'}</ThemedText>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityHint="Signs you out of your MyEx account"
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}>
            <ThemedText style={styles.logoutText}>Log out</ThemedText>
          </Pressable>
        </View>
      </View>
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(211,216,224,0.9)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  label: {
    marginTop: 8,
    fontSize: 13,
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 24,
  },
  logoutButton: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    backgroundColor: accentColor,
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
});
