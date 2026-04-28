import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const BACKUP_VERSION = 1;
const BACKUP_FILE_PREFIX = "FamFinance_Backup";

const STORAGE_KEYS = [
  "@expenses",
  "@family_members",
  "@events",
  "@notes",
  "@spending_limit_config",
  "@auth_enabled",
  "@biometric_enabled",
  "user-language",
  "user-currency",
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
    expenses: parse("@expenses"),
    events: parse("@events"),
    notes: parse("@notes"),
    familyMembers: parse("@family_members"),
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
