import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

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
];

const STORAGE_KEY = "user-currency";
const DEFAULT_CURRENCY = CURRENCIES[0]; // USD

export const useCurrency = () => {
  const [currency, setCurrencyState] =
    useState<CurrencyConfig>(DEFAULT_CURRENCY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as CurrencyConfig;
          const found = CURRENCIES.find((c) => c.code === parsed.code);
          if (found) setCurrencyState(found);
        }
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const setCurrency = useCallback(async (config: CurrencyConfig) => {
    setCurrencyState(config);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, []);

  const formatAmount = useCallback(
    (value: number) => {
      return `${value.toLocaleString(currency.locale)} ${currency.symbol}`;
    },
    [currency],
  );

  return {
    currency,
    setCurrency,
    formatAmount,
    isLoaded,
    currencies: CURRENCIES,
  };
};

export default useCurrency;
