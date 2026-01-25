import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { AuthResponse, UserProfile } from '@/types';

const SESSION_CACHE_KEY = 'has_valid_session';
const COOKIE_CACHE_KEY = 'auth_cookies';

interface AuthState {
  user: UserProfile | null;
  cookies: string[] | null;
  isAuthenticated: boolean;
  isSessionChecked: boolean;
  hasValidSession: boolean;
  setAuth: (payload: AuthResponse, cookies?: string[]) => void;
  setHasValidSession: (value: boolean) => void;
  markSessionChecked: () => void;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
  setCookies: (cookies: string[]) => void;
  loadCookies: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  cookies: null,
  isAuthenticated: false,
  isSessionChecked: false,
  hasValidSession: false,
  setAuth: ({ user }: AuthResponse, incomingCookies?: string[]) =>
    set((state) => {
      void AsyncStorage.setItem(SESSION_CACHE_KEY, 'true');

      // Use incoming cookies if valid, otherwise keep existing ones
      const cookies = (incomingCookies && incomingCookies.length > 0)
        ? incomingCookies
        : state.cookies;

      if (cookies && cookies.length > 0) {
        // Store securely
        void SecureStore.setItemAsync(COOKIE_CACHE_KEY, JSON.stringify(cookies));
      }

      return {
        user,
        cookies,
        isAuthenticated: true,
        isSessionChecked: true,
        hasValidSession: true,
      };
    }),
  setHasValidSession: (value: boolean) =>
    set(state => ({
      ...state,
      hasValidSession: value,
    })),
  updateUser: (updates: Partial<UserProfile>) =>
    set(state => ({
      ...state,
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  setCookies: (cookies: string[]) =>
    set(state => {
      if (cookies && cookies.length > 0) {
        void SecureStore.setItemAsync(COOKIE_CACHE_KEY, JSON.stringify(cookies));
      }
      return { ...state, cookies };
    }),
  markSessionChecked: () =>
    set(state => ({
      ...state,
      isSessionChecked: true,
    })),
  logout: () =>
    set(() => {
      void AsyncStorage.setItem(SESSION_CACHE_KEY, 'false');
      void SecureStore.deleteItemAsync(COOKIE_CACHE_KEY);
      return {
        user: null,
        cookies: null,
        isAuthenticated: false,
        isSessionChecked: true,
        hasValidSession: false,
      };
    }),
  loadCookies: async () => {
    try {
      const stored = await SecureStore.getItemAsync(COOKIE_CACHE_KEY);
      if (stored) {
        const cookies = JSON.parse(stored) as string[];
        set(state => ({ ...state, cookies }));
      }
    } catch (error) {
      console.error('Failed to load cookies', error);
    }
  },
}));
