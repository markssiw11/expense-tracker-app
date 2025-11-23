# Event Reminder Testing Guide

This guide explains how to test the event reminder functionality in the ExpenseTracker app.

## Testing Approach

The reminder feature uses a combination of:

1. **Manual Testing** - For end-to-end user flows and notification verification
2. **Automated Test Helpers** - For quick validation of core service functions
3. **Console Logging** - For debugging and verification during development

## Quick Start Testing

### 1. Basic Functionality Test (5 minutes)

The fastest way to verify reminders are working:

1. Open the app
2. Navigate to Calendar tab
3. Tap "+" to add event
4. Fill in:
   - Title: "Quick Test"
   - Date: Today
   - Time: 5 minutes from now
   - Enable reminder (default 5 minutes)
5. Save the event
6. Wait 5 minutes (keep app open or in background)
7. Verify notification appears

**Expected:** Notification appears with event title and time

---

### 2. Permission Test (2 minutes)

Test notification permissions:

1. Uninstall and reinstall app (resets permissions)
2. Create event with reminder
3. When permission prompt appears, tap "Allow"
4. Verify event is saved
5. Verify notification appears at scheduled time

**Expected:** Permissions granted, notification works

---

### 3. Edge Case Test (3 minutes)

Test past event handling:

1. Create event with time in the past
2. Enable reminder
3. Try to save

**Expected:** Warning message about past event, event saved without notification

---

## Comprehensive Testing

For thorough testing, use the **Manual Testing Checklist**:

📄 See: `ExpenseTrackerApp/docs/reminder-testing-checklist.md`

This checklist covers:

- All reminder time options (5 min, 10 min, 15 min, 30 min, 1 hour, 1 day)
- Create, edit, delete flows
- Permission scenarios
- Edge cases (past events, timezone changes, app reinstall)
- Multiple events
- Notification content verification

**Estimated Time:** 60-90 minutes for complete checklist

---

## Automated Test Helpers

For developers, automated test helpers are available to quickly verify service functions.

### Running Automated Tests

The test helpers are located in:

```
ExpenseTrackerApp/src/services/__tests__/notificationService.test.ts
```

#### Option 1: Run from Console (Development)

1. Import the test helpers in any screen:

```typescript
import { runAllNotificationTests } from "@/src/services/__tests__/notificationService.test";
```

2. Call the function (e.g., in a button press or useEffect):

```typescript
await runAllNotificationTests();
```

3. Check console output for test results

#### Option 2: Create a Test Screen (Recommended for Development)

Create a temporary test screen:

```typescript
// app/test-notifications.tsx
import React from "react";
import { View, Button, ScrollView, Text } from "react-native";
import {
  testNotificationScheduling,
  testNotificationCancellation,
  testNotificationUpdate,
  testRescheduleAll,
  runAllNotificationTests,
} from "@/src/services/__tests__/notificationService.test";

export default function TestNotificationsScreen() {
  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Notification Tests</Text>

      <Button title="Run All Tests" onPress={runAllNotificationTests} />

      <View style={{ height: 20 }} />

      <Button title="Test Scheduling" onPress={testNotificationScheduling} />

      <View style={{ height: 20 }} />

      <Button
        title="Test Cancellation"
        onPress={testNotificationCancellation}
      />

      <View style={{ height: 20 }} />

      <Button title="Test Update" onPress={testNotificationUpdate} />

      <View style={{ height: 20 }} />

      <Button title="Test Reschedule All" onPress={testRescheduleAll} />

      <Text style={{ marginTop: 20, color: "gray" }}>
        Check console for test results
      </Text>
    </ScrollView>
  );
}
```

Then navigate to `/test-notifications` in your app.

### What the Automated Tests Cover

1. **Scheduling Test**

   - Future event scheduling ✅
   - Past event rejection ✅
   - Invalid date rejection ✅
   - Disabled reminder handling ✅
   - All reminder time options ✅

2. **Cancellation Test**

   - Schedule then cancel notification ✅
   - Verify cancellation succeeds ✅

3. **Update Test**

   - Schedule initial notification ✅
   - Update to different time ✅
   - Verify old notification cancelled ✅

4. **Reschedule All Test**
   - Multiple events rescheduling ✅
   - Notification ID mapping ✅

---

## Debugging Tips

### Check Scheduled Notifications

Add this helper to see all scheduled notifications:

