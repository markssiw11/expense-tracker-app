import CustomHeader from "@/src/components/CustomHeader";
import { useTranslation } from "@/src/hooks/useTranslation";
import { deleteEvent } from "@/src/redux/reducers/eventSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { cancelNotification } from "@/src/services/notificationService";
import { EventCategory } from "@/src/types/event.types";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Category colors matching design document
const CATEGORY_COLORS: Record<EventCategory, string> = {
  Work: "#3B82F6",
  Personal: "#A855F7",
  Health: "#10B981",
  Family: "#F59E0B",
  Other: "#6B7280",
};

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
  const { t } = useTranslation();

  // If event not found, go back
  useEffect(() => {
    if (!event && id) {
      Alert.alert(t("common.error"), t("events.eventNotFound"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    }
  }, [event, id]);

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
      return format(date, "EEEE, dd MMMM yyyy", { locale: vi });
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

  const categoryColor = CATEGORY_COLORS[event.category];
  const categoryLabel = t(`eventCategories.${event.category}`);
  const categoryIcon = CATEGORY_ICONS[event.category];

  return (
    <View style={styles.container}>
      <CustomHeader title="" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Category Badge */}
        <View
          style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
        >
          <Ionicons name={categoryIcon} size={20} color="#fff" />
          <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Date and Time */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Ngày</Text>
              <Text style={styles.detailValue}>
                {formatEventDate(event.date)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color="#007AFF" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Thời gian</Text>
              <Text style={styles.detailValue}>{event.time}</Text>
            </View>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={20} color="#007AFF" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Địa điểm</Text>
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
              <Ionicons name="document-text" size={20} color="#666" />
              <Text style={styles.descriptionLabel}>Mô tả</Text>
            </View>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.timestampsSection}>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>Tạo lúc:</Text>
            <Text style={styles.timestampValue}>
              {formatTimestamp(event.createdAt)}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>Cập nhật:</Text>
            <Text style={styles.timestampValue}>
              {formatTimestamp(event.updatedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Deleting Overlay */}
      {isDeleting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Đang xóa...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    lineHeight: 36,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
  },
  detailIconActive: {
    backgroundColor: "#FEF3C7",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    color: "#666",
  },
  descriptionText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  timestampsSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  timestampRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestampLabel: {
    fontSize: 12,
    color: "#999",
  },
  timestampValue: {
    fontSize: 12,
    color: "#666",
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
