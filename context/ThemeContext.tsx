import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { ThemeColors } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'blipzo.theme.preference';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  resolvedTheme: 'light' | 'dark';
  colors: typeof ThemeColors.light;
  isThemeReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then(stored => {
        if (active && isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      })
      .finally(() => {
        if (active) setIsThemeReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;
    Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [isThemeReady, preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_PREFERENCE_KEY, next);
  }, []);

  const resolvedTheme = preference === 'system' ? systemScheme : preference;

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedTheme,
      colors: ThemeColors[resolvedTheme],
      isThemeReady,
    }),
    [preference, setPreference, resolvedTheme, isThemeReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return value;
}
