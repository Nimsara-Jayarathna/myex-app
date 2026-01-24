import React, { useEffect, useState, useRef } from 'react';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { subscribeSync, type SyncState } from '@/utils/sync-state';

export function SyncOverlay() {
  const [syncState, setSyncState] = useState<SyncState>({ isSyncing: false });
  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [message, setMessage] = useState<string | undefined>(undefined);
  
  // Track previous syncing state to detect completion
  const wasSyncingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeSync((newState) => {
      setSyncState(newState);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // 1. Sync Started
    if (syncState.isSyncing) {
        setBlockingState('loading');
        
        let msg = syncState.message ?? 'Syncing data...';
        if (syncState.progress) {
            msg += `\n(${syncState.progress.current} / ${syncState.progress.total})`;
        }
        setMessage(msg);
        wasSyncingRef.current = true;
    } 
    // 2. Sync Just Finished (True -> False)
    else if (wasSyncingRef.current) {
        wasSyncingRef.current = false;
        setBlockingState('success');
        setMessage('Up to date!');
        
        // Auto-dismiss after delay
        const timer = setTimeout(() => {
            setBlockingState('idle');
            setMessage(undefined);
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [syncState]);

  if (blockingState === 'idle') return null;

  return (
    <BlockingModal 
        state={blockingState}
        message={message}
    />
  );
}
