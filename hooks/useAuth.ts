import { useMemo } from 'react';

import { useAuthStore } from '@/context/auth-store';

export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSessionChecked = useAuthStore(state => state.isSessionChecked);
  const logout = useAuthStore(state => state.logout);
  const setAuth = useAuthStore(state => state.setAuth);
  const markSessionChecked = useAuthStore(state => state.markSessionChecked);

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isSessionChecked,
      logout,
      setAuth,
      markSessionChecked,
    }),
    [user, isAuthenticated, isSessionChecked, logout, setAuth, markSessionChecked]
  );
};

