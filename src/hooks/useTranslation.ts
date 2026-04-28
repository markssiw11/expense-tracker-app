import { useTranslation as useI18nTranslation } from "react-i18next";

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = async (language: string) => {
    await i18n.changeLanguage(language);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const isRTL = () => {
    // Add RTL languages here if needed
    const rtlLanguages = ["ar", "he", "fa"];
    return rtlLanguages.includes(i18n.language);
  };

  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    isRTL,
  };
};

export default useTranslation;
