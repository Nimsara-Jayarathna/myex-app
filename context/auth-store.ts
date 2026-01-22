import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthResponse, UserProfile } from '@/types';

const SESSION_CACHE_KEY = 'has_valid_session';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isSessionChecked: boolean;
  hasValidSession: boolean;
  setAuth: (payload: AuthResponse) => void;
  setHasValidSession: (value: boolean) => void;
  markSessionChecked: () => void;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isSessionChecked: false,
  hasValidSession: false,
  setAuth: ({ user }: AuthResponse) =>
    set(() => {
      void AsyncStorage.setItem(SESSION_CACHE_KEY, 'true');
      return {
        user,
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
  markSessionChecked: () =>
    set(state => ({
      ...state,
      isSessionChecked: true,
    })),
  logout: () =>
    set(() => {
      void AsyncStorage.setItem(SESSION_CACHE_KEY, 'false');
      return {
        user: null,
        isAuthenticated: false,
        isSessionChecked: true,
        hasValidSession: false,
      };
    }),
}));
