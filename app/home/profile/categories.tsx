import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  createCategory,
  deleteCategory,
  getCategories,
  setDefaultCategory,
} from '@/api/categories';
import { ThemedText } from '@/components/themed-text';
import { BlockingModal, BlockingState } from '@/components/ui/BlockingModal';
import { useOffline } from '@/context/OfflineContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import type { Category } from '@/types';

import {
  HOME_BOTTOM_BAR_CLEARANCE,
  HOME_CONTENT_PADDING_H,
} from '@/components/home/layout/spacing';

// Importing components directly from their files
import { AddCategoryInput } from '@/components/home/settings/AddCategoryInput';
import { CategoryList } from '@/components/home/settings/CategoryList';
import { CategoryTabs } from '@/components/home/settings/CategoryTabs';

const categoryKey = ['categories'];
const getCategoryId = (cat: Category) => cat._id ?? cat.id ?? '';
const DEFAULT_CATEGORY_LIMIT = 10;

export default function SettingsScreen() {
  const { isAuthenticated } = useAuth();
  const { resolvedTheme, colors } = useAppTheme();
  const { offlineMode, capabilities } = useOffline();
  const queryClient = useQueryClient();
  const [fixedHeaderHeight, setFixedHeaderHeight] = useState(0);

  // State
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [newCategoryName, setNewCategoryName] = useState('');

  const [blockingState, setBlockingState] = useState<BlockingState>('idle');
  const [blockingMessage, setBlockingMessage] = useState<string | undefined>(undefined);

  // Data Fetching
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: categoryKey,
    queryFn: getCategories,
    // Offline: local categories will be used later.
    enabled: isAuthenticated && !offlineMode,
  });

  // Derived State
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const limit = data?.limit ?? DEFAULT_CATEGORY_LIMIT;

  const incomeCategories = useMemo(
    () => categories.filter(item => item.type === 'income'),
    [categories]
  );
  const expenseCategories = useMemo(
    () => categories.filter(item => item.type === 'expense'),
    [categories]
  );

  const defaultIncomeId =
    incomeCategories.find(c => c.isDefault)?._id ??
    incomeCategories.find(c => c.isDefault)?.id;

  const defaultExpenseId =
    expenseCategories.find(c => c.isDefault)?._id ??
    expenseCategories.find(c => c.isDefault)?.id;

  const currentList = activeTab === 'income' ? incomeCategories : expenseCategories;
  const currentDefaultId = activeTab === 'income' ? defaultIncomeId : defaultExpenseId;
  const isFull = currentList.length >= limit;
  const currentCount = currentList.length;
  const normalizedNewName = newCategoryName.trim().toLowerCase();
  const isDuplicateName =
    normalizedNewName.length > 0 &&
    currentList.some(item => item.name.trim().toLowerCase() === normalizedNewName);

  // Mutations
  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onMutate: () => {
      setBlockingState('loading');
      setBlockingMessage('Deleting category...');
    },
    onSuccess: () => {
      setBlockingState('success');
      setBlockingMessage('Deleted!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        queryClient.invalidateQueries({ queryKey: categoryKey });
      }, 1000);
    },
    onError: (error: any) => {
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message
        || error?.response?.data?.message
        || 'Failed to delete category.';
      setBlockingMessage(msg);
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultCategory,
    onMutate: () => {
      setBlockingState('loading');
      setBlockingMessage('Updating default...');
    },
    onSuccess: () => {
      setBlockingState('success');
      setBlockingMessage('Default updated!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        queryClient.invalidateQueries({ queryKey: categoryKey });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }, 1000);
    },
    onError: (error: any) => {
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message
        || error?.response?.data?.message
        || 'Failed to set default.';
      setBlockingMessage(msg);
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCategory({
        name: newCategoryName.trim(),
        type: activeTab,
      }),
    onMutate: () => {
      setBlockingState('loading');
      setBlockingMessage('Adding category...');
    },
    onSuccess: () => {
      setBlockingState('success');
      setBlockingMessage('Added!');
      setTimeout(() => {
        setBlockingState('idle');
        setBlockingMessage(undefined);
        setNewCategoryName('');
        queryClient.invalidateQueries({ queryKey: categoryKey });
      }, 1000);
    },
    onError: (error: any) => {
      setBlockingState('error');
      const msg = error?.response?.data?.error?.message
        || error?.response?.data?.message
        || 'Failed to add category.';
      setBlockingMessage(msg);
    }
  });

  // Handlers
  const handleDelete = (category: Category) => {
    const id = getCategoryId(category);
    if (!id || category.isDefault) return;
    deleteMutation.mutate(id);
  };

  const handleSetDefault = (category: Category) => {
    const id = getCategoryId(category);
    if (!id || id === currentDefaultId) return;
    setDefaultMutation.mutate(id);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim() || isFull) return;
    if (isDuplicateName) {
      Alert.alert('Duplicate category', 'That category already exists for this type.');
      return;
    }
    createMutation.mutate();
  };

  const deletingId = deleteMutation.isPending ? deleteMutation.variables : undefined;

  const isDark = resolvedTheme === 'dark';
  const headerBlurIntensity = isDark ? 30 : 22;

  if (offlineMode || !capabilities.canManageCategories) {
    // Offline: Category management is blocked entirely.
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.screen}
      >
        <View style={styles.screen}>
          <View
            style={styles.fixedHeader}
            onLayout={event => setFixedHeaderHeight(event.nativeEvent.layout.height)}
          >
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: fixedHeaderHeight + 24,
                paddingBottom: HOME_BOTTOM_BAR_CLEARANCE,
              },
            ]}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.blockedCard,
                { backgroundColor: colors.surfaceGlassThick, borderColor: colors.borderGlass },
              ]}
            >
              <ThemedText style={[styles.blockedTitle, { color: colors.textMain }]}>
                Unavailable offline
              </ThemedText>
              <ThemedText style={[styles.blockedBody, { color: colors.textMuted }]}>
                Category management will be available when you are back online.
              </ThemedText>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <View
        style={styles.fixedHeader}
        onLayout={event => setFixedHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View style={[styles.blurredControls, { paddingHorizontal: HOME_CONTENT_PADDING_H }]}>
          <BlurView
            intensity={headerBlurIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View>
            {/* Header */}
            <View style={styles.headerRow}>
              {createMutation.isPending && <ActivityIndicator size="small" />}
            </View>

            {/* Error Message */}
            {isError && (
              <TouchableOpacity
                onPress={() => refetch()}
                style={[
                  styles.errorBox,
                  {
                    backgroundColor:
                      resolvedTheme === 'dark'
                        ? 'rgba(239, 68, 68, 0.16)'
                        : 'rgba(231,76,60,0.1)',
                    borderColor:
                      resolvedTheme === 'dark'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(231,76,60,0.2)',
                  },
                ]}>
                <ThemedText style={[styles.errorText, { color: '#ef4444' }]}>
                  Failed to load categories. Tap to retry.
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Tab Selection */}
            <CategoryTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              incomeCount={incomeCategories.length}
              expenseCount={expenseCategories.length}
              maxCount={limit}
            />

            {/* Input Field */}
            <AddCategoryInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              onAdd={handleCreateCategory}
              activeTab={activeTab}
              isFull={isFull}
              isLoading={createMutation.isPending}
              currentCount={currentCount}
              maxCount={limit}
              isDuplicate={isDuplicateName}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: fixedHeaderHeight + 4,
            paddingBottom: HOME_BOTTOM_BAR_CLEARANCE,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CategoryList
          data={currentList}
          activeTab={activeTab}
          isLoading={isLoading}
          defaultId={currentDefaultId}
          deletingId={deletingId}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
        />
      </ScrollView>
      <BlockingModal
        state={blockingState}
        message={blockingMessage}
        onClose={() => setBlockingState('idle')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  blurredControls: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 0,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  errorText: {
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingHorizontal: HOME_CONTENT_PADDING_H,
  },
  blockedCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  blockedTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  blockedBody: {
    textAlign: 'center',
  },
});
