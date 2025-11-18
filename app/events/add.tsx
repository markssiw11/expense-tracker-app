import React, { useState } from "react";
import { Alert, View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAppDispatch } from "@/src/redux/store";
import { addEvent } from "@/src/redux/reducers/eventSlice";
import { Event, EventFormData } from "@/src/types/event.types";
import EventForm from "@/src/components/EventForm";
import ErrorBoundary from "@/src/components/ErrorBoundary";

export default function AddEventScreen() {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: EventFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Format date and time
    const dateStr = formData.date.toISOString().split("T")[0]; // YYYY-MM-DD
    // Format time as HH:mm (24-hour format)
    const hours = formData.time.getHours().toString().padStart(2, "0");
    const minutes = formData.time.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    const newEvent: Event = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      title: formData.title,
      description: formData.description || undefined,
      date: dateStr,
      time: timeStr,
      location: formData.location || undefined,
      category: formData.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dispatch(addEvent(newEvent)).unwrap();
      Alert.alert("Thành công", "Đã thêm sự kiện mới", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể thêm sự kiện";
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
      Alert.alert("Đang lưu", "Sự kiện đang được lưu. Vui lòng đợi.", [
        { text: "OK" },
      ]);
      return;
    }
    router.back();
  };

  return (
    <ErrorBoundary>
      <EventForm
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
