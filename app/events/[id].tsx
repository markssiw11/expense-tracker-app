import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { deleteEvent } from "@/src/redux/reducers/eventSlice";
import { EventCategory } from "@/src/types/event.types";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import ErrorBoundary from "@/src/components/ErrorBoundary";

// Category colors matching design document
const CATEGORY_COLORS: Record<EventCategory, string> = {
  Work: "#3B82F6",
  Personal: "#A855F7",
  Health: "#10B981",
  Family: "#F59E0B",
  Other: "#6B7280",
};

// Category labels in Vietnamese
const CATEGORY_LABELS: Record<EventCategory, string> = {
  Work: "Công việc",
  Personal: "Cá nhân",
  Health: "Sức khỏe",
  Family: "Gia đình",
  Other: "Khác",
};

// Category icons
const CATEGORY_ICONS: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  Work: "briefcase",
  Personal: "person",
  Health: "fitness",
  Family: "people",
  Other: "ellipsis-horizontal-circle",
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((state) =>
    state.events.events.find((e) => e.id === id)
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // If event not found, go back
  useEffect(() => {
    if (!event && id) {
      Alert.alert("Lỗi", "Không tìm thấy sự kiện", [
        { text: "OK", onPress: () => router.back() },
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

    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa sự kiện này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          if (!event) return;
          setIsDeleting(true);
          try {
            await dispatch(deleteEvent(event.id)).unwrap();
            Alert.alert("Thành công", "Đã xóa sự kiện", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (error) {
            setIsDeleting(false);
            const errorMessage =
              error instanceof Error ? error.message : "Không thể xóa sự kiện";
            Alert.alert("Lỗi", errorMessage, [
              {
                text: "Thử lại",
                onPress: handleDelete,
              },
              {
                text: "Hủy",
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
  const categoryLabel = CATEGORY_LABELS[event.category];
  const categoryIcon = CATEGORY_ICONS[event.category];

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Header with Actions */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isDeleting}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEdit}
              disabled={isDeleting}
            >
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              )}
            </TouchableOpacity>
          </View>
        </View>

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
    </ErrorBoundary>
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
