import { getNoteCategoryConfig } from "@/src/constants/NoteCategories";
import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import { useTranslation } from "@/src/hooks/useTranslation";
import { deleteNote } from "@/src/redux/reducers/noteSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { formatDate } from "@/src/utils/expenseUtils";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const note = useAppSelector((state) =>
    state.notes.notes.find((n) => n.id === id),
  );
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();

  // If note not found, go back
  useEffect(() => {
    if (!note && id) {
      Alert.alert(t("common.error"), t("notes.noteNotFound"));
      router.back();
    }
  }, [note, id]);

  const handleEdit = () => {
    if (note) {
      router.push(`/notes/edit/${note.id}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(t("common.confirmDelete"), t("notes.deleteConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          if (!note) return;
          try {
            await dispatch(deleteNote(note.id)).unwrap();
            Alert.alert(t("common.success"), t("notes.deleteNoteSuccess"));
            router.back();
          } catch {
            Alert.alert(t("common.error"), t("notes.deleteNoteFailed"));
          }
        },
      },
    ]);
  };

  if (!note) {
    return null;
  }

  const categoryConfig = getNoteCategoryConfig(note.category, t);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return format(date, "dd/MM/yyyy HH:mm");
    } catch {
      return timestamp;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Actions */}
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Pin Indicator */}
        {note.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={16} color="#FF9500" />
            <Text style={styles.pinnedText}>{t("notes.pinnedBadge")}</Text>
          </View>
        )}

        {/* Category Badge */}
        {categoryConfig && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryConfig.color },
            ]}
          >
            <Ionicons
              name={categoryConfig.icon as any}
              size={20}
              color="#fff"
            />
            <Text style={styles.categoryBadgeText}>{categoryConfig.label}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{note.title}</Text>

        {/* Date and Amount */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{formatDate(note.date)}</Text>
          </View>
          {note.amount && (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.metaAmount}>
                {formatCurrency(note.amount)}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {note.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Content */}
        <View style={styles.contentSection}>
          <Text style={styles.content}>{note.content}</Text>
        </View>

        {/* Timestamps */}
        <View style={styles.timestampsSection}>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>{t("common.createdAt")}</Text>
            <Text style={styles.timestampValue}>
              {formatTimestamp(note.createdAt)}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>{t("common.updatedAt")}</Text>
            <Text style={styles.timestampValue}>
              {formatTimestamp(note.updatedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>
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
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    gap: 4,
  },
  pinnedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9500",
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
    marginBottom: 16,
    lineHeight: 36,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  metaAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  contentSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
});
