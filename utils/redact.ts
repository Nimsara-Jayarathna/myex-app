const SENSITIVE_KEY = /(?:password|passcode|secret|token|cookie|authorization|otp|session|credential)/i;
const MAX_DEPTH = 5;

const redactStringIfSensitiveHeader = (key: string, value: unknown) => {
  if (SENSITIVE_KEY.test(key)) return '[redacted]';
  return value;
};

export const redactSensitive = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(item => redactSensitive(item, depth + 1));
  if (typeof value !== 'object') return value;

  const output: Record<string, unknown> = {};
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
    const safeValue = redactStringIfSensitiveHeader(key, rawValue);
    output[key] = safeValue === '[redacted]' ? safeValue : redactSensitive(safeValue, depth + 1);
  }
  return output;
};
