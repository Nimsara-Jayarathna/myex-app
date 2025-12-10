import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; // Added icon for visual cue
import { ThemedText } from '@/components/themed-text';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onAdd: () => void;
  activeTab: 'income' | 'expense';
  isFull: boolean;
  isLoading: boolean;
};

export function AddCategoryInput({
  value,
  onChangeText,
  onAdd,
  activeTab,
  isFull,
  isLoading,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  
  const isDisabled = !value.trim() || isFull || isLoading;

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputWrapperFocused,
        isFull && styles.inputWrapperDisabled
      ]}>
        
        {/* Input Field */}
        <TextInput
          style={[styles.input, isFull && styles.inputTextDisabled]}
          placeholder={isFull ? "Limit reached" : `Add ${activeTab} category...`}
          placeholderTextColor="#95a5a6"
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
            isDisabled ? styles.iconButtonDisabled : styles.iconButtonActive
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
              color={isDisabled ? "#bdc3c7" : "#fff"} 
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Warning Banner */}
      {isFull && (
        <View style={styles.warningBanner}>
          <MaterialIcons name="error-outline" size={16} color="#d35400" />
          <ThemedText style={styles.warningText}>
            Maximum of 10 {activeTab} categories reached.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  // Unified Wrapper matches modern "Chat Input" style
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputWrapperFocused: {
    borderColor: '#3498db',
    backgroundColor: '#fdfdfd',
    shadowOpacity: 0.12,
  },
  inputWrapperDisabled: {
    backgroundColor: '#f4f6f7',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 8,
    height: 44, // Touch target height
  },
  inputTextDisabled: {
    color: '#bdc3c7',
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
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButtonDisabled: {
    backgroundColor: '#f0f2f5',
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