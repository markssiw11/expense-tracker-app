import { useTranslation } from "@/src/hooks/useTranslation";
import { deleteEvent } from "@/src/redux/reducers/eventSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { cancelNotification } from "@/src/services/notificationService";
import { EventCategory } from "@/src/types/event.types";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { enUS, ja, ko, vi } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Category icons
const CATEGORY_ICONS: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  Work: "briefcase",
  Personal: "person",
  Health: "fitness",
  Family: "people",
  Other: "ellipsis-horizontal-circle",
};

// Helper function to format reminder time
const formatReminderTime = (
  minutes: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string => {
  if (minutes < 60) {
    return t("events.reminderBeforeMinutes", { count: minutes });
  } else if (minutes === 60) {
    return t("events.reminderBeforeHour");
  } else if (minutes === 1440) {
    return t("events.reminderBeforeDay");
  } else {
    const hours = Math.floor(minutes / 60);
    return t("events.reminderBeforeHours", { count: hours });
  }
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((state) =>
    state.events.events.find((e) => e.id === id),
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const insets = useSafeAreaInsets();
  const { t, getCurrentLanguage } = useTranslation();
  const dateFnsLocale = { vi, ja, ko, en: enUS }[getCurrentLanguage()] ?? enUS;

  // If event not found, go back
  useEffect(() => {
    if (!event && id) {
      Alert.alert(t("common.error"), t("events.eventNotFound"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    }
  }, [event, id, t]);

  const handleEdit = () => {
    if (event && !isDeleting) {
      router.push(`/events/edit/${event.id}` as any);
    }
  };

  const handleDelete = () => {
    if (isDeleting) return;

    Alert.alert(t("common.confirmDelete"), t("events.deleteConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          if (!event) return;
          setIsDeleting(true);
          try {
            // Cancel notification if it exists
            if (event.notificationId) {
              await cancelNotification(event.notificationId);
            }

            // Proceed with normal delete flow
            await dispatch(deleteEvent(event.id)).unwrap();
            Alert.alert(t("common.success"), t("events.deleteEventSuccess"), [
              { text: t("common.ok"), onPress: () => router.back() },
            ]);
          } catch (error) {
            setIsDeleting(false);
            const errorMessage =
              error instanceof Error
                ? error.message
                : t("events.deleteEventFailed");
            Alert.alert(t("common.error"), errorMessage, [
              {
                text: t("common.tryAgain"),
                onPress: handleDelete,
              },
              {
                text: t("common.cancel"),
                style: "cancel",
              },
            ]);
          }
        },
      },
    ]);
  };

  if (!event) {
    return null;
  }

  const formatEventDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "EEEE, dd MMMM yyyy", { locale: dateFnsLocale });
    } catch {
      return dateStr;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return format(date, "dd/MM/yyyy HH:mm");
    } catch {
      return timestamp;
    }
  };

  const categoryLabel = t(`eventCategories.${event.category}`);
  const categoryIcon = CATEGORY_ICONS[event.category];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityLabel={t("common.back")}
            style={styles.headerIconButton}
            onPress={() => router.back()}
            disabled={isDeleting}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={t("common.delete")}
            style={styles.headerIconButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCopy}>
          <View style={styles.categoryBadge}>
            <Ionicons name={categoryIcon} size={17} color="#fff" />
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>
          <Text style={styles.title}>{event.title}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={19} color="#667eea" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t("common.date")}</Text>
              <Text style={styles.detailValue}>
                {formatEventDate(event.date)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={19} color="#667eea" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t("common.time")}</Text>
              <Text style={styles.detailValue}>{event.time}</Text>
            </View>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={19} color="#667eea" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("common.location")}</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
              </View>
            </View>
          )}

          {/* Reminder Info */}
          <View style={styles.detailRow}>
            <View
              style={[
                styles.detailIcon,
                event.reminderEnabled && styles.detailIconActive,
              ]}
            >
              <Ionicons
                name={
                  event.reminderEnabled ? "notifications" : "notifications-off"
                }
                size={20}
                color={event.reminderEnabled ? "#F59E0B" : "#999"}
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t("events.reminder")}</Text>
              <Text style={styles.detailValue}>
                {event.reminderEnabled
                  ? formatReminderTime(event.reminderMinutes, t)
                  : t("events.noReminder")}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.descriptionCard}>
            <View style={styles.descriptionHeader}>
              <Ionicons name="document-text" size={20} color="#667eea" />
              <Text style={styles.descriptionLabel}>
                {t("common.description")}
              </Text>
            </View>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.timestampsSection}>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>{t("common.createdAt")}</Text>
            <Text style={styles.timestampValue}>
              {formatTimestamp(event.createdAt)}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>{t("common.updatedAt")}</Text>
            <Text style={styles.timestampValue}>
              {formatTimestamp(event.updatedAt)}
            </Text>
          </View>
        </View>
        <View style={{ height: 12 }} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={[styles.editButton, isDeleting && styles.disabledButton]}
          onPress={handleEdit}
          disabled={isDeleting}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>{t("events.editEvent")}</Text>
        </TouchableOpacity>
      </View>

      {/* Deleting Overlay */}
      {isDeleting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>{t("common.deleting")}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    marginTop: 27,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 13,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 14,
  },
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 36,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    gap: 18,
    borderWidth: 1,
    borderColor: "#ECECF2",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EEF0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  detailIconActive: {
    backgroundColor: "#FFF4D6",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#85899A",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#252735",
    fontWeight: "600",
    lineHeight: 22,
  },
  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ECECF2",
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#505365",
  },
  descriptionText: {
    fontSize: 15,
    color: "#3F4250",
    lineHeight: 22,
  },
  timestampsSection: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#ECECF2",
  },
  timestampRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestampLabel: {
    fontSize: 12,
    color: "#85899A",
  },
  timestampValue: {
    fontSize: 12,
    color: "#6F7382",
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E9EAF0",
  },
  editButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#667eea",
    borderRadius: 14,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
