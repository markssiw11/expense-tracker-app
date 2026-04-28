import { GoBackButton } from "@/src/components";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  BackupData,
  exportBackup,
  formatBackupDate,
  importBackup,
  restoreBackup,
} from "@/src/services/backupService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Updates from "expo-updates";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportBackup();
    } catch {
      Alert.alert(t("common.error"), t("backup.importFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const backup = await importBackup();
      if (!backup) {
        setIsImporting(false);
        return;
      }
      setPreviewData(backup);
      setIsImporting(false);
    } catch {
      setIsImporting(false);
      Alert.alert(t("common.error"), t("backup.invalidFile"));
    }
  };

  const handleConfirmRestore = () => {
    if (!previewData) return;

    Alert.alert(t("backup.confirmRestore"), t("backup.confirmRestoreMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await restoreBackup(previewData);
            setPreviewData(null);
            Alert.alert(t("common.success"), t("backup.importSuccess"), [
              {
                text: t("backup.restartApp"),
                onPress: async () => {
                  try {
                    await Updates.reloadAsync();
                  } catch {
                    // Fallback: just inform user
                  }
                },
              },
            ]);
          } catch {
            Alert.alert(t("common.error"), t("backup.importFailed"));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <GoBackButton />
        <View>
          <Text style={styles.headerTitle}>{t("backup.headerTitle")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("backup.headerSubtitle")}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Export Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-upload" size={22} color="#667eea" />
            <Text style={styles.sectionTitle}>{t("backup.exportTitle")}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardDesc}>{t("backup.exportDesc")}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>
                    {t("backup.exportButton")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-download" size={22} color="#10b981" />
            <Text style={styles.sectionTitle}>{t("backup.importTitle")}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardDesc}>{t("backup.importDesc")}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, styles.importButton]}
              onPress={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="folder-open-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>
                    {t("backup.importButton")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview imported data */}
        {previewData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={22} color="#F59E0B" />
              <Text style={styles.sectionTitle}>{t("backup.fileDetails")}</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("backup.createdAt")}</Text>
                <Text style={styles.statValue}>
                  {formatBackupDate(previewData.createdAt)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("backup.expenses")}</Text>
                <Text style={styles.statValue}>
                  {previewData.stats.expenses} {t("backup.items")}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("backup.events")}</Text>
                <Text style={styles.statValue}>
                  {previewData.stats.events} {t("backup.items")}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("backup.notes")}</Text>
                <Text style={styles.statValue}>
                  {previewData.stats.notes} {t("backup.items")}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t("backup.members")}</Text>
                <Text style={styles.statValue}>
                  {previewData.stats.familyMembers} {t("backup.items")}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 16 }]}
                onPress={handleConfirmRestore}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>
                  {t("backup.confirmRestore")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#667eea" />
          <Text style={styles.infoText}>{t("backup.backupInfo")}</Text>
        </View>

        {/* Guide Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={22} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>{t("backup.guideTitle")}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.guideItem}>
              <View style={[styles.guideIcon, { backgroundColor: "#EEF2FF" }]}>
                <Ionicons name="cloud-upload" size={18} color="#667eea" />
              </View>
              <Text style={styles.guideText}>{t("backup.guideExport")}</Text>
            </View>
            <View style={styles.guideItem}>
              <View style={[styles.guideIcon, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="cloud-download" size={18} color="#10b981" />
              </View>
              <Text style={styles.guideText}>{t("backup.guideImport")}</Text>
            </View>
            <View style={styles.guideItem}>
              <View style={[styles.guideIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="swap-horizontal" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.guideText}>{t("backup.guideTransfer")}</Text>
            </View>
            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={18} color="#F59E0B" />
              <Text style={styles.tipText}>{t("backup.guideRegular")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 14, color: "#fff", opacity: 0.9 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDesc: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 16 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#667eea",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  importButton: { backgroundColor: "#10b981" },
  primaryButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statLabel: { fontSize: 15, color: "#666", fontWeight: "500" },
  statValue: { fontSize: 15, color: "#1A1A1A", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 4 },
  infoCard: {
    backgroundColor: "#EEF2FF",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 14, color: "#4338CA", lineHeight: 20 },
  guideItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  guideIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  guideText: { flex: 1, fontSize: 14, color: "#333", lineHeight: 20 },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  tipText: { flex: 1, fontSize: 13, color: "#92400E", fontWeight: "600" },
});
