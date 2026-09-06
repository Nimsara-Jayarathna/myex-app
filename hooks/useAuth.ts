import { useMemo } from 'react';

import { useAuthStore } from '@/context/auth-store';

export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSessionChecked = useAuthStore(state => state.isSessionChecked);
  const hasValidSession = useAuthStore(state => state.hasValidSession);
  const lastVerifiedSessionAt = useAuthStore(state => state.lastVerifiedSessionAt);
  const offlineAccessUntil = useAuthStore(state => state.offlineAccessUntil);
  const logout = useAuthStore(state => state.logout);
  const setAuth = useAuthStore(state => state.setAuth);
  const hydrateOfflineAuth = useAuthStore(state => state.hydrateOfflineAuth);
  const setHasValidSession = useAuthStore(state => state.setHasValidSession);
  const restoreSessionMetadata = useAuthStore(state => state.restoreSessionMetadata);
  const updateUser = useAuthStore(state => state.updateUser);
  const markSessionChecked = useAuthStore(state => state.markSessionChecked);

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isSessionChecked,
      hasValidSession,
      lastVerifiedSessionAt,
      offlineAccessUntil,
      logout,
      setAuth,
      hydrateOfflineAuth,
      setHasValidSession,
      restoreSessionMetadata,
      updateUser,
      markSessionChecked,
    }),
    [
      user,
      isAuthenticated,
      isSessionChecked,
      hasValidSession,
      lastVerifiedSessionAt,
      offlineAccessUntil,
      logout,
      setAuth,
      hydrateOfflineAuth,
      setHasValidSession,
      restoreSessionMetadata,
      updateUser,
      markSessionChecked,
    ]
  );
};
