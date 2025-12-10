import React, { type ReactNode } from 'react';

type AuthProviderProps = {
  children: ReactNode;
};

// Wrapper for future context needs; currently auth state
// is handled via the Zustand store in `auth-store` and `useAuth`.
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}

