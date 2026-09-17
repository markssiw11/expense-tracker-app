import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Language, LANGUAGES } from "../constants/Languages";
import { useTranslation } from "../hooks/useTranslation";
import { FlagIcon } from "./FlagIcon";

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSelector({
  visible,
  onClose,
}: LanguageSelectorProps) {
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    onClose();
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("language.selectLanguage")}</Text>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          data={LANGUAGES}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  header: {
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  listContent: {
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
