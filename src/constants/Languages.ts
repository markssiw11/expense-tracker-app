export interface Language {
  code: string;
  name: string;
  nativeName: string;
  /** Emoji flag, kept as a fallback / for platforms that render it fine. */
  flag: string;
  /** ISO country code used to render a vector flag via <FlagIcon />. */
  countryCode: FlagCountryCode;
}

// Country codes supported by the vector <FlagIcon /> component.
export type FlagCountryCode = "US" | "VN" | "JP" | "KR";

// Single source of truth for the languages the app supports.
// Keep this in sync with the resources registered in src/i18n/index.ts.
export const LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    countryCode: "US",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    countryCode: "VN",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    countryCode: "JP",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    countryCode: "KR",
  },
];
