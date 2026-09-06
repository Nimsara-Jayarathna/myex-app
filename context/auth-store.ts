import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { UserProfile } from '@/types';
import { logError } from '@/utils/logger';

const COOKIE_CACHE_KEY = 'auth_cookies';
const LAST_VERIFIED_SESSION_AT_KEY = 'auth.last_verified_session_at';
const OFFLINE_ACCESS_UNTIL_KEY = 'auth.offline_access_until';
export const OFFLINE_SESSION_GRACE_MS = 24 * 60 * 60 * 1000;

const ALLOWED_AUTH_COOKIE_NAMES = new Set(['accessToken', 'refreshToken']);

const parseAuthCookie = (cookie: string) => {
  const pair = cookie.split(';', 1)[0]?.trim() ?? '';
  if (!pair || /[\r\n]/.test(pair)) return null;
  const separator = pair.indexOf('=');
  if (separator <= 0) return null;
  const name = pair.slice(0, separator).trim();
  const value = pair.slice(separator + 1).trim();
  if (!ALLOWED_AUTH_COOKIE_NAMES.has(name) || !/^[A-Za-z0-9_-]+$/.test(name)) return null;
  return { name, value, pair: `${name}=${value}` };
};

const mergeAuthCookies = (existing: string[] | null, incoming: string[]) => {
  const merged = new Map<string, string>();
  for (const cookie of existing ?? []) {
    const parsed = parseAuthCookie(cookie);
    if (parsed?.value) merged.set(parsed.name, parsed.pair);
  }
  for (const cookie of incoming) {
    const parsed = parseAuthCookie(cookie);
    if (!parsed) continue;
    if (parsed.value) merged.set(parsed.name, parsed.pair);
    else merged.delete(parsed.name);
  }
  return [...merged.values()];
};

type AuthPayload = { user: UserProfile };

interface AuthState {
  user: UserProfile | null;
  cookies: string[] | null;
  isAuthenticated: boolean;
  isSessionChecked: boolean;
  hasValidSession: boolean;
  lastVerifiedSessionAt: number | null;
  offlineAccessUntil: number | null;
  setAuth: (payload: AuthPayload, cookies?: string[]) => void;
  hydrateOfflineAuth: (user: UserProfile) => void;
  setHasValidSession: (value: boolean) => void;
  restoreSessionMetadata: () => Promise<boolean>;
  markSessionChecked: () => void;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
  setCookies: (cookies: string[]) => void;
  loadCookies: () => Promise<void>;
}

const persistVerifiedSession = (verifiedAt: number) => {
  const offlineAccessUntil = verifiedAt + OFFLINE_SESSION_GRACE_MS;
  void AsyncStorage.multiSet([
    [LAST_VERIFIED_SESSION_AT_KEY, String(verifiedAt)],
    [OFFLINE_ACCESS_UNTIL_KEY, String(offlineAccessUntil)],
  ]);
  return offlineAccessUntil;
};

const clearSessionMetadata = () => {
  void AsyncStorage.multiRemove([LAST_VERIFIED_SESSION_AT_KEY, OFFLINE_ACCESS_UNTIL_KEY]);
};

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  cookies: null,
  isAuthenticated: false,
  isSessionChecked: false,
  hasValidSession: false,
  lastVerifiedSessionAt: null,
  offlineAccessUntil: null,

  setAuth: ({ user }, incomingCookies) =>
    set(state => {
      const verifiedAt = Date.now();
      const offlineAccessUntil = persistVerifiedSession(verifiedAt);
      const cookies = incomingCookies?.length
        ? mergeAuthCookies(state.cookies, incomingCookies)
        : state.cookies;

      if (cookies?.length) {
        void SecureStore.setItemAsync(COOKIE_CACHE_KEY, JSON.stringify(cookies));
      }

      return {
        ...state,
        user,
        cookies,
        isAuthenticated: true,
        isSessionChecked: true,
        hasValidSession: true,
        lastVerifiedSessionAt: verifiedAt,
        offlineAccessUntil,
      };
    }),

  // Used only after an already-valid offline grace window was checked. It deliberately
  // does not extend or manufacture session validity from a cached profile.
  hydrateOfflineAuth: user =>
    set(state => ({
      ...state,
      user,
      isAuthenticated: state.hasValidSession,
      isSessionChecked: true,
    })),

  setHasValidSession: value =>
    set(state => {
      if (!value) {
        clearSessionMetadata();
        return {
          ...state,
          hasValidSession: false,
          lastVerifiedSessionAt: null,
          offlineAccessUntil: null,
        };
      }

      const verifiedAt = Date.now();
      const offlineAccessUntil = persistVerifiedSession(verifiedAt);
      return {
        ...state,
        hasValidSession: true,
        lastVerifiedSessionAt: verifiedAt,
        offlineAccessUntil,
      };
    }),

  restoreSessionMetadata: async () => {
    try {
      const entries = await AsyncStorage.multiGet([
        LAST_VERIFIED_SESSION_AT_KEY,
        OFFLINE_ACCESS_UNTIL_KEY,
      ]);
      const map = Object.fromEntries(entries);
      const lastVerifiedSessionAt = Number(map[LAST_VERIFIED_SESSION_AT_KEY] ?? 0) || null;
      const offlineAccessUntil = Number(map[OFFLINE_ACCESS_UNTIL_KEY] ?? 0) || null;
      const hasValidSession = Boolean(offlineAccessUntil && Date.now() <= offlineAccessUntil);

      if (!hasValidSession && offlineAccessUntil) {
        clearSessionMetadata();
      }

      set(state => ({
        ...state,
        hasValidSession,
        lastVerifiedSessionAt: hasValidSession ? lastVerifiedSessionAt : null,
        offlineAccessUntil: hasValidSession ? offlineAccessUntil : null,
      }));
      return hasValidSession;
    } catch (error) {
      logError('Failed to restore session metadata', error);
      set(state => ({
        ...state,
        hasValidSession: false,
        lastVerifiedSessionAt: null,
        offlineAccessUntil: null,
      }));
      return false;
    }
  },

  updateUser: updates =>
    set(state => ({
      ...state,
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  setCookies: incomingCookies =>
    set(state => {
      const cookies = mergeAuthCookies(state.cookies, incomingCookies);
      if (cookies.length > 0) {
        void SecureStore.setItemAsync(COOKIE_CACHE_KEY, JSON.stringify(cookies));
      } else {
        void SecureStore.deleteItemAsync(COOKIE_CACHE_KEY);
      }
      return { ...state, cookies: cookies.length ? cookies : null };
    }),

  markSessionChecked: () =>
    set(state => ({
      ...state,
      isSessionChecked: true,
    })),

  logout: () =>
    set(() => {
      clearSessionMetadata();
      void SecureStore.deleteItemAsync(COOKIE_CACHE_KEY);
      return {
        user: null,
        cookies: null,
        isAuthenticated: false,
        isSessionChecked: true,
        hasValidSession: false,
        lastVerifiedSessionAt: null,
        offlineAccessUntil: null,
      };
    }),

  loadCookies: async () => {
    try {
      const stored = await SecureStore.getItemAsync(COOKIE_CACHE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        const cookies = mergeAuthCookies(null, parsed);
        if (cookies.length > 0) {
          set(state => ({ ...state, cookies }));
        } else {
          void SecureStore.deleteItemAsync(COOKIE_CACHE_KEY);
        }
      }
    } catch (error) {
      logError('Failed to load auth cookies', error);
      void SecureStore.deleteItemAsync(COOKIE_CACHE_KEY);
    }
  },
}));
