# Event Reminders - Edge Cases Documentation

This document describes how the event reminder feature handles various edge cases and error scenarios.

## Overview

The event reminder feature uses `expo-notifications` to schedule local notifications for events. This document outlines how the system handles edge cases to ensure a robust user experience.

## Edge Cases Handled

### 1. Scheduling Notification for Past Events

**Scenario**: User tries to create or edit an event with a reminder time that has already passed.

**Handling**:

- The `calculateTriggerDate` function in `notificationService.ts` checks if the reminder time is in the past
- Returns `null` if the trigger time is <= current time (with 1-minute buffer)
- User receives a specific error message: "Sự kiện đã được lưu nhưng không thể đặt nhắc nhở vì thời gian nhắc nhở đã qua. Vui lòng chọn thời gian sự kiện trong tương lai."
- Event is still saved, but without a notification

**Code Location**:

- `ExpenseTrackerApp/src/services/notificationService.ts` - `calculateTriggerDate()`
- `ExpenseTrackerApp/app/events/add.tsx` - Error handling in `handleSubmit()`
- `ExpenseTrackerApp/app/events/edit/[id].tsx` - Error handling in `handleSubmit()`

### 2. Notification Permission Denied

**Scenario**: User denies notification permissions when prompted or has disabled them in device settings.

**Handling**:

- The `requestPermissions` function attempts to get notification permissions
- Returns `false` if permissions are denied
- `scheduleEventReminder` returns empty string if permissions not granted
- User receives error message: "Sự kiện đã được lưu nhưng không thể đặt nhắc nhở. Vui lòng kiểm tra quyền thông báo trong cài đặt thiết bị."
- Event is still saved with reminder settings, allowing user to enable permissions later

**Code Location**:

- `ExpenseTrackerApp/src/services/notificationService.ts` - `requestPermissions()`
- `ExpenseTrackerApp/app/events/add.tsx` - Permission check and error handling
- `ExpenseTrackerApp/app/events/edit/[id].tsx` - Permission check and error handling

### 3. App Reinstall Scenario

**Scenario**: User reinstalls the app, causing all scheduled notifications to be lost.

**Handling**:

- Event data (including reminder settings) is preserved in AsyncStorage
- On app launch, the `AppInitializer` component loads events from AsyncStorage
- The `rescheduleAllNotifications` function is called to reschedule all notifications
- All events with `reminderEnabled: true` get their notifications rescheduled
- New notification IDs are saved back to AsyncStorage

**Code Location**:

- `ExpenseTrackerApp/app/_layout.tsx` - `AppInitializer` component with `rescheduleNotifications` effect
- `ExpenseTrackerApp/src/services/notificationService.ts` - `rescheduleAllNotifications()`

**Note**: This also handles the case where notifications are cleared by the system or user.

### 4. Timezone Changes

**Scenario**: User travels to a different timezone or changes device timezone settings.

**Handling**:

- All date/time calculations use local device time via JavaScript `Date` object
- Event times are stored in local format (not UTC)
- When timezone changes, the `rescheduleAllNotifications` function (called on app launch) recalculates trigger times based on new local time
- Notifications are automatically rescheduled with correct local times

**Code Location**:

- `ExpenseTrackerApp/src/services/notificationService.ts` - `calculateTriggerDate()` uses local time
- `ExpenseTrackerApp/app/_layout.tsx` - Reschedules notifications on app launch

**Limitation**: If the app is not opened after a timezone change, notifications will fire at the wrong local time. This is a known limitation of local notifications.

### 5. Device Reboot

**Scenario**: User reboots their device.

**Handling**:

- `expo-notifications` automatically persists scheduled notifications across device reboots
- No additional handling required
- Notifications will fire at the scheduled time even after reboot

**Code Location**: Handled automatically by `expo-notifications` library

### 6. Invalid Date/Time Data

**Scenario**: Event data contains invalid or corrupted date/time values.

**Handling**:

- The `calculateTriggerDate` function validates all date/time components
- Checks for valid ranges (year: 2000-2100, month: 1-12, day: 1-31, hours: 0-23, minutes: 0-59)
- Returns `null` if validation fails
- Logs error to console for debugging
- User receives generic error message

