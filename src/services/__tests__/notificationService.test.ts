/**
 * Notification Service Tests
 *
 * These tests verify the core functionality of the notification service.
 * Note: Some tests require manual verification as they involve actual notifications.
 *
 * @note This file uses require() for dynamic imports to avoid circular dependencies
 * and to allow running tests without importing the entire notification service at module load time.
 */

import { Event, ReminderTime } from "../../types/event.types";

// Mock event data for testing
const createMockEvent = (overrides?: Partial<Event>): Event => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

  return {
    id: "test-event-" + Date.now(),
    title: "Test Event",
    date: futureDate.toISOString().split("T")[0],
    time: "14:00",
    category: "Personal",
    reminderEnabled: true,
    reminderMinutes: 5 as ReminderTime,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
};

/**
 * Test Helper: Create event with past time
 */
export const createPastEvent = (): Event => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  return createMockEvent({
    date: pastDate.toISOString().split("T")[0],
    time: pastDate.toTimeString().substring(0, 5),
  });
};

/**
 * Test Helper: Create event with future time
 */
export const createFutureEvent = (minutesFromNow: number): Event => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + minutesFromNow * 60 * 1000);

  return createMockEvent({
    date: futureDate.toISOString().split("T")[0],
    time: futureDate.toTimeString().substring(0, 5),
  });
};

/**
 * Test Helper: Create event with invalid date
 */
export const createInvalidDateEvent = (): Event => {
  return createMockEvent({
    date: "2024-13-45", // Invalid month and day
    time: "25:99", // Invalid time
  });
};

/**
 * Test Helper: Validate notification scheduling
 * This is a manual test helper - run in the app and check console logs
 */
