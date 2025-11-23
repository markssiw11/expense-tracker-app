import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import {
  setSelectedDate,
  setViewMode,
  setSelectedCategory,
  selectMarkedDates,
  selectSelectedDate,
  selectViewMode,
  selectSelectedCategory,
  selectTodayEvents,
  selectFilteredEvents,
  selectEventsLoading,
  selectEventsError,
  clearError,
  loadEvents,
} from "@/src/redux/reducers/eventSlice";
import { Event, EventCategory } from "@/src/types/event.types";
import { CalendarView } from "@/src/components/CalendarView";
import { EventList } from "@/src/components/EventList";
import { Colors } from "@/constants/theme";
import ErrorBoundary from "@/src/components/ErrorBoundary";

// Separate component to avoid conditional hook calls
interface CalendarContentProps {
  viewMode: "calendar" | "list";
  markedDates: any;
  selectedDate: string | null;
  selectedDateEvents: Event[];
  handleDateSelect: (date: string) => void;
  handleEventPress: (eventId: string) => void;
  formatSelectedDate: (date: string | null) => string;
  colors: any;
}

function CalendarContent({
  viewMode,
  markedDates,
  selectedDate,
  selectedDateEvents,
  handleDateSelect,
  handleEventPress,
  formatSelectedDate,
  colors,
}: CalendarContentProps) {
  const filteredEvents = useAppSelector(selectFilteredEvents);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Get upcoming events for list view
  const upcomingEvents = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return [...filteredEvents]
      .filter((e) => e.date >= today)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [filteredEvents]);

  // Animate view mode transitions
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [viewMode, fadeAnim]);

  if (viewMode === "calendar") {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Calendar View */}
        <View style={styles.calendarContainer}>
          <CalendarView
            markedDates={markedDates}
            selectedDate={selectedDate || ""}
            onDateSelect={handleDateSelect}
          />
        </View>
        {selectedDate && (
          <View style={styles.selectedDateSection}>
            <Text style={[styles.selectedDateTitle, { color: colors.text }]}>
              {formatSelectedDate(selectedDate)}
            </Text>
            <EventList
              events={selectedDateEvents}
              onEventPress={handleEventPress}
              emptyMessage="Không có sự kiện nào trong ngày này."
              scrollEnabled={false}
            />
          </View>
        )}
      </Animated.View>
    );
  }

  // List View - All Upcoming Events
  return (
    <Animated.View style={[styles.listViewContainer, { opacity: fadeAnim }]}>
      <Text style={[styles.listViewTitle, { color: colors.text }]}>
        Sự kiện sắp tới
      </Text>
      <EventList
        events={upcomingEvents}
        onEventPress={handleEventPress}
        emptyMessage="Chưa có lịch hẹn nào. Nhấn + để thêm sự kiện mới."
        scrollEnabled={false}
      />
    </Animated.View>
  );
}

