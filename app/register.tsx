import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { register } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { HomeBackground } from './home/_components/HomeBackground';

// Enable animations for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const accentColor = '#3498db';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: data => {
      setAuth(data);
      setErrorMessage(null);
      router.replace('/home');
    },
    onError: () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorMessage('Unable to create account. Email might be in use.');
    },
  });

  const isLoading = registerMutation.isPending;

  const handleSubmit = () => {
    const trimmed = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password.trim(),
    };

    if (!trimmed.firstName || !trimmed.lastName || !trimmed.email || !trimmed.password) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setErrorMessage(null);
    registerMutation.mutate({
      email: trimmed.email,
      password: trimmed.password,
      fname: trimmed.firstName,
      lname: trimmed.lastName,
    });
  };

  return (
    <HomeBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            
            {/* --- Header --- */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="person-add-alt-1" size={30} color="#fff" />
              </View>
              <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
              <ThemedText style={styles.subtitle}>
                Start tracking your finances in seconds.
              </ThemedText>
            </View>

            {/* --- Card Form --- */}
            <View style={styles.card}>
              
              {/* Error Banner */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <MaterialIcons name="error-outline" size={20} color="#c0392b" />
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              )}

              {/* Row: First & Last Name */}
              <View style={styles.row}>
                <View style={styles.fieldGroupHalf}>
                  <ThemedText style={styles.label}>First Name</ThemedText>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Alex"
                      placeholderTextColor="#bdc3c7"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroupHalf}>
                  <ThemedText style={styles.label}>Last Name</ThemedText>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Doe"
                      placeholderTextColor="#bdc3c7"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Email Address</ThemedText>
                <View style={styles.inputWrapper}>
                  <MaterialIcons 
                    name="mail-outline" 
                    size={20} 
                    color="#95a5a6"
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#bdc3c7"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <View style={styles.inputWrapper}>
                  <MaterialIcons 
                    name="lock-outline" 
                    size={20} 
                    color="#95a5a6"
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#bdc3c7"
                    secureTextEntry
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.btnContent}>
                    <ThemedText style={styles.primaryButtonText}>Sign Up</ThemedText>
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>

            </View>

            {/* --- Footer --- */}
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Already have an account?</ThemedText>
              <Pressable onPress={() => router.navigate('/login')} style={{ padding: 4 }}>
                <ThemedText style={styles.footerLink}>Log in</ThemedText>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </HomeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // --- Header ---
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: accentColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ rotate: '-5deg' }],
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#2c3e50',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#7f8c8d',
    maxWidth: '80%',
  },

  // --- Card ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 24,
  },
  
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  fieldGroupHalf: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
    marginLeft: 4,
  },
  
  // Input Styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: accentColor,
    backgroundColor: '#fff',
    shadowColor: accentColor,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
    height: '100%',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcebe6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // Button
  primaryButton: {
    height: 54,
    backgroundColor: accentColor,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  footerLink: {
    color: accentColor,
    fontWeight: '700',
    fontSize: 14,
  },
});
