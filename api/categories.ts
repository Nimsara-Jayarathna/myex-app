import { API_VERSION, apiClient, apiRequest } from '@/api/client';
import type { Category } from '@/types';

type CategoryApiShape = Category & {
  _id?: string;
  id?: string;
};

type CategoriesResponse = CategoryApiShape[] | { categories: CategoryApiShape[]; limit?: number };

const normalizeCategory = (category: CategoryApiShape): Category => {
  const identifier = category._id ?? category.id;

  if (!identifier) {
    throw new Error('Category missing identifier');
  }

  return {
    ...category,
    _id: identifier,
    id: identifier,
  };
};

const extractCategories = (data: CategoriesResponse): CategoryApiShape[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (data?.categories) {
    return data.categories;
  }

  return [];
};

const extractCategoriesWithLimit = (
  data: CategoriesResponse
): { categories: CategoryApiShape[]; limit?: number } => {
  if (Array.isArray(data)) {
    return { categories: data };
  }

  if (data?.categories) {
    return {
      categories: data.categories,
      limit: typeof data.limit === 'number' ? data.limit : undefined,
    };
  }

  return { categories: [] };
};

export const getCategories = async () => {
  const { data } = await apiClient.get<CategoriesResponse>(`/api/${API_VERSION}/categories/active`);
  const { categories, limit } = extractCategoriesWithLimit(data);
  return { categories: categories.map(normalizeCategory), limit };
};

export const getAllCategories = async (type?: 'income' | 'expense') => {
  const { data } = await apiClient.get<CategoriesResponse>(`/api/${API_VERSION}/categories/all`, {
    params: type ? { type } : {},
  });
  return extractCategories(data).map(normalizeCategory);
};

export const createCategory = async (payload: Pick<Category, 'name' | 'type'>) => {
  const data = await apiRequest<CategoryApiShape | { category: CategoryApiShape }>(
    {
      method: 'post',
      url: `/api/${API_VERSION}/categories`,
      data: payload,
    },
    { userInitiated: true }
  );

  if (!data) {
    throw new Error('Category response missing');
  }

  if ('category' in data && data.category) {
    return normalizeCategory(data.category);
  }

  return normalizeCategory(data as CategoryApiShape);
};

export const deleteCategory = async (categoryId: string) => {
  await apiRequest(
    {
      method: 'delete',
      url: `/api/${API_VERSION}/categories/${categoryId}`,
    },
    { userInitiated: true }
  );
};

export const setDefaultCategory = async (categoryId: string) => {
  const data = await apiRequest<CategoryApiShape | { category: CategoryApiShape }>(
    {
      method: 'patch',
      url: `/api/${API_VERSION}/categories/${categoryId}`,
      data: { isDefault: true },
    },
    { userInitiated: true }
  );

  if (
    'category' in (data as { category?: CategoryApiShape }) &&
    (data as { category?: CategoryApiShape }).category
  ) {
    return normalizeCategory((data as { category: CategoryApiShape }).category);
  }

  return normalizeCategory(data as CategoryApiShape);
};

