import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EventCategory } from "@/src/types/event.types";

interface CategoryPickerProps {
  selectedCategory: EventCategory;
  onSelect: (category: EventCategory) => void;
}

interface CategoryConfig {
  key: EventCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const EVENT_CATEGORIES: CategoryConfig[] = [
  {
    key: "Work",
    label: "Công việc",
    icon: "briefcase",
    color: "#3B82F6", // Blue
  },
  {
    key: "Personal",
    label: "Cá nhân",
    icon: "person",
    color: "#A855F7", // Purple
  },
  {
    key: "Health",
    label: "Sức khỏe",
    icon: "fitness",
    color: "#10B981", // Green
  },
  {
    key: "Family",
    label: "Gia đình",
    icon: "people",
    color: "#F59E0B", // Orange
  },
  {
    key: "Other",
    label: "Khác",
    icon: "ellipsis-horizontal",
    color: "#6B7280", // Gray
  },
];

export default function CategoryPicker({
  selectedCategory,
  onSelect,
}: CategoryPickerProps) {
  return (
    <View style={styles.categoryGrid}>
      {EVENT_CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={[
            styles.categoryItem,
            selectedCategory === cat.key && styles.categoryItemSelected,
          ]}
          onPress={() => onSelect(cat.key)}
        >
          <View
            style={[
              styles.categoryIcon,
              {
                backgroundColor:
                  selectedCategory === cat.key ? cat.color : "#f0f0f0",
              },
            ]}
          >
            <Ionicons
              name={cat.icon}
              size={24}
              color={selectedCategory === cat.key ? "#fff" : "#666"}
            />
          </View>
          <Text style={styles.categoryLabel}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryItem: {
    width: "22%",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  categoryItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
});
