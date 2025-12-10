import { create } from 'zustand';

import type { AuthResponse, UserProfile } from '@/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isSessionChecked: boolean;
  setAuth: (payload: AuthResponse) => void;
  markSessionChecked: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isSessionChecked: false,
  setAuth: ({ user }: AuthResponse) =>
    set({
      user,
      isAuthenticated: true,
      isSessionChecked: true,
    }),
  markSessionChecked: () =>
    set(state => ({
      ...state,
      isSessionChecked: true,
    })),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isSessionChecked: true,
    }),
}));

