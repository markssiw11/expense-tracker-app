import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";
import { useTranslation } from "../hooks/useTranslation";
import { Event } from "../types/event.types";
import { EventCard } from "./EventCard";

// Maps the app language code to a BCP-47 locale tag for date formatting.
const localeTagFor = (language: string): string => {
  switch (language) {
    case "vi":
      return "vi-VN";
    case "ja":
      return "ja-JP";
    case "ko":
      return "ko-KR";
    default:
      return "en-US";
  }
};

interface EventListProps {
  events: Event[];
  onEventPress: (eventId: string) => void;
  emptyMessage?: string;
  scrollEnabled?: boolean;
}

interface EventSection {
  title: string;
  data: Event[];
}

// Format date for section headers, localized. Uses "Today"/"Tomorrow" labels
// when applicable, otherwise a full weekday + day + month via Intl.
const formatSectionDate = (
  dateString: string,
  t: (key: string) => string,
  locale: string,
): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return t("calendar.today");
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return t("calendar.tomorrow");
  }

  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export const EventList: React.FC<EventListProps> = ({
  events,
  onEventPress,
  emptyMessage,
  scrollEnabled = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, getCurrentLanguage } = useTranslation();
  const locale = localeTagFor(getCurrentLanguage());
  const resolvedEmptyMessage = emptyMessage ?? t("calendar.noEventsMessage");

  // Group events by date and sort chronologically
  const sections = useMemo<EventSection[]>(() => {
    // Sort events by date and time
    const sortedEvents = [...events].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // Group by date
    const grouped = sortedEvents.reduce(
      (acc, event) => {
        const dateKey = event.date;
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
      },
      {} as Record<string, Event[]>,
    );

    // Convert to sections array
    return Object.entries(grouped).map(([date, dateEvents]) => ({
      title: formatSectionDate(date, t, locale),
      data: dateEvents,
    }));
  }, [events, t, locale]);

  // Render empty state
  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="calendar-outline" size={64} color={colors.icon} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {t("calendar.noEvents")}
        </Text>
        <Text style={[styles.emptyText, { color: colors.icon }]}>
          {resolvedEmptyMessage}
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
      scrollEnabled={scrollEnabled}
      nestedScrollEnabled={true}
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
