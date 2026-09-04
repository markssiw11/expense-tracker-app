import useTranslation from "@/src/hooks/useTranslation";
import { EventCategory } from "@/src/types/event.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CategoryPickerProps {
  selectedCategory: EventCategory;
  onSelect: (category: EventCategory) => void;
}

interface CategoryConfig {
  key: EventCategory;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const EVENT_CATEGORIES: CategoryConfig[] = [
  {
    key: "Work",
    icon: "briefcase",
    color: "#3B82F6", // Blue
  },
  {
    key: "Personal",
    icon: "person",
    color: "#A855F7", // Purple
  },
  {
    key: "Health",
    icon: "fitness",
    color: "#10B981", // Green
  },
  {
    key: "Family",
    icon: "people",
    color: "#F59E0B", // Orange
  },
  {
    key: "Other",
    icon: "ellipsis-horizontal",
    color: "#6B7280", // Gray
  },
];

export default function CategoryPicker({
  selectedCategory,
  onSelect,
}: CategoryPickerProps) {
  const { t } = useTranslation();
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
          <Text style={styles.categoryLabel}>
            {t(`eventCategories.${cat.key}`)}
          </Text>
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
