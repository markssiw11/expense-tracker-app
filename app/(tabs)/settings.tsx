import { FlagIcon } from "@/src/components/FlagIcon";
import { Language, LANGUAGES } from "@/src/constants/Languages";
import { useTranslation } from "@/src/hooks/useTranslation";
import { clearSampleData, seedSampleData } from "@/src/services/devSeed";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route: string;
}

export default function SettingsTab() {
  const insets = useSafeAreaInsets();
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const currentLanguageInfo =
    LANGUAGES.find((lang) => lang.code === currentLanguage) || LANGUAGES[0];

  const SETTINGS_ITEMS: SettingItem[] = [
    {
      id: "authentication",
      title: t("settings.security"),
      subtitle: t("settings.securityDesc"),
      icon: "shield-checkmark",
      iconColor: "#667eea",
      route: "/settings/authentication",
    },
    {
      id: "family-members",
      title: t("settings.familyMembers"),
      subtitle: t("settings.familyMembersDesc"),
      icon: "people",
      iconColor: "#FF6B9D",
      route: "/settings/family-members",
    },
    {
      id: "spending-limits",
      title: t("settings.spendingLimits"),
      subtitle: t("settings.spendingLimitsDesc"),
      icon: "wallet",
      iconColor: "#10b981",
      route: "/settings/spending-limits",
    },
    {
      id: "recurring-expenses",
      title: t("recurring.title"),
      subtitle: t("recurring.settingsSubtitle"),
      icon: "repeat",
      iconColor: "#F59E0B",
      route: "/settings/recurring-expenses",
    },
    {
      id: "backup",
      title: t("settings.backup"),
      subtitle: t("backup.headerSubtitle"),
      icon: "cloud-upload",
      iconColor: "#8B5CF6",
      route: "/settings/backup",
    },
  ];

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setShowLanguageModal(false);
  };

  const handleSeedData = async () => {
    try {
      const summary = await seedSampleData();
      Alert.alert(
        "Seed data",
        `Created: ${summary.expenses} expenses, ${summary.incomes} incomes, ${summary.events} events, ${summary.notes} notes.\n\nReload the app to see the data.`,
      );
    } catch (e) {
      Alert.alert("Seed data", `Error: ${e instanceof Error ? e.message : e}`);
    }
  };

  const handleClearData = async () => {
    try {
      await clearSampleData();
      Alert.alert(
        "Seed data",
        "Sample data cleared. Reload the app to update.",
      );
    } catch (e) {
      Alert.alert("Seed data", `Error: ${e instanceof Error ? e.message : e}`);
    }
  };

  const renderLanguageItem = ({ item }: { item: Language }) => {
    const isSelected = currentLanguage === item.code;

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageSelect(item.code)}
        activeOpacity={0.7}
      >
        <View style={styles.languageLeft}>
          <View style={styles.flag}>
            <FlagIcon country={item.countryCode} size={32} />
          </View>
          <View style={styles.languageInfo}>
            <Text
              style={[styles.languageName, isSelected && styles.selectedText]}
            >
              {item.nativeName}
            </Text>
            <Text
              style={[
                styles.languageSubname,
                isSelected && styles.selectedSubtext,
              ]}
            >
              {item.name}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#667eea" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingCard}
      onPress={() => handleNavigate(item.route)}
    >
      <View style={styles.settingLeft}>
        <View
          style={[styles.iconContainer, { backgroundColor: item.iconColor }]}
        >
          <Ionicons name={item.icon} size={24} color="#fff" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{t("settings.title")}</Text>
            <Ionicons name="settings-sharp" size={22} color="#fff" />
          </View>
          <Text style={styles.headerSubtitle}>{t("settings.subtitle")}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
          <TouchableOpacity
            style={styles.languageCard}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#FF9500" }]}
              >
                <Ionicons name="language" size={24} color="#fff" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  {t("settings.changeLanguage")}
                </Text>
                <View style={styles.subtitleRow}>
                  <FlagIcon
                    country={currentLanguageInfo.countryCode}
                    size={20}
                  />
                  <Text style={styles.settingSubtitle}>
                    {currentLanguageInfo.nativeName}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.general")}</Text>
          {SETTINGS_ITEMS.map(renderSettingItem)}
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEV — SCREENSHOT DATA</Text>
            <TouchableOpacity
              style={styles.settingCard}
              onPress={handleSeedData}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#10b981" }]}
                >
                  <Ionicons name="sparkles" size={24} color="#fff" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Seed sample data</Text>
                  <Text style={styles.settingSubtitle}>
                    Generate sample data for screenshots
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={handleClearData}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#EF4444" }]}
                >
                  <Ionicons name="trash" size={24} color="#fff" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Clear sample data</Text>
                  <Text style={styles.settingSubtitle}>
                    Clear expenses / income / events / notes
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {t("language.selectLanguage")}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={LANGUAGES}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  languageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  modalListContent: {
    padding: 16,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedLanguageItem: {
    backgroundColor: "#F8F9FF",
    borderWidth: 2,
    borderColor: "#667eea",
  },
  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flag: {
    marginRight: 16,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  selectedText: {
    color: "#667eea",
  },
  languageSubname: {
    fontSize: 14,
    color: "#666",
  },
  selectedSubtext: {
    color: "#667eea",
    opacity: 0.8,
  },
});
