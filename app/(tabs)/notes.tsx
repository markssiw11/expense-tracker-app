import {
  getNoteCategories,
  getNoteCategoryConfig,
} from "@/src/constants/NoteCategories";
import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  loadNotes,
  setNoteFilters,
  setSearchQuery,
  togglePinNote,
} from "@/src/redux/reducers/noteSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { Note, NoteCategory } from "@/src/types/note.types";
import { formatDate } from "@/src/utils/expenseUtils";
import {
  filterNotesByCategories,
  filterNotesByQuery,
  filterNotesByTags,
  getAllTags,
  separatePinnedNotes,
  sortNotes,
} from "@/src/utils/noteUtils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotesTab() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();
  const { notes, loading, searchQuery, sortBy, filters } = useAppSelector(
    (state) => state.notes,
  );
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    dispatch(loadNotes());
  }, [dispatch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(localSearchQuery));
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, dispatch]);

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = filterNotesByQuery(notes, searchQuery);

    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filterNotesByCategories(filtered, filters.categories);
    }

    // Apply tag filters
    if (filters.tags.length > 0) {
      filtered = filterNotesByTags(filtered, filters.tags);
    }

    filtered = sortNotes(filtered, sortBy);
    return separatePinnedNotes(filtered);
  }, [notes, searchQuery, sortBy, filters]);

  const handleNotePress = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  const handlePinToggle = (noteId: string) => {
    dispatch(togglePinNote(noteId));
  };

  const toggleCategoryFilter = (category: NoteCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    dispatch(setNoteFilters({ ...filters, categories: newCategories }));
  };

  const toggleTagFilter = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];

    dispatch(setNoteFilters({ ...filters, tags: newTags }));
  };

  const clearFilters = () => {
    dispatch(setNoteFilters({ categories: [], tags: [] }));
  };

  const availableTags = useMemo(() => getAllTags(notes), [notes]);

  // Get note categories with translations
  const NOTE_CATEGORIES = useMemo(() => getNoteCategories(t), [t]);

  const renderNoteItem = ({
    item,
    isPinned,
  }: {
    item: Note;
    isPinned?: boolean;
  }) => {
    const categoryConfig = getNoteCategoryConfig(item.category, t);

    return (
      <TouchableOpacity
        style={styles.noteItem}
        onPress={() => handleNotePress(item.id)}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteHeaderLeft}>
            {categoryConfig && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryConfig.color },
                ]}
              >
                <Ionicons
                  name={categoryConfig.icon as any}
                  size={16}
                  color="#fff"
                />
              </View>
            )}
            <Text style={styles.categoryLabel}>
              {categoryConfig?.label || item.category}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handlePinToggle(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={item.isPinned ? "pin" : "pin-outline"}
              size={20}
              color={item.isPinned ? "#FF9500" : "#999"}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.noteTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.noteContent} numberOfLines={2}>
          {item.content}
        </Text>

        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>{formatDate(item.date)}</Text>
          {item.amount && (
            <Text style={styles.noteAmount}>{formatCurrency(item.amount)}</Text>
          )}
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>{t("notes.noNotes")}</Text>
      <Text style={styles.emptyText}>{t("notes.addFirstNote")}</Text>
    </View>
  );

  const renderSearchEmptyState = () => (
    <View style={styles.listEmptyState}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>{t("common.noData")}</Text>
      <Text style={styles.emptyText}>{t("notes.searchNotes")}</Text>
    </View>
  );

  if (loading && notes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const hasNotes = notes.length > 0;
  const hasResults =
    filteredAndSortedNotes.pinned.length > 0 ||
    filteredAndSortedNotes.unpinned.length > 0;

  // Search + filters live inside the list header so they scroll away with the
  // content, giving the notes list more room once the user scrolls up.
  const renderListHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t("notes.searchNotes")}
          value={localSearchQuery}
          onChangeText={setLocalSearchQuery}
        />
        {localSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setLocalSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      {NOTE_CATEGORIES.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t("expenses.category")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filters.categories.length > 0 && (
              <TouchableOpacity
                style={styles.clearFilterChip}
                onPress={clearFilters}
              >
                <Ionicons name="close-circle" size={16} color="#FF3B30" />
                <Text style={styles.clearFilterText}>
                  {t("common.clearFilters")}
                </Text>
              </TouchableOpacity>
            )}
            {NOTE_CATEGORIES.map((category) => {
              const isSelected = filters.categories.includes(category.key);
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.filterChip,
                    isSelected && {
                      backgroundColor: category.color,
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => toggleCategoryFilter(category.key)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={16}
                    color={isSelected ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t("common.tags")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {availableTags.slice(0, 10).map((tag) => {
              const isSelected = filters.tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagFilterChip,
                    isSelected && styles.tagFilterChipSelected,
                  ]}
                  onPress={() => toggleTagFilter(tag)}
                >
                  <Text
                    style={[
                      styles.tagFilterText,
                      isSelected && styles.tagFilterTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Pinned section title */}
      {filteredAndSortedNotes.pinned.length > 0 && (
        <View style={styles.sectionHeader}>
          <Ionicons name="pin" size={16} color="#FF9500" />
          <Text style={styles.sectionTitle}>
            {t("notes.pinned") || "Pinned"}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t("notes.title")}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/notes/add")}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Notes List */}
      {!hasNotes ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={
            hasResults
              ? [
                  ...filteredAndSortedNotes.pinned.map((note) => ({
                    ...note,
                    isPinned: true,
                  })),
                  ...filteredAndSortedNotes.unpinned,
                ]
              : []
          }
          renderItem={({ item }) =>
            renderNoteItem({ item, isPinned: item.isPinned })
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderSearchEmptyState}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  filterSection: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextSelected: {
    color: "#fff",
  },
  clearFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFE5E5",
    gap: 6,
  },
  clearFilterText: {
    fontSize: 13,
    color: "#FF3B30",
    fontWeight: "600",
  },
  tagFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  tagFilterChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tagFilterText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  tagFilterTextSelected: {
    color: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF9500",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  noteItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noteHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  noteTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
    lineHeight: 26,
  },
  noteContent: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 14,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteDate: {
    fontSize: 12,
    color: "#999",
  },
  noteAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 11,
    color: "#999",
    alignSelf: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  listEmptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
