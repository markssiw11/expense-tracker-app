import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Event, EventCategory } from "../types/event.types";
import { Colors } from "../../constants/theme";

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

// Category colors and icons
const CATEGORY_CONFIG: Record<
  EventCategory,
  { color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  Work: { color: "#3B82F6", icon: "briefcase" },
  Personal: { color: "#A855F7", icon: "person" },
  Health: { color: "#10B981", icon: "fitness" },
  Family: { color: "#F59E0B", icon: "people" },
  Other: { color: "#6B7280", icon: "ellipsis-horizontal-circle" },
};

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const categoryConfig = CATEGORY_CONFIG[event.category];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colorScheme === "dark" ? "#1F2937" : "#fff" },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.categoryIndicator,
          { backgroundColor: categoryConfig.color },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${categoryConfig.color}20` },
            ]}
          >
            <Ionicons
              name={categoryConfig.icon}
              size={20}
              color={categoryConfig.color}
            />
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {event.title}
            </Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={colors.icon} />
              <Text style={[styles.time, { color: colors.icon }]}>
                {event.time}
              </Text>
            </View>
          </View>
        </View>
        {event.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.icon} />
            <Text
              style={[styles.location, { color: colors.icon }]}
              numberOfLines={1}
            >
              {event.location}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.icon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIndicator: {
    width: 4,
    height: "auto",
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    marginLeft: 52,
  },
  location: {
    fontSize: 13,
    flex: 1,
    letterSpacing: 0.1,
  },
});
