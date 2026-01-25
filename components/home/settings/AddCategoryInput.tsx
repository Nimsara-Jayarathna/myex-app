import { useAppTheme } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; // Added icon for visual cue
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
  activeTab: 'income' | 'expense';
  isFull: boolean;
  isLoading: boolean;
  currentCount: number;
  maxCount: number;
  isDuplicate: boolean;
};

export function AddCategoryInput({
  value,
  onChangeText,
  onAdd,
  activeTab,
  isFull,
  isLoading,
  currentCount,
  maxCount,
  isDuplicate,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useAppTheme();

  const isDisabled = !value.trim() || isFull || isLoading || isDuplicate;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.surface1, borderColor: colors.borderSoft, shadowColor: colors.textMain },
          isFocused && [styles.inputWrapperFocused, { borderColor: colors.primaryAccent }],
          isFull && [styles.inputWrapperDisabled, { backgroundColor: colors.surface2 }],
        ]}>

        {/* Input Field */}
        <TextInput
          style={[
            styles.input,
            { color: colors.textMain },
            isFull && { color: colors.textSubtle },
          ]}
          placeholder={
            isFull
              ? `Limit reached (${currentCount}/${maxCount})`
              : isDuplicate
                ? 'Category already exists'
                : `Add ${activeTab} category (${currentCount}/${maxCount})...`
          }
          placeholderTextColor={colors.textSubtle}
          value={value}
          onChangeText={onChangeText}

          // --- KEYBOARD UX IMPROVEMENTS ---
          returnKeyType="done"
          onSubmitEditing={() => {
            if (!isDisabled) onAdd();
          }}
          // KEEPS KEYBOARD OPEN after adding, so you can add another immediately
          blurOnSubmit={false}
          // iOS: Don't let them hit 'Done' if empty
          enablesReturnKeyAutomatically={true}
          // iOS: 'X' button to clear text
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="sentences"
          // --------------------------------

          editable={!isFull && !isLoading}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Add Button (Inside the wrapper for a unified look) */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            isDisabled
              ? [styles.iconButtonDisabled, { backgroundColor: colors.surface2 }]
              : [
                styles.iconButtonActive,
                {
                  backgroundColor: colors.primaryAccent,
                  shadowColor: colors.primaryAccent,
                },
              ],
          ]}
          onPress={onAdd}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons
              name="add"
              size={24}
              color={isDisabled ? colors.textSubtle : "#fff"}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Warning Banner removed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  // Unified Wrapper matches modern "Chat Input" style
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    // Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputWrapperFocused: {
    shadowOpacity: 0.12,
  },
  inputWrapperDisabled: {
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    height: 44, // Touch target height
  },
  inputTextDisabled: {
  },
  // Circle Button Style
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  iconButtonActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButtonDisabled: {
  },

  // Warning Banner
  warningBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(230, 126, 34, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 126, 34, 0.15)',
  },
  warningText: {
    fontSize: 12,
    color: '#d35400',
    fontWeight: '600',
    flex: 1,
  },
});
