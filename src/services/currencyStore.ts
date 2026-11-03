// Module-level currency store.
//
// This is the single source of truth for the app's active currency. Both the
// React hook (useCurrency) and the plain formatCurrency() helper read from
// here, so currency formatting stays consistent everywhere in the app,
// including in non-component code.

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", locale: "vi-VN" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "KRW", symbol: "₩", name: "Korean Won", locale: "ko-KR" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "THB", symbol: "฿", name: "Thai Baht", locale: "th-TH" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", locale: "fil-PH" },
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // USD

// Maps an app language to its default currency code.
const LANGUAGE_TO_CURRENCY: Record<string, string> = {
  vi: "VND",
  en: "USD",
  ja: "JPY",
  ko: "KRW",
  th: "THB",
  fil: "PHP",
};

export const getCurrencyForLanguage = (language: string): CurrencyConfig => {
  // language can be a full tag like "vi-VN"; take the base part.
  const base = (language || "").split("-")[0];
  const code = LANGUAGE_TO_CURRENCY[base] ?? DEFAULT_CURRENCY.code;
  return CURRENCIES.find((c) => c.code === code) ?? DEFAULT_CURRENCY;
};

let activeCurrency: CurrencyConfig = DEFAULT_CURRENCY;
const listeners = new Set<() => void>();

export const getActiveCurrency = (): CurrencyConfig => activeCurrency;

export const setActiveCurrency = (config: CurrencyConfig): void => {
  if (config.code === activeCurrency.code) return;
  activeCurrency = config;
  listeners.forEach((listener) => listener());
};

export const subscribeCurrency = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Format an amount using the currently active currency.
 * Reads from the module store so it works both inside and outside React.
 */
export const formatCurrency = (amount: number): string => {
  const { locale, symbol } = activeCurrency;
  return `${amount.toLocaleString(locale)} ${symbol}`;
};
