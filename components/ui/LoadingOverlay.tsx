import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { ThemedText } from '../themed-text';

interface Props {
  message?: string;
}

export function LoadingOverlay({ message }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primaryAccent} />
      {message && (
        <ThemedText style={[styles.message, { color: colors.textMuted }]}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    // Optional: add a slight background if needed, but usually transparent or simple fill works
    // backgroundColor: 'rgba(255, 255, 255, 0.5)', 
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
