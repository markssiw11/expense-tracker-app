import ErrorBoundary from "@/src/components/ErrorBoundary";
import EventForm from "@/src/components/EventForm";
import { updateEvent } from "@/src/redux/reducers/eventSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { updateEventReminder } from "@/src/services/notificationService";
import { EventFormData } from "@/src/types/event.types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((state) =>
    state.events.events.find((e) => e.id === id),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  // If event not found, go back
  useEffect(() => {
    if (!event && id) {
      Alert.alert(t("common.error"), t("events.eventNotFound"), [
        { text: t("common.ok"), onPress: () => router.back() },
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

    // Check if reminder settings changed
    const reminderChanged =
      event.reminderEnabled !== formData.reminderEnabled ||
      event.reminderMinutes !== formData.reminderMinutes;

    const updatedData = {
      title: formData.title,
      description: formData.description || undefined,
      date: dateStr,
      time: timeStr,
      location: formData.location || undefined,
      category: formData.category,
      reminderEnabled: formData.reminderEnabled,
      reminderMinutes: formData.reminderMinutes,
      // Preserve original createdAt timestamp
      createdAt: event.createdAt,
    };

    try {
      // First, update the event in Redux and AsyncStorage
      await dispatch(updateEvent({ id: event.id, data: updatedData })).unwrap();

      // Handle notification management if reminder settings changed
      if (reminderChanged) {
        try {
          // Create a temporary event object with updated data for notification scheduling
          const updatedEvent = {
            ...event,
            ...updatedData,
          };

          // Update the notification (cancel old, schedule new if enabled)
          const newNotificationId = await updateEventReminder(
            updatedEvent,
            event.notificationId,
          );

          // Update the event with new notificationId (or clear it if reminder disabled)
          await dispatch(
            updateEvent({
              id: event.id,
              data: { notificationId: newNotificationId || undefined },
            }),
          ).unwrap();

          // Show appropriate message based on reminder state
          if (!formData.reminderEnabled && event.reminderEnabled) {
            // Reminder was disabled
            Alert.alert(
              t("common.success"),
              t("events.reminderDisabledSuccess"),
              [{ text: t("common.ok"), onPress: () => router.back() }],
            );
          } else if (formData.reminderEnabled && !newNotificationId) {
            // Reminder enabled but scheduling failed
            // Determine the likely reason based on event timing
            const eventDateTime = new Date(`${dateStr}T${timeStr}:00`);
            const reminderTime = new Date(
              eventDateTime.getTime() - formData.reminderMinutes * 60 * 1000,
            );
            const isPastEvent = reminderTime.getTime() <= Date.now();

            const message = isPastEvent
              ? t("events.reminderWarningPast")
              : t("events.reminderWarningPermission");

            Alert.alert(t("common.warning"), message, [
              { text: t("common.ok"), onPress: () => router.back() },
            ]);
          } else {
            // Success
            Alert.alert(t("common.success"), t("events.updateEventSuccess"), [
              { text: t("common.ok"), onPress: () => router.back() },
            ]);
          }
        } catch (notificationError) {
          // Notification update error - event is still saved
          console.error("Notification update error:", notificationError);
          Alert.alert(
            t("common.warning"),
            t("events.reminderWarningError") +
              (notificationError instanceof Error
                ? notificationError.message
                : "Không xác định"),
            [{ text: t("common.ok"), onPress: () => router.back() }],
          );
        }
      } else {
        // No reminder changes, just show success
        Alert.alert(t("common.success"), t("events.updateEventSuccess"), [
          { text: t("common.ok"), onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("events.updateEventFailed");
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
      Alert.alert(t("common.saving"), t("events.eventUpdating"), [
        { text: t("common.ok") },
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
    reminderEnabled: event.reminderEnabled,
    reminderMinutes: event.reminderMinutes,
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
