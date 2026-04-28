# Internationalization (i18n) Guide

## Overview

This expense tracker app now supports multiple languages with English as the default language. The app uses `react-i18next` for internationalization.

## Supported Languages

- **English (en)** - Default language
- **Vietnamese (vi)** - Secondary language

## Features

- Automatic language detection and persistence
- Language selector in Settings
- Translated UI elements including:
  - Navigation tabs
  - Expense categories
  - Month names
  - Common actions (Add, Edit, Delete, etc.)
  - Settings and authentication screens

## How to Use

### Changing Language

1. Go to the **Settings** tab
2. Tap on **Language** option
3. Select your preferred language from the modal
4. The app will immediately switch to the selected language

### For Developers

#### Adding New Translations

1. Add new translation keys to both `src/i18n/locales/en.json` and `src/i18n/locales/vi.json`
2. Use the `useTranslation` hook in your components:

```typescript
import { useTranslation } from "@/src/hooks/useTranslation";

function MyComponent() {
  const { t } = useTranslation();

  return <Text>{t("common.save")}</Text>;
}
```

#### Adding New Languages

1. Create a new JSON file in `src/i18n/locales/` (e.g., `fr.json`)
2. Add the language to the resources in `src/i18n/index.ts`
3. Update the `LANGUAGES` array in `src/components/LanguageSelector.tsx`

#### Translation File Structure

```json
{
  "common": {
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete"
  },
  "expenses": {
    "title": "Expenses",
    "addExpense": "Add Expense"
  },
  "categories": {
    "food": "Food & Dining",
    "transportation": "Transportation"
  }
}
```

#### Using Categories with i18n

Categories now use the `getExpenseCategories(t)` function instead of the static `EXPENSE_CATEGORIES` array:

```typescript
import {
  getExpenseCategories,
  getCategoryConfig,
} from "@/src/constants/ExpenseCategories";
import { useTranslation } from "@/src/hooks/useTranslation";

function MyComponent() {
  const { t } = useTranslation();
  const categories = getExpenseCategories(t);
  const categoryConfig = getCategoryConfig(ExpenseCategory.FOOD, t);
}
```

## Technical Implementation

### Key Files

- `src/i18n/index.ts` - i18n configuration and initialization
- `src/i18n/locales/` - Translation files
- `src/hooks/useTranslation.ts` - Custom hook for translations
- `src/components/LanguageSelector.tsx` - Language selection modal
- `src/utils/dateUtils.ts` - Date formatting utilities with i18n

### Language Persistence

The selected language is automatically saved to AsyncStorage and restored when the app restarts.

### Default Language

The app defaults to English (`en`) if:

- No language is saved in AsyncStorage
- There's an error reading the saved language
- The saved language is not supported

## Testing

To test the i18n implementation:

1. Start the app (it should default to English)
2. Go to Settings → Language
3. Switch to Vietnamese
4. Verify all UI elements are translated
5. Restart the app to confirm language persistence
6. Switch back to English to test both directions

## Future Enhancements

- Add more languages (French, Spanish, etc.)
- Implement RTL language support
- Add currency formatting based on locale
- Translate remaining screens (Notes, Events, etc.)