**Code Location**:

- `ExpenseTrackerApp/src/services/notificationService.ts` - `calculateTriggerDate()` validation logic

### 7. Notification Scheduling Failures

**Scenario**: System fails to schedule notification due to unknown error.

**Handling**:

- All notification operations are wrapped in try-catch blocks
- Errors are logged to console
- User receives error message with details
- Event is still saved (notification failure doesn't prevent event creation)
- User can try editing the event to reschedule the notification

**Code Location**:

- `ExpenseTrackerApp/src/services/notificationService.ts` - Error handling in all functions
- `ExpenseTrackerApp/app/events/add.tsx` - Catch block in `handleSubmit()`
- `ExpenseTrackerApp/app/events/edit/[id].tsx` - Catch block in `handleSubmit()`

### 8. Concurrent Notification Operations

**Scenario**: User rapidly creates/edits/deletes multiple events.

**Handling**:

- Each notification operation is independent and async
- Operations are queued by the system
- Failed operations don't affect other operations
- Loading states prevent duplicate submissions

**Code Location**:

- `ExpenseTrackerApp/app/events/add.tsx` - `isSubmitting` state prevents duplicate submissions
- `ExpenseTrackerApp/app/events/edit/[id].tsx` - `isSubmitting` state prevents duplicate submissions

### 9. Storage Failures During Notification Update

**Scenario**: AsyncStorage fails when trying to save updated notification ID.

**Handling**:

- Notification is scheduled successfully but ID not saved
- On next app launch, `rescheduleAllNotifications` will reschedule the notification
- User may receive duplicate notifications (old + new) until old one expires
- Error is logged and user is notified

**Code Location**:

- `ExpenseTrackerApp/app/events/add.tsx` - Error handling in Redux dispatch
- `ExpenseTrackerApp/app/events/edit/[id].tsx` - Error handling in Redux dispatch

### 10. Notification Cancellation Failures

**Scenario**: System fails to cancel a scheduled notification.

**Handling**:

- Error is caught and logged but not thrown (silent failure)
- Notification might still fire even though event was deleted/updated
- This is acceptable as it's better than blocking the delete/update operation
- User can manually dismiss the notification if it fires

**Code Location**:

- `ExpenseTrackerApp/src/services/notificationService.ts` - `cancelNotification()` doesn't throw errors

## Testing Recommendations

To verify edge case handling:

1. **Past Events**: Create event with time in the past, enable reminder
2. **Permission Denied**: Deny notification permissions, try to create event with reminder
3. **App Reinstall**: Create events with reminders, uninstall and reinstall app, verify notifications are rescheduled
4. **Timezone Change**: Create event, change device timezone, reopen app, verify notification time is correct
5. **Invalid Data**: Manually corrupt event data in AsyncStorage, verify app handles gracefully
6. **Rapid Operations**: Quickly create/edit/delete multiple events with reminders
7. **Storage Failure**: Simulate AsyncStorage failure (requires mocking)

## Future Improvements

Potential enhancements to consider:

1. **Background Notification Rescheduling**: Use background tasks to periodically check and reschedule notifications
2. **Notification History**: Track delivered notifications to avoid duplicates
3. **Smart Timezone Handling**: Detect timezone changes and automatically reschedule without requiring app launch
4. **Retry Mechanism**: Automatically retry failed notification operations
5. **User Notification Settings**: Allow users to customize notification behavior (sound, vibration, etc.)

## Related Files

- `ExpenseTrackerApp/src/services/notificationService.ts` - Core notification logic
- `ExpenseTrackerApp/app/events/add.tsx` - Add event with notification
- `ExpenseTrackerApp/app/events/edit/[id].tsx` - Edit event with notification
- `ExpenseTrackerApp/app/events/[id].tsx` - Delete event with notification
- `ExpenseTrackerApp/app/_layout.tsx` - App initialization and notification rescheduling
- `ExpenseTrackerApp/src/types/event.types.ts` - Event type definitions
- `ExpenseTrackerApp/src/redux/reducers/eventSlice.ts` - Event state management
