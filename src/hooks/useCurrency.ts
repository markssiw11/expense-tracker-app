import {
  CURRENCIES,
  CurrencyConfig,
  getActiveCurrency,
  getCurrencyForLanguage,
  setActiveCurrency,
  subscribeCurrency,
} from "@/src/services/currencyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

export { CURRENCIES } from "@/src/services/currencyStore";
export type { CurrencyConfig } from "@/src/services/currencyStore";

const STORAGE_KEY = "user-currency";
// Marks that the user picked a currency manually, so we stop auto-syncing it
// with the app language.
const MANUAL_FLAG_KEY = "user-currency-manual";

export const useCurrency = () => {
  const { i18n } = useTranslation();
  const currency = useSyncExternalStore(subscribeCurrency, getActiveCurrency);
  const [isLoaded, setIsLoaded] = useState(false);

  // On mount: restore a manual pick, otherwise follow the app language.
  useEffect(() => {
    const load = async () => {
      try {
        const [saved, manualFlag] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(MANUAL_FLAG_KEY),
        ]);

        if (manualFlag === "true" && saved) {
          const parsed = JSON.parse(saved) as CurrencyConfig;
          const found = CURRENCIES.find((c) => c.code === parsed.code);
          if (found) {
            setActiveCurrency(found);
            return;
          }
        }

        setActiveCurrency(getCurrencyForLanguage(i18n.language));
      } catch {
        setActiveCurrency(getCurrencyForLanguage(i18n.language));
      } finally {
        setIsLoaded(true);
      }
    };
    load();
    // Only on mount; language changes handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep currency in sync with the app language unless manually overridden.
  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    const syncWithLanguage = async () => {
      const manualFlag = await AsyncStorage.getItem(MANUAL_FLAG_KEY);
      if (manualFlag === "true" || cancelled) return;
      setActiveCurrency(getCurrencyForLanguage(i18n.language));
    };
    syncWithLanguage();

    return () => {
      cancelled = true;
    };
  }, [i18n.language, isLoaded]);

  const setCurrency = useCallback(async (config: CurrencyConfig) => {
    setActiveCurrency(config);
    // A manual pick disables language-based auto-sync from now on.
    await AsyncStorage.multiSet([
      [STORAGE_KEY, JSON.stringify(config)],
      [MANUAL_FLAG_KEY, "true"],
    ]);
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

/**
 * Lightweight hook for screens that only need to format amounts.
 * Subscribes to the currency store so the component re-renders when the
 * active currency changes (e.g. after switching language).
 */
export const useCurrencyFormat = () => {
  const currency = useSyncExternalStore(subscribeCurrency, getActiveCurrency);

  return useCallback(
    (value: number) => {
      return `${value.toLocaleString(currency.locale)} ${currency.symbol}`;
    },
    [currency],
  );
};

export default useCurrency;