```typescript
import { getAllScheduledNotifications } from "@/src/services/notificationService";

const notifications = await getAllScheduledNotifications();
console.log("Scheduled notifications:", notifications);
```

### Check Notification Permissions

```typescript
import * as Notifications from "expo-notifications";

const { status } = await Notifications.getPermissionsAsync();
console.log("Permission status:", status);
```

### Enable Verbose Logging

The notification service already logs important events. Check console for:

- `"Notification scheduled:"` - When notification is scheduled
- `"Notification cancelled:"` - When notification is cancelled
- `"Rescheduling notifications for loaded events..."` - On app launch
- `"Trigger date is in the past..."` - When past event is rejected

---

## Common Issues and Solutions

### Issue: Notifications not appearing

**Possible causes:**

1. Permissions denied
2. Event time is in the past
3. Device notifications disabled
4. App in battery saver mode (Android)

**Solutions:**

1. Check device Settings > Notifications > ExpenseTracker
2. Verify event time is in future
3. Check console logs for errors
4. Disable battery optimization for app (Android)

---

### Issue: Notifications appear at wrong time

**Possible causes:**

1. Timezone mismatch
2. Device time incorrect
3. Reminder time calculation error

**Solutions:**

1. Check device timezone settings
2. Verify device time is correct
3. Check console logs for trigger date calculation
4. Reopen app to reschedule notifications

---

### Issue: Duplicate notifications

**Possible causes:**

1. Notification not cancelled when event updated
2. Multiple reschedule operations

**Solutions:**

1. Check that old notification ID is passed to update function
2. Verify cancellation is called before rescheduling
3. Check console logs for cancellation confirmations

---

## Testing on Different Platforms

### iOS Testing

- Notifications appear in Notification Center
- Sound plays by default
- Permissions prompt appears on first request
- Notifications persist after device reboot

**iOS-specific checks:**

- Test with app in foreground, background, and closed
- Test with Do Not Disturb enabled
- Test with Focus modes

### Android Testing

- Notifications appear in notification shade
- Sound and vibration configurable
- Permissions may be granted by default (Android 12+)
- Battery optimization can affect notifications

**Android-specific checks:**

- Test with battery saver mode
- Test with app in background restrictions
- Test notification channels (if implemented)

---

## Performance Testing

### Test with Many Events

1. Create 20+ events with reminders
2. Check app responsiveness
3. Verify all notifications scheduled
4. Check memory usage

**Expected:** App remains responsive, all notifications work

### Test Rapid Operations

1. Quickly create 5 events
2. Immediately edit 2 of them
3. Delete 1 event
4. Check for race conditions

**Expected:** All operations complete successfully, no crashes

---

## Regression Testing

After making changes to reminder code, run these quick regression tests:

1. ✅ Create event with reminder → Notification appears
2. ✅ Edit event reminder time → New notification appears at new time
3. ✅ Delete event with reminder → Notification doesn't appear
4. ✅ Disable reminder → Notification doesn't appear
5. ✅ Past event → Warning shown, no notification
6. ✅ App reinstall → Notifications rescheduled

**Time:** ~15 minutes

---

## Test Data Cleanup

After testing, clean up test data:

1. Delete all test events from calendar
2. Clear all scheduled notifications:

```typescript
import { cancelAllNotifications } from "@/src/services/notificationService";
await cancelAllNotifications();
```

---

## Reporting Issues

When reporting bugs, include:

1. **Device info:** OS version, device model
2. **Steps to reproduce:** Exact steps taken
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happened
5. **Console logs:** Any error messages
6. **Screenshots:** If applicable

---

## Additional Resources

- **Manual Testing Checklist:** `reminder-testing-checklist.md`
- **Edge Cases Documentation:** `event-reminders-edge-cases.md`
- **Notification Service Code:** `src/services/notificationService.ts`
- **Test Helpers:** `src/services/__tests__/notificationService.test.ts`

---

## Testing Checklist Summary

Quick reference for what to test:

- [ ] Basic notification appears
- [ ] All reminder time options work
- [ ] Edit reminder works
- [ ] Delete cancels notification
- [ ] Past event shows warning
- [ ] Permission denied handled
- [ ] Multiple events work
- [ ] App reinstall reschedules
- [ ] Timezone change handled
- [ ] Notification content correct
- [ ] Works in foreground/background/closed
- [ ] No crashes or errors

**Minimum testing time:** 15 minutes (quick tests)
**Comprehensive testing time:** 90 minutes (full checklist)
