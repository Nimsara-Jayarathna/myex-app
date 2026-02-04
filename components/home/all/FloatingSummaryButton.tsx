import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';
import { Transaction } from '@/types';

interface FloatingSummaryButtonProps {
  transactions: Transaction[];
  visible: boolean; // To control visibility of the FAB itself based on scroll or other logic if needed
}

const FAB_SIZE = 56;
const PADDING = 20;

export function FloatingSummaryButton({ transactions, visible = true }: FloatingSummaryButtonProps) {
  const { colors, resolvedTheme } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  // Animation values
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(visible ? 1 : 0);
  }, [visible, scale]);

  // Recalculate stats when expanded or transactions change
  useEffect(() => {
    if (isExpanded) {
      setCalculating(true);
      // Small artificial delay for the "animation" feel and to allow UI to settle
      const timer = setTimeout(() => {
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);

        const expense = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);

        setStats({
          income,
          expense,
          balance: income - expense
        });
        setCalculating(false);
      }, 50); // Reduced from 500ms to 50ms for snappier feel
      return () => clearTimeout(timer);
    }
  }, [isExpanded, transactions]);

  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  const isDark = resolvedTheme === 'dark';
  const glassBg = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const fabBg = colors.primaryAccent;

  const successColor = '#10b981';
  const errorColor = '#ef4444';

  // Format helper
  const format = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <>
      <Animated.View style={[styles.fabContainer, fabStyle]}>
        <Pressable
          style={[styles.fab, { backgroundColor: fabBg, shadowColor: colors.borderStrong }]}
          onPress={handlePress}
        >
          <MaterialCommunityIcons name="chart-box-outline" size={26} color="#FFF" />
        </Pressable>
      </Animated.View>

      {isExpanded && (
        <View style={styles.overlayContainer}>
          {/* Backdrop */}
          <Pressable style={styles.backdrop} onPress={handleClose}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.backdropFill}
            >
              <BlurView
                intensity={15}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              {/* Optional slight dimming on top of blur */}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)' }]} />
            </Animated.View>
          </Pressable>

          {/* Summary Card */}
          <Animated.View
            entering={FadeIn.springify().damping(18).stiffness(150)}
            exiting={FadeOut.duration(150)}
            style={styles.cardWrapper}
          >
            <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
              <View style={[styles.cardContent, { backgroundColor: glassBg, borderColor: colors.borderGlass }]}>
                <View style={styles.header}>
                  <ThemedText type="subtitle" style={styles.title}>Summary</ThemedText>
                  {calculating && <ActivityIndicator size="small" color={colors.primaryAccent} />}
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <View style={styles.item}>
                    <ThemedText style={[styles.label, { color: colors.textMuted }]}>Net Income</ThemedText>
                    <ThemedText style={[styles.value, { color: successColor }]}>
                      {calculating ? '...' : format(stats.income)}
                    </ThemedText>
                  </View>
                  <View style={styles.item}>
                    <ThemedText style={[styles.label, { color: colors.textMuted }]}>Net Expense</ThemedText>
                    <ThemedText style={[styles.value, { color: errorColor }]}>
                      {calculating ? '...' : format(stats.expense)}
                    </ThemedText>
                  </View>
                  <View style={styles.item}>
                    <ThemedText style={[styles.label, { color: colors.textMuted }]}>Net Balance</ThemedText>
                    <ThemedText style={[styles.value, { color: stats.balance >= 0 ? successColor : errorColor }]}>
                      {calculating ? '...' : format(stats.balance)}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={[styles.footer, { color: colors.textSubtle }]}>
                  Based on {transactions.length} visible transactions
                </ThemedText>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      )}
    </>
  );
}



const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: PADDING + 150, // Raised higher as requested
    right: PADDING,
    zIndex: 100,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  cardWrapper: {
    width: Dimensions.get('window').width - 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 11,
  },
});
