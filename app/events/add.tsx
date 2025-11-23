import React, { useState } from "react";
import { Alert, View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAppDispatch } from "@/src/redux/store";
import { addEvent, updateEvent } from "@/src/redux/reducers/eventSlice";
import { Event, EventFormData } from "@/src/types/event.types";
import EventForm from "@/src/components/EventForm";
import ErrorBoundary from "@/src/components/ErrorBoundary";
import { scheduleEventReminder } from "@/src/services/notificationService";

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
      reminderEnabled: formData.reminderEnabled,
      reminderMinutes: formData.reminderMinutes,
      notificationId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // First, save the event to Redux and AsyncStorage
      await dispatch(addEvent(newEvent)).unwrap();

      // If reminder is enabled, schedule the notification
      if (newEvent.reminderEnabled) {
        try {
          const notificationId = await scheduleEventReminder(newEvent);

          // If notification was scheduled successfully, update the event with notificationId
          if (notificationId) {
            await dispatch(
              updateEvent({
                id: newEvent.id,
                data: { notificationId },
              })
            ).unwrap();
          } else {
            // Notification scheduling failed (permissions denied, past event, or invalid data)
            // Determine the likely reason based on event timing
            const eventDateTime = new Date(
              `${newEvent.date}T${newEvent.time}:00`
            );
            const reminderTime = new Date(
              eventDateTime.getTime() - newEvent.reminderMinutes * 60 * 1000
            );
            const isPastEvent = reminderTime.getTime() <= Date.now();

            const message = isPastEvent
              ? "Sự kiện đã được lưu nhưng không thể đặt nhắc nhở vì thời gian nhắc nhở đã qua. Vui lòng chọn thời gian sự kiện trong tương lai."
              : "Sự kiện đã được lưu nhưng không thể đặt nhắc nhở. Vui lòng kiểm tra quyền thông báo trong cài đặt thiết bị.";

            Alert.alert("Cảnh báo", message, [{ text: "OK" }]);
          }
        } catch (notificationError) {
          // Notification scheduling error - event is still saved
          console.error("Notification scheduling error:", notificationError);
          Alert.alert(
            "Cảnh báo",
            "Sự kiện đã được lưu nhưng không thể đặt nhắc nhở. Lỗi: " +
              (notificationError instanceof Error
                ? notificationError.message
                : "Không xác định"),
            [{ text: "OK" }]
          );
        }
      }

      // Success - navigate back
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
