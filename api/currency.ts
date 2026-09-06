import type { Currency } from '@/types';
import { API_VERSION, apiClient } from './client';

export const getCurrencies = async () => {
    const { data } = await apiClient.get<
        { currencies: Currency[] } | { data: { currencies: Currency[] } }
    >(`/api/${API_VERSION}/currencies`);

    // Handle nested data structure (e.g. { success: true, data: { currencies: [...] } })
    if ('data' in data && data.data?.currencies) {
        return data.data.currencies;
    }

    // Handle flat structure (e.g. { currencies: [...] })
    if ('currencies' in data && data.currencies) {
        return data.currencies;
    }

    return [];
};

export const updateUserCurrency = async (currencyId: string) => {
    const { data } = await apiClient.put<
        { currency: Currency; message: string } | { data: { currency: Currency }; message: string }
    >(`/api/${API_VERSION}/users/currency`, { currencyId });

    if ('data' in data && data.data?.currency) {
        return data.data.currency;
    }

    if ('currency' in data) {
        return data.currency;
    }

    throw new Error('Unexpected response format from update currency');
};
