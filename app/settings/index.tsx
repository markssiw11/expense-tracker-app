import { GoBackButton, LanguageSelector } from "@/src/components";
import { LANGUAGES } from "@/src/constants/Languages";
import { useTranslation } from "@/src/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FEEDBACK_EMAIL = "longnguyen95.xn@gmail.com";
const IOS_STORE_URL =
  "https://apps.apple.com/us/app/famfinance-family-budget/id6755727046";
const ANDROID_PACKAGE = "com.family.expensetracker";

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route?: string;
  action?: () => void;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, getCurrentLanguage } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const currentLanguage = getCurrentLanguage();
  const languageDisplayName =
    LANGUAGES.find((lang) => lang.code === currentLanguage)?.nativeName ??
    LANGUAGES[0].nativeName;

  const SETTINGS_ITEMS: SettingItem[] = [
    {
      id: "language",
      title: t("settings.language"),
      subtitle: languageDisplayName,
      icon: "language",
      iconColor: "#FF9500",
      action: () => setShowLanguageSelector(true),
    },
    {
      id: "authentication",
      title: t("settings.security"),
      subtitle: t("authentication.securitySettings"),
      icon: "shield-checkmark",
      iconColor: "#667eea",
      route: "/settings/authentication",
    },
    {
      id: "family-members",
      title: t("settings.familyMembers"),
      subtitle: t("familyMembers.manageSpenders"),
      icon: "people",
      iconColor: "#FF6B9D",
      route: "/settings/family-members",
    },
    {
      id: "spending-limits",
      title: t("settings.spendingLimits"),
      subtitle: t("budget.budgetSettings"),
      icon: "wallet",
      iconColor: "#10b981",
      route: "/settings/spending-limits",
    },
  ];

  const openUrl = async (url: string, fallback?: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      try {
        if (!fallback) throw new Error("no fallback");
        await Linking.openURL(fallback);
      } catch {
        Alert.alert(t("settings.actionFailed"));
      }
    }
  };

  const handleRateApp = () => {
    if (Platform.OS === "ios") {
      openUrl(
        `${IOS_STORE_URL.replace("https://", "itms-apps://")}?action=write-review`,
        IOS_STORE_URL,
      );
    } else {
      openUrl(
        `market://details?id=${ANDROID_PACKAGE}`,
        `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
      );
    }
  };

  const handleSendFeedback = () => {
    const subject = t("settings.feedbackSubject");
    const body = t("settings.feedbackBody", {
      version: Constants.expoConfig?.version ?? "",
      platform: `${Platform.OS} ${Platform.Version}`,
      interpolation: { escapeValue: false },
    });
    openUrl(
      `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  const SUPPORT_ITEMS: SettingItem[] = [
    {
      id: "rate-app",
      title: t("settings.rateApp"),
      subtitle: t("settings.rateAppDesc"),
      icon: "star",
      iconColor: "#FFB800",
      action: handleRateApp,
    },
    {
      id: "send-feedback",
      title: t("settings.sendFeedback"),
      subtitle: t("settings.sendFeedbackDesc"),
      icon: "chatbubble-ellipses",
      iconColor: "#06b6d4",
      action: handleSendFeedback,
    },
  ];

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const handleItemPress = (item: SettingItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      handleNavigate(item.route);
    }
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingCard}
      onPress={() => handleItemPress(item)}
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
        <GoBackButton />
        <View>
          <Text style={styles.headerTitle}>{t("settings.title")} ⚙️</Text>
          <Text style={styles.headerSubtitle}>{t("settings.appSettings")}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.generalSettings")}
          </Text>
          {SETTINGS_ITEMS.map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.support")}</Text>
          {SUPPORT_ITEMS.map(renderSettingItem)}
        </View>
      </ScrollView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
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
});
