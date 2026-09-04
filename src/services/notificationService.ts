import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "../i18n";
import { Event } from "../types/event.types";

/**
 * Notification Service
 * Handles scheduling, updating, and canceling local notifications for event reminders
 *
 * Edge Cases Handled:
 * 1. Past Events: Notifications are not scheduled for events in the past
 * 2. Permission Denied: Returns empty string if user denies notification permissions
 * 3. App Reinstall: Notifications are lost on reinstall, but reminder settings are preserved
 *    in AsyncStorage. The app should reschedule notifications on next launch.
 * 4. Timezone Changes: Uses local device time for all calculations
 * 5. Device Reboot: expo-notifications persists scheduled notifications across reboots
 * 6. Invalid Data: Validates all date/time inputs before scheduling
 */

// Configure notification handler to show notifications even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> - true if permissions granted, false otherwise
 */
export const requestPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permissions not granted, request them
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // For iOS, also request provisional permissions if needed
    if (Platform.OS === "ios" && finalStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowSound: true,
          allowBadge: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

/**
 * Calculate the trigger date for a notification based on event date/time and reminder minutes
 * @param event - The event to schedule reminder for
 * @returns Date object for when notification should trigger, or null if in the past
 *
 * Edge cases handled:
 * - Past events: Returns null if trigger time is in the past
 * - Invalid date/time format: Returns null and logs error
 * - Timezone changes: Uses local device time for consistency
 */
const calculateTriggerDate = (event: Event): Date | null => {
  try {
    // Parse event date and time
    const dateParts = event.date.split("-").map(Number);
    const timeParts = event.time.split(":").map(Number);

    // Validate date and time parts
    if (dateParts.length !== 3 || timeParts.length !== 2) {
      console.error("Invalid date or time format");
      return null;
    }

    const [year, month, day] = dateParts;
    const [hours, minutes] = timeParts;

    // Validate ranges
    if (
      year < 2000 ||
      year > 2100 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      console.error("Date or time values out of valid range");
      return null;
    }

    // Create event date object (uses local timezone)
    const eventDate = new Date(year, month - 1, day, hours, minutes);

    // Validate that the date was created successfully
    if (isNaN(eventDate.getTime())) {
      console.error("Failed to create valid date object");
      return null;
    }

    // Calculate trigger time by subtracting reminder minutes
    const triggerDate = new Date(
      eventDate.getTime() - event.reminderMinutes * 60 * 1000,
    );

    // Check if trigger date is in the past (with 1 minute buffer to avoid edge cases)
    const now = Date.now();
    const bufferMs = 60 * 1000; // 1 minute buffer

    if (triggerDate.getTime() <= now + bufferMs) {
      console.warn(
        "Trigger date is in the past or too soon, notification will not be scheduled",
      );
      return null;
    }

    return triggerDate;
  } catch (error) {
    console.error("Error calculating trigger date:", error);
    return null;
  }
};

/**
 * Format notification body with event time and location
 * @param event - The event to format body for
 * @returns Formatted notification body string
 */
const formatNotificationBody = (event: Event): string => {
  const body = i18n.t("events.notificationTime", { time: event.time });

  if (event.location) {
    return `${body}\n${i18n.t("events.notificationLocation", {
      location: event.location,
    })}`;
  }

  return body;
};

/**
 * Schedule a local notification for an event reminder
 * @param event - The event to schedule reminder for
 * @returns Promise<string> - The notification ID, or empty string if scheduling failed
 */
export const scheduleEventReminder = async (event: Event): Promise<string> => {
  try {
    // Check if reminder is enabled
    if (!event.reminderEnabled) {
      console.log("Reminder not enabled for event:", event.id);
      return "";
    }

    // Request permissions first
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn("Notification permissions not granted");
      return "";
    }

    // Calculate trigger date
    const triggerDate = calculateTriggerDate(event);
    if (!triggerDate) {
      console.warn("Cannot schedule notification for past event");
      return "";
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: event.title,
        body: formatNotificationBody(event),
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          eventId: event.id,
          eventDate: event.date,
          eventTime: event.time,
        },
      },
      trigger: triggerDate,
    });

    console.log("Notification scheduled:", notificationId, "for", triggerDate);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    throw new Error("Failed to schedule notification");
  }
};

/**
 * Cancel a scheduled notification by ID
 * @param notificationId - The ID of the notification to cancel
 */
export const cancelNotification = async (
  notificationId: string,
): Promise<void> => {
  try {
    if (!notificationId) {
      console.log("No notification ID provided, skipping cancellation");
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log("Notification cancelled:", notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
    // Don't throw error, as notification might already be delivered or cancelled
  }
};

/**
 * Update an event reminder by canceling the old notification and scheduling a new one
 * @param event - The event with updated reminder settings
 * @param oldNotificationId - The ID of the old notification to cancel (optional)
 * @returns Promise<string> - The new notification ID, or empty string if scheduling failed
 */
export const updateEventReminder = async (
  event: Event,
  oldNotificationId?: string,
): Promise<string> => {
  try {
    // Cancel old notification if it exists
    if (oldNotificationId) {
      await cancelNotification(oldNotificationId);
    }

    // Schedule new notification if reminder is enabled
    if (event.reminderEnabled) {
      return await scheduleEventReminder(event);
    }

    return "";
  } catch (error) {
    console.error("Error updating event reminder:", error);
    throw new Error("Failed to update event reminder");
  }
};

/**
 * Cancel all scheduled notifications (useful for testing/reset)
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All notifications cancelled");
  } catch (error) {
    console.error("Error canceling all notifications:", error);
  }
};

/**
 * Get all scheduled notifications (useful for debugging)
 */
export const getAllScheduledNotifications = async (): Promise<
  Notifications.NotificationRequest[]
> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
};

/**
 * Reschedule notifications for all events with reminders enabled
 * Useful after app reinstall or timezone changes
 * @param events - Array of events to reschedule notifications for
 * @returns Promise<Map<string, string>> - Map of event IDs to new notification IDs
 */
export const rescheduleAllNotifications = async (
  events: Event[],
): Promise<Map<string, string>> => {
  const notificationMap = new Map<string, string>();

  try {
    // Request permissions first
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn("Cannot reschedule notifications: permissions not granted");
      return notificationMap;
    }

    // Cancel all existing notifications first
    await cancelAllNotifications();

    // Schedule notifications for events with reminders enabled
    for (const event of events) {
      if (event.reminderEnabled) {
        try {
          const notificationId = await scheduleEventReminder(event);
          if (notificationId) {
            notificationMap.set(event.id, notificationId);
          }
        } catch (error) {
          console.error(
            `Failed to reschedule notification for event ${event.id}:`,
            error,
          );
          // Continue with other events even if one fails
        }
      }
    }

    console.log(
      `Rescheduled ${notificationMap.size} notifications out of ${
        events.filter((e) => e.reminderEnabled).length
      } events with reminders`,
    );
    return notificationMap;
  } catch (error) {
    console.error("Error rescheduling notifications:", error);
    return notificationMap;
  }
};

export default {
  requestPermissions,
  scheduleEventReminder,
  cancelNotification,
  updateEventReminder,
  cancelAllNotifications,
  getAllScheduledNotifications,
  rescheduleAllNotifications,
};
