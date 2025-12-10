import React, { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedView } from '@/components/themed-view';

type HomeBackgroundProps = {
  children: ReactNode;
};

export function HomeBackground({ children }: HomeBackgroundProps) {
  return (
    <ThemedView style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(52,152,219,0.22)', 'transparent']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(46,204,113,0.18)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.8, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f4f6fb',
  },
});