export default function CalendarTab() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Refs for auto-scrolling
  const scrollViewRef = React.useRef<ScrollView>(null);
  const categoryRefs = React.useRef<{ [key: string]: View | null }>({});

  // Redux state
  const markedDates = useAppSelector(selectMarkedDates);
  const selectedDate = useAppSelector(selectSelectedDate);
  const viewMode = useAppSelector(selectViewMode);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const todayEvents = useAppSelector(selectTodayEvents);
  const loading = useAppSelector(selectEventsLoading);
  const error = useAppSelector(selectEventsError);

  // Get events for selected date
  const filteredEvents = useAppSelector(selectFilteredEvents);
  const selectedDateEvents = React.useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((event) => event.date === selectedDate);
  }, [filteredEvents, selectedDate]);

  // Initialize selected date to today
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      dispatch(setSelectedDate(today));
    }
  }, [selectedDate, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error, [
        {
          text: "Thử lại",
          onPress: () => {
            dispatch(clearError());
            dispatch(loadEvents());
          },
        },
        {
          text: "Đóng",
          onPress: () => dispatch(clearError()),
          style: "cancel",
        },
      ]);
    }
  }, [error, dispatch]);

  // Handle date selection
  const handleDateSelect = (date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setSelectedDate(date));
  };

  // Handle view mode toggle
  const handleToggleViewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setViewMode(viewMode === "calendar" ? "list" : "calendar"));
  };

  // Handle event press
  const handleEventPress = (eventId: string) => {
    router.push(`/events/${eventId}` as any);
  };

  // Handle add event
  const handleAddEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/events/add" as any);
  };

  // Handle category filter with auto-scroll
  const handleCategoryFilter = (category: EventCategory | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setSelectedCategory(category));

    // Auto-scroll to center the selected tab
    setTimeout(() => {
      const key = category || "all";
      const targetRef = categoryRefs.current[key];

      if (targetRef && scrollViewRef.current) {
        targetRef.measureLayout(
          scrollViewRef.current as any,
          (x, y, width, height) => {
            const screenWidth = Dimensions.get("window").width;
            const scrollToX = x - screenWidth / 2 + width / 2;
            scrollViewRef.current?.scrollTo({
              x: Math.max(0, scrollToX),
              animated: true,
            });
          },
          () => {}
        );
      }
    }, 50);
  };

  // Format selected date for display
  const formatSelectedDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hôm nay";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Ngày mai";
    }

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

  // Get category info (icon, color, label)
  const getCategoryInfo = (category: EventCategory) => {
    const categoryMap = {
      Work: {
        icon: "briefcase" as const,
        color: "#3B82F6",
        label: "Công việc",
      },
      Personal: { icon: "person" as const, color: "#A855F7", label: "Cá nhân" },
      Health: { icon: "fitness" as const, color: "#10B981", label: "Sức khỏe" },
      Family: { icon: "people" as const, color: "#F59E0B", label: "Gia đình" },
      Other: {
        icon: "ellipsis-horizontal" as const,
        color: "#6B7280",
        label: "Khác",
      },
    };
    return categoryMap[category];
  };

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Lịch</Text>
            <TouchableOpacity
              onPress={handleToggleViewMode}
              style={styles.viewModeButton}
            >
              <Ionicons
                name={viewMode === "calendar" ? "list" : "calendar"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Category Filter Chips */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterContainer}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            ref={(ref) => {
              categoryRefs.current["all"] = ref;
            }}
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
              !selectedCategory && { backgroundColor: "#667eea" },
            ]}
            onPress={() => handleCategoryFilter(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          {(
            ["Work", "Personal", "Health", "Family", "Other"] as EventCategory[]
          ).map((category) => {
            const categoryInfo = getCategoryInfo(category);
            const isActive = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                ref={(ref) => {
                  categoryRefs.current[category] = ref;
                }}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                  isActive && { backgroundColor: categoryInfo.color },
                ]}
                onPress={() => handleCategoryFilter(category)}
              >
                <Ionicons
                  name={categoryInfo.icon}
                  size={16}
                  color={isActive ? "#fff" : categoryInfo.color}
                  style={styles.categoryChipIcon}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isActive ? "#fff" : categoryInfo.color },
                  ]}
                >
                  {categoryInfo.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Đang tải sự kiện...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Calendar or List View */}
            <CalendarContent
              viewMode={viewMode}
              markedDates={markedDates}
              selectedDate={selectedDate}
              selectedDateEvents={selectedDateEvents}
              handleDateSelect={handleDateSelect}
              handleEventPress={handleEventPress}
              formatSelectedDate={formatSelectedDate}
              colors={colors}
            />
          </ScrollView>
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddEvent}
          disabled={loading}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
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
    letterSpacing: 0.5,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  todaySection: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  todaySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  todaySectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  todayEmptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  todayEmptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  calendarContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedDateSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  selectedDateTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  listViewContainer: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  listViewTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  categoryFilterContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryChipActive: {
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 0.2,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
