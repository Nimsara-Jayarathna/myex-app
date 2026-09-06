import * as Crypto from 'expo-crypto';

export const createClientId = () => Crypto.randomUUID();
