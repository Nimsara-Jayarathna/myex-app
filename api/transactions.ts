import { API_VERSION, apiClient, apiRequest } from '@/api/client';
import type { SummaryResponse, Transaction, TransactionInput } from '@/types';

type TransactionApiShape = Transaction & {
  _id?: string;
  id?: string;
  category?: Transaction['category'];
  title?: string;
};

type TransactionsResponse = TransactionApiShape[] | { transactions: TransactionApiShape[] };

type PaginatedTransactionsResponse = {
  transactions: TransactionApiShape[];
  page?: number;
  pageSize?: number;
  total?: number;
};

const normalizeTransaction = (transaction: TransactionApiShape): Transaction => {
  const identifier = transaction._id ?? transaction.id;
  const category =
    typeof transaction.category === 'string'
      ? transaction.category
      : transaction.category;

  return {
    ...transaction,
    _id: identifier,
    id: identifier,
    category,
    categoryName: transaction.categoryName ?? (typeof category === 'string' ? category : undefined),
    title: transaction.title ?? (typeof category === 'string' ? category : transaction.title),
  };
};

const extractTransactions = (data: TransactionsResponse): TransactionApiShape[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if ((data as PaginatedTransactionsResponse)?.transactions) {
    return (data as PaginatedTransactionsResponse).transactions;
  }

  return [];
};

export const getTransactions = async () => {
  const { data } = await apiClient.get<TransactionsResponse>(`/api/${API_VERSION}/transactions`);
  return extractTransactions(data).map(normalizeTransaction);
};

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  category?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const getTransactionsFiltered = async (filters: TransactionFilters = {}) => {
  const { data } = await apiClient.get<TransactionsResponse | PaginatedTransactionsResponse>(
    `/api/${API_VERSION}/transactions`,
    {
      params: {
        ...filters,
      },
    }
  );

  return {
    transactions: extractTransactions(data).map(normalizeTransaction),
    total: (data as PaginatedTransactionsResponse)?.total,
    page: (data as PaginatedTransactionsResponse)?.page,
    pageSize: (data as PaginatedTransactionsResponse)?.pageSize,
  };
};

export const createTransaction = async (payload: TransactionInput) => {
  const data = await apiRequest<TransactionApiShape | { transaction: TransactionApiShape }>(
    {
      method: 'post',
      url: `/api/${API_VERSION}/transactions`,
      data: payload,
    },
    { userInitiated: true }
  );

  if (!data) {
    throw new Error('Transaction response missing');
  }

  if ('transaction' in data && data.transaction) {
    return normalizeTransaction(data.transaction);
  }

  return normalizeTransaction(data as TransactionApiShape);
};

const resolveTimezoneHeader = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const deleteTransaction = async (id: string) => {
  await apiRequest(
    {
      method: 'delete',
      url: `/api/${API_VERSION}/transactions/${id}`,
      headers: {
        'X-Timezone': resolveTimezoneHeader(),
      },
    },
    { userInitiated: true }
  );
};

export const getTransactionSummary = async () => {
  const { data } = await apiClient.get<SummaryResponse>(`/api/${API_VERSION}/transactions/summary`);
  return data;
};
