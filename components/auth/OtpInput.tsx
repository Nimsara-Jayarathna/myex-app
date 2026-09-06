import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';

type OtpInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  autoFocus = false,
  disabled = false,
  accessibilityLabel = 'Verification code',
}: OtpInputProps) {
  const { colors } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const digits = value.slice(0, length).split('');

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  const handleChange = (nextValue: string) => {
    onChangeText(nextValue.replace(/\D/g, '').slice(0, length));
  };

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to enter the verification code"
      style={styles.container}
    >
      <View style={styles.boxRow} importantForAccessibility="no-hide-descendants">
        {Array.from({ length }, (_, index) => {
          const digit = digits[index] ?? '';
          const isActive = index === Math.min(value.length, length - 1) && value.length < length;
          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: digit || isActive ? colors.primaryAccent : colors.inputBorder,
                  borderWidth: digit || isActive ? 2 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.digit, { color: colors.textMain }]}>{digit}</ThemedText>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        editable={!disabled}
        textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : undefined}
        importantForAutofill="yes"
        accessibilityLabel={accessibilityLabel}
        style={styles.realInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%' },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1,
    aspectRatio: 0.92,
    maxWidth: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 22, fontWeight: '800' },
  realInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
  },
});
