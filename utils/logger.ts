import { redactSensitive } from '@/utils/redact';

type LogPayload = Record<string, unknown> | undefined;

export const logDebug = (message: string, data?: LogPayload) => {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(`[debug] ${message}`, redactSensitive(data));
    return;
  }
  console.log(`[debug] ${message}`);
};

export const logError = (message: string, error?: unknown) => {
  if (!__DEV__) {
    console.error(`[error] ${message}`);
    return;
  }
  if (error !== undefined) {
    console.error(`[error] ${message}`, redactSensitive(error));
    return;
  }
  console.error(`[error] ${message}`);
};
