import ErrorBoundary from "@/src/components/ErrorBoundary";
import EventForm from "@/src/components/EventForm";
import { useTranslation } from "@/src/hooks/useTranslation";
import { addEvent, updateEvent } from "@/src/redux/reducers/eventSlice";
import { useAppDispatch } from "@/src/redux/store";
import { scheduleEventReminder } from "@/src/services/notificationService";
import { Event, EventFormData } from "@/src/types/event.types";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function AddEventScreen() {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

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
              }),
            ).unwrap();
          } else {
            // Notification scheduling failed (permissions denied, past event, or invalid data)
            // Determine the likely reason based on event timing
            const eventDateTime = new Date(
              `${newEvent.date}T${newEvent.time}:00`,
            );
            const reminderTime = new Date(
              eventDateTime.getTime() - newEvent.reminderMinutes * 60 * 1000,
            );
            const isPastEvent = reminderTime.getTime() <= Date.now();

            const message = isPastEvent
              ? t("events.reminderWarningPast")
              : t("events.reminderWarningPermission");

            Alert.alert(t("common.warning"), message, [
              { text: t("common.ok") },
            ]);
          }
        } catch (notificationError) {
          // Notification scheduling error - event is still saved
          console.error("Notification scheduling error:", notificationError);
          Alert.alert(
            t("common.warning"),
            t("events.reminderWarningError") +
              (notificationError instanceof Error
                ? notificationError.message
                : "Không xác định"),
            [{ text: t("common.ok") }],
          );
        }
      }

      // Success - navigate back
      Alert.alert(t("common.success"), t("events.addEventSuccess"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("events.addEventFailed");
      Alert.alert(t("common.error"), errorMessage, [
        {
          text: t("common.tryAgain"),
          onPress: () => {
            setIsSubmitting(false);
            handleSubmit(formData);
          },
        },
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () => setIsSubmitting(false),
        },
      ]);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      Alert.alert(t("common.saving"), t("events.eventSaving"), [
        { text: t("common.ok") },
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
