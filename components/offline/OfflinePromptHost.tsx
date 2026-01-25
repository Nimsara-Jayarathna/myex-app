import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BlockingModal } from '@/components/ui/BlockingModal';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';

export const OfflinePromptHost: React.FC = () => {
  const { colors } = useAppTheme();
  const {
    prompt,
    isPromptRetrying,
    confirmOfflineMode,
    retryConnection,
    promptBlockingState,
    promptBlockingMessage,
    resetPromptBlockingState,
  } = useOffline();

  const reason = useMemo(
    () => prompt.reason || 'Connection lost.',
    [prompt.reason]
  );

  return (
    <Modal
      visible={prompt.visible}
      transparent
      animationType="slide"
      onRequestClose={() => { }}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface1, borderColor: colors.borderSoft }]}>
          <ThemedText style={styles.title}>Connection issue</ThemedText>
          <ThemedText style={[styles.body, { color: colors.textMuted }]}>
            {reason}
          </ThemedText>
          <ThemedText style={[styles.body, { color: colors.textMuted }]}>
            {prompt.allowOffline
              ? 'Continue in offline mode or retry to reconnect.'
              : 'Please go online to continue.'}
          </ThemedText>

          <View style={styles.actions}>
            <Pressable
              onPress={retryConnection}
              style={[styles.button, styles.retryButton, { borderColor: colors.borderSoft }]}
              accessibilityRole="button"
              accessibilityLabel={prompt.primaryLabel}
              disabled={isPromptRetrying}
            >
              <ThemedText style={[styles.buttonText, { color: colors.textMain }]}>
                {prompt.primaryLabel}
              </ThemedText>
            </Pressable>
            {prompt.allowOffline ? (
              <Pressable
                onPress={confirmOfflineMode}
                style={[styles.button, styles.offlineButton, { backgroundColor: colors.primaryAccent }]}
                accessibilityRole="button"
                accessibilityLabel="Continue offline"
              >
                <ThemedText style={styles.offlineButtonText}>Go offline</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <BlockingModal
        state={promptBlockingState}
        message={promptBlockingMessage}
        onClose={resetPromptBlockingState}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    borderWidth: 1,
  },
  offlineButton: {
  },
  buttonText: {
    fontWeight: '600',
  },
  offlineButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