export const testNotificationScheduling = async () => {
  const { scheduleEventReminder } = require("../notificationService");

  console.log("=== Notification Service Test Suite ===\n");

  // Test 1: Schedule notification for future event
  console.log("Test 1: Schedule notification for future event");
  const futureEvent = createFutureEvent(10);
  try {
    const notificationId = await scheduleEventReminder(futureEvent);
    console.log(
      notificationId
        ? `✅ PASS: Notification scheduled with ID: ${notificationId}`
        : "❌ FAIL: No notification ID returned"
    );
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  // Test 2: Try to schedule notification for past event
  console.log("\nTest 2: Schedule notification for past event");
  const pastEvent = createPastEvent();
  try {
    const notificationId = await scheduleEventReminder(pastEvent);
    console.log(
      !notificationId
        ? "✅ PASS: Past event correctly rejected (no notification ID)"
        : "❌ FAIL: Past event should not be scheduled"
    );
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  // Test 3: Try to schedule notification with invalid date
  console.log("\nTest 3: Schedule notification with invalid date");
  const invalidEvent = createInvalidDateEvent();
  try {
    const notificationId = await scheduleEventReminder(invalidEvent);
    console.log(
      !notificationId
        ? "✅ PASS: Invalid date correctly rejected"
        : "❌ FAIL: Invalid date should be rejected"
    );
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  // Test 4: Schedule notification with reminder disabled
  console.log("\nTest 4: Schedule notification with reminder disabled");
  const disabledReminderEvent = createFutureEvent(10);
  disabledReminderEvent.reminderEnabled = false;
  try {
    const notificationId = await scheduleEventReminder(disabledReminderEvent);
    console.log(
      !notificationId
        ? "✅ PASS: Disabled reminder correctly skipped"
        : "❌ FAIL: Disabled reminder should not schedule notification"
    );
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  // Test 5: Test all reminder time options
  console.log("\nTest 5: Test all reminder time options");
  const reminderTimes: ReminderTime[] = [5, 10, 15, 30, 60, 1440];
  for (const minutes of reminderTimes) {
    const event = createFutureEvent(minutes + 5); // Event time > reminder time
    event.reminderMinutes = minutes;
    try {
      const notificationId = await scheduleEventReminder(event);
      console.log(
        notificationId
          ? `✅ PASS: ${minutes} minutes reminder scheduled`
          : `❌ FAIL: ${minutes} minutes reminder failed`
      );
    } catch (error) {
      console.log(`❌ FAIL: ${minutes} minutes - ${error}`);
    }
  }

  console.log("\n=== Test Suite Complete ===");
  console.log(
    "Check device notifications to verify they appear at correct times"
  );
};

/**
 * Test Helper: Test notification cancellation
 */
export const testNotificationCancellation = async () => {
  const {
    scheduleEventReminder,
    cancelNotification,
  } = require("../notificationService");

  console.log("=== Notification Cancellation Test ===\n");

  // Schedule a notification
  const event = createFutureEvent(10);
  const notificationId = await scheduleEventReminder(event);

  if (!notificationId) {
    console.log(
      "❌ FAIL: Could not schedule notification for cancellation test"
    );
    return;
  }

  console.log(`Scheduled notification: ${notificationId}`);

  // Cancel it
  try {
    await cancelNotification(notificationId);
    console.log("✅ PASS: Notification cancelled successfully");
    console.log("Verify that notification does NOT appear at scheduled time");
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }
};

/**
 * Test Helper: Test notification update
 */
export const testNotificationUpdate = async () => {
  const {
    scheduleEventReminder,
    updateEventReminder,
  } = require("../notificationService");

  console.log("=== Notification Update Test ===\n");

  // Schedule initial notification
  const event = createFutureEvent(15);
  event.reminderMinutes = 5;
  const oldNotificationId = await scheduleEventReminder(event);

  if (!oldNotificationId) {
    console.log("❌ FAIL: Could not schedule initial notification");
    return;
  }

  console.log(`Initial notification: ${oldNotificationId}`);

  // Update to different reminder time
  event.reminderMinutes = 10;
  try {
    const newNotificationId = await updateEventReminder(
      event,
      oldNotificationId
    );
    console.log(
      newNotificationId && newNotificationId !== oldNotificationId
        ? `✅ PASS: Notification updated to: ${newNotificationId}`
        : "❌ FAIL: Notification update failed"
    );
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }
};

/**
 * Test Helper: Test reschedule all notifications
 */
export const testRescheduleAll = async () => {
  const { rescheduleAllNotifications } = require("../notificationService");

  console.log("=== Reschedule All Notifications Test ===\n");

  // Create multiple events
  const events: Event[] = [
    createFutureEvent(10),
    createFutureEvent(20),
    createFutureEvent(30),
  ];

  try {
    const notificationMap = await rescheduleAllNotifications(events);
    console.log(
      notificationMap.size === events.length
        ? `✅ PASS: Rescheduled ${notificationMap.size} notifications`
        : `⚠️ PARTIAL: Rescheduled ${notificationMap.size}/${events.length} notifications`
    );

    // Log the mapping
    notificationMap.forEach((notificationId: string, eventId: string) => {
      console.log(`  Event ${eventId} -> Notification ${notificationId}`);
    });
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }
};

/**
 * Run all tests
 * Import this in your app and call it from a test screen or button
 */
export const runAllNotificationTests = async () => {
  console.log("\n🧪 Starting Notification Service Test Suite\n");

  await testNotificationScheduling();
  console.log("\n" + "=".repeat(50) + "\n");

  await testNotificationCancellation();
  console.log("\n" + "=".repeat(50) + "\n");

  await testNotificationUpdate();
  console.log("\n" + "=".repeat(50) + "\n");

  await testRescheduleAll();
  console.log("\n" + "=".repeat(50) + "\n");

  console.log("✅ All automated tests complete!");
  console.log("📱 Check device notifications to verify they appear correctly");
  console.log("📋 Use the manual testing checklist for comprehensive testing");
};

// Export test helpers
export default {
  createMockEvent,
  createPastEvent,
  createFutureEvent,
  createInvalidDateEvent,
  testNotificationScheduling,
  testNotificationCancellation,
  testNotificationUpdate,
  testRescheduleAll,
  runAllNotificationTests,
};
