import useTranslation from "@/src/hooks/useTranslation";
import { ReminderTime } from "@/src/types/event.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

interface ReminderPickerProps {
  enabled: boolean;
  reminderMinutes: ReminderTime;
  onToggle: (enabled: boolean) => void;
  onSelectTime: (minutes: ReminderTime) => void;
}

const REMINDER_VALUES: ReminderTime[] = [5, 10, 15, 30, 60, 1440];

export default function ReminderPicker({
  enabled,
  reminderMinutes,
  onToggle,
  onSelectTime,
}: ReminderPickerProps) {
  const { t } = useTranslation();

  const getReminderLabel = (minutes: ReminderTime): string => {
    if (minutes === 1440) {
      return t("events.reminderBeforeDay");
    }
    if (minutes === 60) {
      return t("events.reminderBeforeHour");
    }
    if (minutes >= 60) {
      return t("events.reminderBeforeHours", {
        count: Math.floor(minutes / 60),
      });
    }
    return t("events.reminderBeforeMinutes", { count: minutes });
  };

  return (
    <View style={styles.container}>
      {/* Toggle Switch */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabel}>
          <Ionicons name="notifications-outline" size={20} color="#666" />
          <Text style={styles.label}>{t("events.reminder")}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
          thumbColor={enabled ? "#007AFF" : "#f4f3f4"}
          ios_backgroundColor="#d1d5db"
        />
      </View>

      {/* Reminder Time Options */}
      {enabled && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>{t("events.reminderTime")}</Text>
          <View style={styles.optionsGrid}>
            {REMINDER_VALUES.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  reminderMinutes === value && styles.optionButtonSelected,
                ]}
                onPress={() => onSelectTime(value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    reminderMinutes === value && styles.optionTextSelected,
                  ]}
                >
                  {getReminderLabel(value)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
});
