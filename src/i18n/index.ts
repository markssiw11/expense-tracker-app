import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translations
import en from "./locales/en.json";
import fil from "./locales/fil.json";
import hi from "./locales/hi.json";
import id from "./locales/id.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import th from "./locales/th.json";
import vi from "./locales/vi.json";

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem("user-language");
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      // Default to English if no saved language
      callback("en");
    } catch (error) {
      console.log("Error reading language from AsyncStorage:", error);
      callback("en"); // Default to English on error
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem("user-language", lng);
    } catch (error) {
      console.log("Error saving language to AsyncStorage:", error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      fil: {
        translation: fil,
      },
      id: {
        translation: id,
      },
      hi: {
        translation: hi,
      },
      vi: {
        translation: vi,
      },
      ja: {
        translation: ja,
      },
      ko: {
        translation: ko,
      },
      th: {
        translation: th,
      },
    },
    fallbackLng: "en", // Default to English
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
