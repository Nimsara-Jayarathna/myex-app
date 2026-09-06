export const DEFAULT_CURRENCY_FRACTION_DIGITS = 2;

export const toMinorUnits = (
  value: number | string,
  fractionDigits = DEFAULT_CURRENCY_FRACTION_DIGITS
): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error('Invalid monetary amount');
  }
  const factor = 10 ** fractionDigits;
  return Math.round((numeric + Number.EPSILON) * factor);
};

export const fromMinorUnits = (
  value: number,
  fractionDigits = DEFAULT_CURRENCY_FRACTION_DIGITS
): number => {
  if (!Number.isSafeInteger(value)) {
    throw new Error('Invalid minor-unit monetary amount');
  }
  return value / 10 ** fractionDigits;
};

export const normalizeMoney = (
  value: number,
  fractionDigits = DEFAULT_CURRENCY_FRACTION_DIGITS
): number => fromMinorUnits(toMinorUnits(value, fractionDigits), fractionDigits);

export const sumMoney = (
  values: Iterable<number>,
  fractionDigits = DEFAULT_CURRENCY_FRACTION_DIGITS
): number => {
  let totalMinor = 0;
  for (const value of values) {
    totalMinor += toMinorUnits(value, fractionDigits);
  }
  return fromMinorUnits(totalMinor, fractionDigits);
};

export const subtractMoney = (
  left: number,
  right: number,
  fractionDigits = DEFAULT_CURRENCY_FRACTION_DIGITS
): number => {
  return fromMinorUnits(
    toMinorUnits(left, fractionDigits) - toMinorUnits(right, fractionDigits),
    fractionDigits
  );
};

export const parsePositiveMoneyInput = (
  value: string,
  fractionDigits = DEFAULT_CURRENCY_FRACTION_DIGITS
): number | null => {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const decimal = trimmed.split('.')[1];
  if (decimal && decimal.length > fractionDigits) return null;

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return normalizeMoney(numeric, fractionDigits);
};

export const formatMoney = (
  value: number,
  symbol: string,
  options: { absolute?: boolean; fractionDigits?: number } = {}
): string => {
  const fractionDigits = options.fractionDigits ?? DEFAULT_CURRENCY_FRACTION_DIGITS;
  const safeValue = Number.isFinite(value) ? normalizeMoney(value, fractionDigits) : 0;
  const display = options.absolute === false ? safeValue : Math.abs(safeValue);
  return `${symbol}${display.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};
