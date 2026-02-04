import { useMemo } from 'react';

import { useAuthStore } from '@/context/auth-store';

export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSessionChecked = useAuthStore(state => state.isSessionChecked);
  const hasValidSession = useAuthStore(state => state.hasValidSession);
  const logout = useAuthStore(state => state.logout);
  const setAuth = useAuthStore(state => state.setAuth);
  const setHasValidSession = useAuthStore(state => state.setHasValidSession);
  const updateUser = useAuthStore(state => state.updateUser);
  const markSessionChecked = useAuthStore(state => state.markSessionChecked);

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isSessionChecked,
      hasValidSession,
      logout,
      setAuth,
      setHasValidSession,
      updateUser,
      markSessionChecked,
    }),
    [
      user,
      isAuthenticated,
      isSessionChecked,
      hasValidSession,
      logout,
      setAuth,
      setHasValidSession,
      updateUser,
      markSessionChecked,
    ]
  );
};
