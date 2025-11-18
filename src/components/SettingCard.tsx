import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SettingCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  type?: "switch" | "button";
  value?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
}

export default function SettingCard({
  icon,
  label,
  description,
  type = "button",
  value,
  disabled = false,
  onPress,
  onValueChange,
}: SettingCardProps) {
  const content = (
    <>
      <View style={styles.settingInfo}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={24} color="#667eea" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      {type === "switch" ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#D1D5DB", true: "#667eea" }}
          thumbColor="#fff"
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </>
  );

  if (type === "button") {
    return (
      <TouchableOpacity style={styles.settingCard} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.settingCard}>{content}</View>;
}

const styles = StyleSheet.create({
  settingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
});
