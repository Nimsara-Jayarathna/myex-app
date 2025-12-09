import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { login, register, getSession } from '@/api/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/useAuth';
import type { AuthMode } from '@/types';

export default function AuthScreen() {
  const router = useRouter();
  const { setAuth, isAuthenticated, isSessionChecked, logout, markSessionChecked } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: getSession,
    enabled: !isSessionChecked,
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.data?.user) {
      setAuth(sessionQuery.data);
      markSessionChecked();
    } else if (sessionQuery.isSuccess) {
      markSessionChecked();
      logout();
    }
  }, [logout, markSessionChecked, sessionQuery.data, sessionQuery.isSuccess, setAuth]);

  useEffect(() => {
    if (sessionQuery.isError) {
      markSessionChecked();
      logout();
    }
  }, [logout, markSessionChecked, sessionQuery.isError]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: data => {
      setAuth(data);
      setErrorMessage(null);
      router.replace('/(tabs)');
    },
    onError: () => setErrorMessage('Invalid email or password'),
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: data => {
      setAuth(data);
      setErrorMessage(null);
      router.replace('/(tabs)');
    },
    onError: () => setErrorMessage('Unable to create account'),
  });

  const activeMutation = mode === 'login' ? loginMutation : registerMutation;
  const isLoading = activeMutation.isPending || (sessionQuery.isLoading && !isSessionChecked);

  const modalCopy = useMemo(
    () => ({
      title: mode === 'login' ? 'Welcome back' : 'Create your MyEx account',
      subtitle:
        mode === 'login'
          ? 'Access your personalized dashboard, insights, and saved categories.'
          : 'Set up your profile and start tracking smarter within seconds.',
    }),
    [mode]
  );

  const handleSubmit = () => {
    const trimmed = {
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      email: formState.email.trim(),
      password: formState.password.trim(),
    };

    if (!trimmed.email || !trimmed.password) {
      setErrorMessage('Email and password are required');
      return;
    }

    if (mode === 'login') {
      activeMutation.reset();
      loginMutation.mutate({
        email: trimmed.email,
        password: trimmed.password,
      });
    } else {
      if (!trimmed.firstName || !trimmed.lastName) {
        setErrorMessage('Please add your first and last name');
        return;
      }
      activeMutation.reset();
      registerMutation.mutate({
        email: trimmed.email,
        password: trimmed.password,
        fname: trimmed.firstName,
        lname: trimmed.lastName,
      });
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
    setErrorMessage(null);
    setFormState(prev => ({
      ...prev,
      ...(nextMode === 'login' ? { firstName: '', lastName: '' } : {}),
    }));
    loginMutation.reset();
    registerMutation.reset();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          MyEx
        </ThemedText>
        <ThemedText style={styles.tagline}>
          Everything you earn and spend, beautifully organized.
        </ThemedText>

        <View style={styles.modeRow}>
          <ModeButton label="Log in" active={mode === 'login'} onPress={() => switchMode('login')} />
          <ModeButton
            label="Create account"
            active={mode === 'register'}
            onPress={() => switchMode('register')}
          />
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            {modalCopy.title}
          </ThemedText>
          <ThemedText style={styles.cardSubtitle}>{modalCopy.subtitle}</ThemedText>

          {mode === 'register' && (
            <View style={styles.row}>
              <TextInput
                placeholder="First name"
                style={[styles.input, styles.inputHalf]}
                value={formState.firstName}
                autoCapitalize="words"
                onChangeText={value => setFormState(current => ({ ...current, firstName: value }))}
              />
              <TextInput
                placeholder="Last name"
                style={[styles.input, styles.inputHalf]}
                value={formState.lastName}
                autoCapitalize="words"
                onChangeText={value => setFormState(current => ({ ...current, lastName: value }))}
              />
            </View>
          )}

          <TextInput
            placeholder="Email"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formState.email}
            onChangeText={value => setFormState(current => ({ ...current, email: value }))}
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            value={formState.password}
            onChangeText={value => setFormState(current => ({ ...current, password: value }))}
          />

          {errorMessage ? (
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                {mode === 'login' ? 'Log in' : 'Create account'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const ModeButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}>
      <ThemedText style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    textAlign: 'center',
    marginBottom: 24,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modeButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  modeButtonText: {
    fontSize: 14,
  },
  modeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  card: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardSubtitle: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  inputHalf: {
    flex: 1,
  },
  errorText: {
    marginTop: 4,
    marginBottom: 8,
    color: '#e74c3c',
  },
  primaryButton: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

