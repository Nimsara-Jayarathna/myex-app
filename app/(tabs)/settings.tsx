import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';

import {
  createCategory,
  deleteCategory,
  getCategories,
  setDefaultCategory,
} from '@/api/categories';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/useAuth';
import type { Category } from '@/types';

const categoryKey = ['categories'];

export default function SettingsScreen() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [defaultIncomeId, setDefaultIncomeId] = useState('');
  const [defaultExpenseId, setDefaultExpenseId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('income');

  const {
    data: categories,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: categoryKey,
    queryFn: getCategories,
    enabled: isAuthenticated,
    retry: 1,
  });

  const incomeCategories = useMemo(
    () => (categories ?? []).filter(item => item.type === 'income'),
    [categories]
  );

  const expenseCategories = useMemo(
    () => (categories ?? []).filter(item => item.type === 'expense'),
    [categories]
  );

  const resolveCategoryId = (category: Category) => category._id ?? category.id ?? '';

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKey });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (categoryId: string) => setDefaultCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKey });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCategory({
        name: newCategoryName.trim(),
        type: newCategoryType,
      }),
    onSuccess: () => {
      setNewCategoryName('');
      queryClient.invalidateQueries({ queryKey: categoryKey });
    },
  });

  useEffect(() => {
    const incomeDefault = incomeCategories.find(item => item.isDefault);
    const expenseDefault = expenseCategories.find(item => item.isDefault);
    setDefaultIncomeId(incomeDefault ? resolveCategoryId(incomeDefault) : '');
    setDefaultExpenseId(expenseDefault ? resolveCategoryId(expenseDefault) : '');
  }, [categories, expenseCategories, incomeCategories]);

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Log in on the web first to manage your categories.
        </ThemedText>
      </ThemedView>
    );
  }

  const handleDelete = (category: Category) => {
    const identifier = resolveCategoryId(category);
    if (!identifier) {
      return;
    }

    Alert.alert('Delete category', `Remove "${category.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(identifier),
      },
    ]);
  };

  const handleSetDefault = (category: Category) => {
    const identifier = resolveCategoryId(category);
    if (!identifier) {
      return;
    }

    if (category.type === 'income') {
      if (identifier === defaultIncomeId) return;
      setDefaultIncomeId(identifier);
    } else {
      if (identifier === defaultExpenseId) return;
      setDefaultExpenseId(identifier);
    }

    setDefaultMutation.mutate(identifier);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      return;
    }
    createMutation.mutate();
  };

  const isBusy =
    isLoading || isFetching || deleteMutation.isPending || setDefaultMutation.isPending;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Settings
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Manage your income and expense categories. These mirror the web dashboard settings.
      </ThemedText>

      {isError && (
        <View style={styles.center}>
          <ThemedText>Unable to load categories.</ThemedText>
          <ThemedText style={styles.linkText} onPress={() => refetch()}>
            Tap to retry
          </ThemedText>
        </View>
      )}

      {isBusy && (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Add category
        </ThemedText>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Category name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <ThemedText
            style={styles.typeToggle}
            onPress={() =>
              setNewCategoryType(current => (current === 'income' ? 'expense' : 'income'))
            }>
            {newCategoryType === 'income' ? 'Income' : 'Expense'}
          </ThemedText>
          <ThemedText style={styles.addButton} onPress={handleCreateCategory}>
            Add
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Income categories
        </ThemedText>
        <FlatList
          data={incomeCategories}
          keyExtractor={item => resolveCategoryId(item)}
          renderItem={({ item }) => (
            <CategoryRow
              category={item}
              isDefault={resolveCategoryId(item) === defaultIncomeId}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Expense categories
        </ThemedText>
        <FlatList
          data={expenseCategories}
          keyExtractor={item => resolveCategoryId(item)}
          renderItem={({ item }) => (
            <CategoryRow
              category={item}
              isDefault={resolveCategoryId(item) === defaultExpenseId}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          )}
        />
      </View>
    </ThemedView>
  );
}

const CategoryRow = ({
  category,
  isDefault,
  onDelete,
  onSetDefault,
}: {
  category: Category;
  isDefault: boolean;
  onDelete: (category: Category) => void;
  onSetDefault: (category: Category) => void;
}) => {
  return (
    <View style={styles.categoryRow}>
      <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
      <View style={styles.categoryActions}>
        <ThemedText
          style={[styles.categoryAction, isDefault && styles.categoryActionActive]}
          onPress={() => onSetDefault(category)}>
          {isDefault ? 'Default' : 'Set default'}
        </ThemedText>
        <ThemedText
          style={[styles.categoryAction, styles.deleteText]}
          onPress={() => onDelete(category)}>
          Delete
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  linkText: {
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  typeToggle: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3498db',
    color: '#fff',
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  categoryName: {
    fontSize: 16,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryAction: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  categoryActionActive: {
    fontWeight: '600',
  },
  deleteText: {
    color: '#e74c3c',
  },
});

