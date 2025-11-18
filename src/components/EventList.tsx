import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../types/event.types";
import { EventCard } from "./EventCard";
import { Colors } from "../../constants/theme";

interface EventListProps {
  events: Event[];
  onEventPress: (eventId: string) => void;
  emptyMessage?: string;
}

interface EventSection {
  title: string;
  data: Event[];
}

// Format date for section headers (e.g., "Thứ Hai, 18 Tháng 11")
const formatSectionDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return "Hôm nay";
  }

  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Ngày mai";
  }

  // Format as "Thứ X, DD Tháng MM"
  const dayNames = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const monthName = monthNames[date.getMonth()];

  return `${dayName}, ${day} ${monthName}`;
};

export const EventList: React.FC<EventListProps> = ({
  events,
  onEventPress,
  emptyMessage = "Không có sự kiện nào.",
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Group events by date and sort chronologically
  const sections = useMemo<EventSection[]>(() => {
    // Sort events by date and time
    const sortedEvents = [...events].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // Group by date
    const grouped = sortedEvents.reduce((acc, event) => {
      const dateKey = event.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, Event[]>);

    // Convert to sections array
    return Object.entries(grouped).map(([date, dateEvents]) => ({
      title: formatSectionDate(date),
      data: dateEvents,
    }));
  }, [events]);

  // Render empty state
  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.icon} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Không có sự kiện
        </Text>
        <Text style={[styles.emptyText, { color: colors.icon }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EventCard event={item} onPress={() => onEventPress(item.id)} />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View
          style={[styles.sectionHeader, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
        </View>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={true}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
