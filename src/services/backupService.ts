import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const BACKUP_VERSION = 2;
const BACKUP_FILE_PREFIX = "FamFinance_Backup";

// Actual AsyncStorage keys used by the app's storage services.
// NOTE: authentication data lives in SecureStore (not AsyncStorage) and is
// intentionally excluded from backups since it is sensitive and the backup
// file is plain, unencrypted JSON.
const EXPENSES_KEY = "@expense_tracker:expenses";
const EVENTS_KEY = "@expense_tracker:events";
const NOTES_KEY = "@expense_tracker:notes";
const FAMILY_KEY = "@family_members";
const SPLIT_TRIPS_KEY = "@expense_tracker:split_trips";

const STORAGE_KEYS = [
  EXPENSES_KEY,
  EVENTS_KEY,
  NOTES_KEY,
  FAMILY_KEY,
  SPLIT_TRIPS_KEY,
  "@expense_tracker:incomes",
  "@expense_tracker:spending_limits",
  "@expense_tracker:custom_categories",
  "@recurring_expenses",
  "user-language",
  "user-currency",
  "user-currency-manual",
];

export interface BackupData {
  version: number;
  createdAt: string;
  appName: string;
  data: Record<string, string | null>;
  stats: {
    expenses: number;
    events: number;
    notes: number;
    familyMembers: number;
  };
}

function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}_${h}${min}`;
}

function countItems(data: Record<string, string | null>) {
  const parse = (key: string): number => {
    try {
      const val = data[key];
      if (!val) return 0;
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };
  return {
    expenses: parse(EXPENSES_KEY),
    events: parse(EVENTS_KEY),
    notes: parse(NOTES_KEY),
    familyMembers: parse(FAMILY_KEY),
  };
}

export async function createBackup(): Promise<BackupData> {
  const pairs = await AsyncStorage.multiGet(STORAGE_KEYS);
  const data: Record<string, string | null> = {};
  for (const [key, value] of pairs) {
    data[key] = value;
  }
  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    appName: "FamFinance",
    data,
    stats: countItems(data),
  };
}

export async function exportBackup(): Promise<boolean> {
  const backup = await createBackup();
  const json = JSON.stringify(backup, null, 2);
  const fileName = `${BACKUP_FILE_PREFIX}_${getTimestamp()}.json`;
  const file = new File(Paths.cache, fileName);
  file.write(json);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return false;
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Export Backup",
    UTI: "public.json",
  });
  return true;
}

export async function importBackup(): Promise<BackupData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  const pickedUri = result.assets[0].uri;
  const file = new File(pickedUri);
  const content = await file.text();
  const backup: BackupData = JSON.parse(content);
  if (!backup.version || !backup.data || backup.appName !== "FamFinance") {
    throw new Error("Invalid backup file");
  }
  return backup;
}

export async function restoreBackup(backup: BackupData): Promise<void> {
  const pairs: [string, string][] = [];
  for (const [key, value] of Object.entries(backup.data)) {
    if (value !== null && STORAGE_KEYS.includes(key)) {
      pairs.push([key, value]);
    }
  }
  await AsyncStorage.multiSet(pairs);
}

export function formatBackupDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
