import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { refreshSession } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { BlockingState } from '@/components/ui/BlockingModal';
import { registerOfflinePrompt, type OfflinePromptPayload } from '@/utils/offline-prompt';

export type Capabilities = {
  canAdd: boolean;
  canSelectCategory: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canManageCategories: boolean;
  canAccessMainSections: boolean;
  canAccessProfileSettings: boolean;
};

const SESSION_CACHE_KEY = 'has_valid_session';

type OfflineContextValue = {
  offlineMode: boolean;
  networkConnected: boolean;
  setOfflineMode: (next: boolean) => void;
  promptToGoOffline: (
    reason: string,
    onRetry?: () => Promise<void>,
    options?: { allowOffline?: boolean; primaryLabel?: string; onConfirm?: () => void; force?: boolean }
  ) => void;
  prompt: { visible: boolean; reason: string; allowOffline: boolean; primaryLabel: string };
  isPromptRetrying: boolean;
  confirmOfflineMode: () => void;
  retryConnection: () => void;
  tryGoOnline: () => Promise<boolean>;
  reconnectionState: BlockingState;
  reconnectionMessage: string;
  resetReconnectionState: () => void;
  promptBlockingState: BlockingState;
  promptBlockingMessage: string;
  resetPromptBlockingState: () => void;
  isBooting: boolean;
  setIsBooting: (next: boolean) => void;
  capabilities: Capabilities;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export const OfflineProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { setAuth } = useAuth();
  const queryClient = useQueryClient();
  // Offline state combines manual override + device connectivity.
  const [networkConnected, setNetworkConnected] = useState(true);
  const [manualOffline, setManualOffline] = useState(false);
  const [promptState, setPromptState] = useState<{
    visible: boolean;
    reason: string;
    onRetry?: () => Promise<void>;
    allowOffline: boolean;
    primaryLabel: string;
    onConfirm?: () => void;
  }>({ visible: false, reason: '', allowOffline: true, primaryLabel: 'Retry' });
  const [isPromptRetrying, setIsPromptRetrying] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [reconnectionState, setReconnectionState] = useState<BlockingState>('idle');
  const [reconnectionMessage, setReconnectionMessage] = useState<string>('');
  const [promptBlockingState, setPromptBlockingState] = useState<BlockingState>('idle');
  const [promptBlockingMessage, setPromptBlockingMessage] = useState<string>('');
  const lastOfflineRef = useRef(manualOffline);
  const suppressPromptUntilRef = useRef(0);

  const offlineMode = manualOffline;

  const openPrompt = useCallback((
    reason: string,
    onRetry?: () => Promise<void>,
    allowOffline = true,
    primaryLabel = 'Retry',
    onConfirm?: () => void,
    force = false
  ) => {
    if (manualOffline) {
      return;
    }
    if (isBooting && !force) {
      return;
    }
    setPromptState(prev => {
      if (prev.visible && !force) {
        return prev;
      }
      return { visible: true, reason, onRetry, allowOffline, primaryLabel, onConfirm };
    });
  }, [manualOffline, isBooting]);

  const promptToGoOffline = useCallback(
    (
      reason: string,
      onRetry?: () => Promise<void>,
      options?: { allowOffline?: boolean; primaryLabel?: string; onConfirm?: () => void; force?: boolean }
    ) => {
      openPrompt(
        reason,
        onRetry,
        options?.allowOffline ?? true,
        options?.primaryLabel ?? 'Retry',
        options?.onConfirm,
        options?.force ?? false
      );
    },
    [openPrompt]
  );

  const confirmOfflineMode = useCallback(() => {
    if (!promptState.allowOffline) {
      return;
    }
    setManualOffline(true);
    setPromptState(prev => ({ ...prev, visible: false }));
    promptState.onConfirm?.();
  }, [promptState.allowOffline, promptState.onConfirm]);

  const retryConnection = useCallback(async () => {
    if (!promptState.onRetry) {
      setPromptState(prev => ({ ...prev, visible: false }));
      return;
    }

    setIsPromptRetrying(true);
    setPromptBlockingState('loading');
    setPromptBlockingMessage('Checking connection...');
    
    const minWait = new Promise(resolve => setTimeout(resolve, 700));
    try {
      await Promise.all([promptState.onRetry(), minWait]);
      setManualOffline(false);
      setPromptBlockingState('success');
      setPromptBlockingMessage('Connected!');
      
      // Auto-dismiss after success animation
      setTimeout(() => {
        setPromptBlockingState('idle');
        setPromptBlockingMessage('');
        setPromptState(prev => ({ ...prev, visible: false }));
      }, 1500);
    } catch (error) {
      await minWait;
      const message =
        error instanceof Error && error.message === 'AUTH_INVALID'
          ? 'You need to be online to sign in.'
          : 'Still offline. Please check your connection.';
      
      setPromptBlockingState('error');
      setPromptBlockingMessage(message);
      setPromptState(prev => ({
        ...prev,
        reason: message,
        visible: true,
      }));
    } finally {
      setIsPromptRetrying(false);
    }
  }, [promptState.onRetry]);

  const tryGoOnline = useCallback(async () => {
    // Step 1: Start loading
    setReconnectionState('loading');
    setReconnectionMessage('Checking server connection...');
    
    try {
      // Step 2: Health check
      await apiClient.get('/health', { timeout: 5000 });
      
      // Step 3: Refresh session
      setReconnectionMessage('Refreshing your session...');
      const refreshed = await refreshSession();
      
      if (refreshed?.user) {
        setAuth(refreshed);
      }
      
      // Step 4: Success!
      setReconnectionState('success');
      setReconnectionMessage('Successfully reconnected!');
      
      // Auto-dismiss after animation
      setTimeout(() => {
        setReconnectionState('idle');
        setReconnectionMessage('');
      }, 2000);
      
      suppressPromptUntilRef.current = Date.now() + 5000;
      setNetworkConnected(true);
      setManualOffline(false);
      return true;
      
    } catch (error: any) {
      // Step 5: Error handling
      setReconnectionState('error');
      const errorMsg = error?.response?.status === 401
        ? 'Session expired. Please log in again.'
        : error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK'
        ? 'No internet connection. Please check your network.'
        : 'Reconnection failed. Please try again.';
      
      setReconnectionMessage(errorMsg);
      
      // Don't auto-dismiss error - let user close it
      return false;
    }
  }, [setAuth]);

  useEffect(() => {
    if (lastOfflineRef.current && !manualOffline) {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
    lastOfflineRef.current = manualOffline;
  }, [manualOffline, queryClient]);

  useEffect(() => {
    // NetInfo: fast local signal for online/offline mode.
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkConnected(Boolean(state.isConnected));
    });

    const unregister = registerOfflinePrompt((payload: OfflinePromptPayload) => {
      openPrompt(
        payload.reason,
        payload.onRetry,
        payload.allowOffline ?? true,
        payload.primaryLabel ?? 'Retry',
        payload.onConfirm
      );
    });

    return () => {
      unregister();
      unsubscribe();
    };
  }, [openPrompt]);

  useEffect(() => {
    // Surface connection loss without auto-enabling offline mode.
    if (!networkConnected && !manualOffline) {
      if (Date.now() < suppressPromptUntilRef.current) {
        return;
      }
      const checkAndPrompt = async () => {
        const cached = await AsyncStorage.getItem(SESSION_CACHE_KEY);
        const hasValidSession = cached === 'true';
        const reason = hasValidSession
          ? 'Connection lost.'
          : 'You need to be online to sign in.';
        openPrompt(
          reason,
          async () => {
            await apiClient.get('/health', { timeout: 5000 });
          },
          hasValidSession,
          'Retry',
          undefined,
          false
        );
      };
      void checkAndPrompt();
    }
  }, [networkConnected, manualOffline, openPrompt]);

  const capabilities = useMemo<Capabilities>(() => {
    if (offlineMode) {
      return {
        // Offline: allow Add Record flow and profile/settings only.
        canAdd: true,
        canSelectCategory: true,
        canDelete: false,
        canEdit: false,
        canManageCategories: false,
        canAccessMainSections: true, // Today stays visible; other sections are blocked elsewhere.
        canAccessProfileSettings: true,
      };
    }

    // Online: full access.
    return {
      canAdd: true,
      canSelectCategory: true,
      canDelete: true,
      canEdit: true,
      canManageCategories: true,
      canAccessMainSections: true,
      canAccessProfileSettings: true,
    };
  }, [offlineMode]);

  return (
    <OfflineContext.Provider
      value={{
        offlineMode,
        networkConnected,
        setOfflineMode: setManualOffline,
        promptToGoOffline,
        prompt: {
          visible: promptState.visible,
          reason: promptState.reason,
          allowOffline: promptState.allowOffline,
          primaryLabel: promptState.primaryLabel,
        },
        isPromptRetrying,
        confirmOfflineMode,
        retryConnection,
        tryGoOnline,
        reconnectionState,
        reconnectionMessage,
        resetReconnectionState: () => {
          setReconnectionState('idle');
          setReconnectionMessage('');
        },
        promptBlockingState,
        promptBlockingMessage,
        resetPromptBlockingState: () => {
          setPromptBlockingState('idle');
          setPromptBlockingMessage('');
        },
        isBooting,
        setIsBooting,
        capabilities,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
};
