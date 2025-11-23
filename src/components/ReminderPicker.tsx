import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReminderTime } from "@/src/types/event.types";

interface ReminderPickerProps {
  enabled: boolean;
  reminderMinutes: ReminderTime;
  onToggle: (enabled: boolean) => void;
  onSelectTime: (minutes: ReminderTime) => void;
}

interface ReminderOption {
  value: ReminderTime;
  label: string;
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { value: 5, label: "5 phút trước" },
  { value: 10, label: "10 phút trước" },
  { value: 15, label: "15 phút trước" },
  { value: 30, label: "30 phút trước" },
  { value: 60, label: "1 giờ trước" },
  { value: 1440, label: "1 ngày trước" },
];

export default function ReminderPicker({
  enabled,
  reminderMinutes,
  onToggle,
  onSelectTime,
}: ReminderPickerProps) {
  return (
    <View style={styles.container}>
      {/* Toggle Switch */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLabel}>
          <Ionicons name="notifications-outline" size={20} color="#666" />
          <Text style={styles.label}>Nhắc nhở</Text>
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
          <Text style={styles.optionsLabel}>Thời gian nhắc:</Text>
          <View style={styles.optionsGrid}>
            {REMINDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  reminderMinutes === option.value &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => onSelectTime(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    reminderMinutes === option.value &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option.label}
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
