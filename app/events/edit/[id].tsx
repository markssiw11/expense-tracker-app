import React, { useState, useEffect } from "react";
import { Alert, View, ActivityIndicator, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { updateEvent } from "@/src/redux/reducers/eventSlice";
import { EventFormData } from "@/src/types/event.types";
import EventForm from "@/src/components/EventForm";
import ErrorBoundary from "@/src/components/ErrorBoundary";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((state) =>
    state.events.events.find((e) => e.id === id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If event not found, go back
  useEffect(() => {
    if (!event && id) {
      Alert.alert("Lỗi", "Không tìm thấy sự kiện", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [event, id]);

  const handleSubmit = async (formData: EventFormData) => {
    if (isSubmitting || !event) return;

    setIsSubmitting(true);

    // Format date and time
    const dateStr = formData.date.toISOString().split("T")[0]; // YYYY-MM-DD
    // Format time as HH:mm (24-hour format)
    const hours = formData.time.getHours().toString().padStart(2, "0");
    const minutes = formData.time.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    const updatedData = {
      title: formData.title,
      description: formData.description || undefined,
      date: dateStr,
      time: timeStr,
      location: formData.location || undefined,
      category: formData.category,
      // Preserve original createdAt timestamp
      createdAt: event.createdAt,
    };

    try {
      await dispatch(updateEvent({ id: event.id, data: updatedData })).unwrap();
      Alert.alert("Thành công", "Đã cập nhật sự kiện", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể cập nhật sự kiện";
      Alert.alert("Lỗi", errorMessage, [
        {
          text: "Thử lại",
          onPress: () => {
            setIsSubmitting(false);
            handleSubmit(formData);
          },
        },
        {
          text: "Hủy",
          style: "cancel",
          onPress: () => setIsSubmitting(false),
        },
      ]);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      Alert.alert("Đang lưu", "Sự kiện đang được cập nhật. Vui lòng đợi.", [
        { text: "OK" },
      ]);
      return;
    }
    router.back();
  };

  if (!event) {
    return null;
  }

  // Parse event data for form initial values
  const parseEventDate = (dateStr: string): Date => {
    try {
      return new Date(dateStr + "T00:00:00");
    } catch {
      return new Date();
    }
  };

  const parseEventTime = (timeStr: string): Date => {
    try {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date;
    } catch {
      return new Date();
    }
  };

  const initialData: Partial<EventFormData> = {
    title: event.title,
    description: event.description || "",
    date: parseEventDate(event.date),
    time: parseEventTime(event.time),
    location: event.location || "",
    category: event.category,
  };

  return (
    <ErrorBoundary>
      <EventForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        </View>
      )}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
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
  },
});
