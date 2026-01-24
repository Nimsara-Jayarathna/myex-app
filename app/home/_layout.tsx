import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';

import { InteractionManager } from 'react-native';

import { HomeShell } from '@/components/home/layout/HomeShell';
import { useOffline } from '@/context/OfflineContext';
import { useAuth } from '@/hooks/useAuth';
import { runFullSync } from '@/utils/sync-service';

export default function HomeTabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, user } = useAuth();
  const { offlineMode, capabilities, tryGoOnline } = useOffline();

  useEffect(() => {
    if (!isAuthenticated && !offlineMode) {
      router.replace('/welcome');
    }
  }, [isAuthenticated, offlineMode, router]);

  // Sync Trigger on Mount (Delayed)
  useEffect(() => {
    if (isAuthenticated && user && !offlineMode) {
      const task = InteractionManager.runAfterInteractions(() => {
          // Short delay to allow smooth transition before blocking UI
          setTimeout(() => {
              void runFullSync(user);
          }, 800);
      });
      return () => task.cancel();
    }
  }, [isAuthenticated, offlineMode, user]);

  useEffect(() => {
    // Offline route guard: keep users out of blocked sections.
    if (!offlineMode) return;
    if (!capabilities.canAccessMainSections) {
      router.replace('/home/today');
      return;
    }

    if (segments.length < 2) return;
    const route = segments[1];
    
    // Check for "All" tab
    if (route === 'all') {
      router.replace('/home/today');
      return;
    }

    // Check for restricted profile sub-routes
    // route (segments[1]) is 'profile'. We need to check the next segment.
    if (route === 'profile' && segments.length > 2) {
      const subRoute = segments[2];
      const restrictedSubRoutes = ['details', 'security', 'categories', 'currency'];
      if (typeof subRoute === 'string' && restrictedSubRoutes.includes(subRoute)) {
        router.replace('/home/profile');
      }
    }
  }, [offlineMode, capabilities, router, segments]);

  if (!isAuthenticated && !offlineMode) return null;

  return (
    <HomeShell user={user ? { name: user.name ?? user.email, avatarUrl: undefined } : null}>
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen 
        name="all" 
        options={{ title: 'All' }} 
        listeners={{
          tabPress: (e) => {
            if (offlineMode) {
              e.preventDefault();
              Alert.alert(
                'You are offline',
                'You need to go online to view all transactions.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Go Online', 
                    onPress: async () => {
                      await tryGoOnline();
                    } 
                  }
                ]
              );
            }
          },
        }} 
      />
      
      {/* 
         Register nested routes.
         - profile: The profile folder (Stack). 
           We hide the Tab header because the Stack (in profile/_layout.tsx) handles its own headers.
       */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          headerShown: false,
          href: '/home/profile',
        }} 
      /> 
    </HomeShell>
  );
}
