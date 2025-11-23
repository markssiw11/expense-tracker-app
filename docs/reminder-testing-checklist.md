# Event Reminder Testing Checklist

This document provides a comprehensive manual testing checklist for the event reminder functionality.

## Pre-Testing Setup

Before starting tests, ensure:

- [ ] App is installed on a physical device or simulator
- [ ] Notification permissions are reset (uninstall/reinstall app if needed)
- [ ] Device has correct date/time settings
- [ ] You have access to device notification settings

## Test Cases

### 1. Create Event with Default Reminder (5 minutes)

**Steps:**

1. Open the app and navigate to Calendar tab
2. Tap the "+" button to add a new event
3. Fill in event title: "Test Event - Default Reminder"
4. Set event date to today
5. Set event time to 10 minutes from now
6. Enable the reminder toggle (should default to 5 minutes)
7. Tap "Lưu" (Save)

**Expected Results:**

- [ ] Event is created successfully
- [ ] Success message appears
- [ ] Event appears in calendar with reminder indicator
- [ ] Notification permission prompt appears (if first time)
- [ ] After 5 minutes, notification appears with event title and time

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 2. Create Event with Custom Reminder Time

**Steps:**

1. Tap "+" to add new event
2. Fill in event title: "Test Event - Custom Reminder"
3. Set event date to today
4. Set event time to 35 minutes from now
5. Enable reminder toggle
6. Select "30 phút" (30 minutes) from reminder time picker
7. Tap "Lưu"

**Expected Results:**

- [ ] Event is created successfully
- [ ] Reminder time shows "30 phút" in the form
- [ ] After 5 minutes (35 - 30), notification appears

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 3. Create Event Without Reminder

**Steps:**

1. Tap "+" to add new event
2. Fill in event title: "Test Event - No Reminder"
3. Set event date and time
4. Keep reminder toggle OFF
5. Tap "Lưu"

**Expected Results:**

- [ ] Event is created successfully
- [ ] No notification permission prompt
- [ ] No notification appears at event time
- [ ] Event detail screen shows reminder as disabled

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 4. Edit Event to Enable Reminder

**Steps:**

1. Open an existing event without reminder
2. Tap "Sửa" (Edit) button
3. Enable reminder toggle
4. Select reminder time (e.g., 15 phút)
5. Tap "Lưu"

**Expected Results:**

- [ ] Event is updated successfully
- [ ] Success message mentions reminder is enabled
- [ ] Event detail shows reminder is enabled
- [ ] Notification is scheduled and appears at correct time

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 5. Edit Event to Disable Reminder

**Steps:**

1. Open an existing event with reminder enabled
2. Tap "Sửa" button
3. Disable reminder toggle
4. Tap "Lưu"

**Expected Results:**

- [ ] Event is updated successfully
- [ ] Success message mentions reminder is disabled
- [ ] Event detail shows reminder is disabled
- [ ] No notification appears at the previously scheduled time

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 6. Edit Event to Change Reminder Time

**Steps:**

1. Open an existing event with reminder (e.g., 5 minutes)
2. Tap "Sửa" button
3. Change reminder time to different value (e.g., 1 giờ)
4. Tap "Lưu"

**Expected Results:**

- [ ] Event is updated successfully
- [ ] New reminder time is saved
- [ ] Old notification is cancelled
- [ ] New notification is scheduled with updated time
- [ ] Notification appears at new scheduled time

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 7. Delete Event with Reminder

**Steps:**

1. Open an event with reminder enabled
2. Tap "Xóa" (Delete) button
3. Confirm deletion in the dialog
4. Wait until the original notification time

**Expected Results:**

- [ ] Confirmation dialog appears
- [ ] Event is deleted successfully
- [ ] Event disappears from calendar
- [ ] No notification appears at the scheduled time

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 8. Notification Content Verification

**Steps:**

1. Create an event with:
   - Title: "Important Meeting"
   - Time: 10 minutes from now
   - Location: "Conference Room A"
   - Reminder: 5 minutes
2. Wait for notification to appear

**Expected Results:**

- [ ] Notification title shows: "Important Meeting"
- [ ] Notification body shows time in format "Thời gian: HH:mm"
- [ ] Notification body shows location: "Địa điểm: Conference Room A"
- [ ] Notification has sound
- [ ] Notification appears even when app is in foreground

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 9. Notification Permission Denied Scenario

**Steps:**

1. Uninstall and reinstall the app (to reset permissions)
2. Create a new event with reminder enabled
3. When permission prompt appears, tap "Don't Allow" or "Deny"
4. Tap "Lưu"

**Expected Results:**

- [ ] Warning alert appears with message about permissions
- [ ] Event is still saved successfully
- [ ] Event shows reminder as enabled in settings
- [ ] No notification appears at scheduled time
- [ ] User can go to device settings to enable permissions later

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 10. Create Reminder for Past Event

**Steps:**

1. Tap "+" to add new event
2. Fill in event title: "Past Event Test"
3. Set event date to today
4. Set event time to 5 minutes ago (in the past)
5. Enable reminder toggle (5 minutes)
6. Tap "Lưu"

**Expected Results:**

- [ ] Event is saved successfully
- [ ] Warning alert appears: "Sự kiện đã được lưu nhưng không thể đặt nhắc nhở vì thời gian nhắc nhở đã qua..."
- [ ] Event is saved without notification
- [ ] No notification appears

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 11. Multiple Events with Different Reminder Times

**Steps:**

1. Create Event A: Time = now + 15 min, Reminder = 5 min
2. Create Event B: Time = now + 20 min, Reminder = 10 min
3. Create Event C: Time = now + 30 min, Reminder = 15 min
4. Wait and observe notifications

**Expected Results:**

- [ ] All three events are created successfully
- [ ] Event A notification appears at now + 10 min
- [ ] Event B notification appears at now + 10 min
- [ ] Event C notification appears at now + 15 min
- [ ] All notifications show correct event information
- [ ] Notifications don't interfere with each other

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 12. App Reinstall Scenario

**Steps:**

1. Create 2-3 events with reminders enabled (set times in future)
2. Note down the event details and reminder times
3. Close the app completely
4. Uninstall the app
5. Reinstall the app
6. Open the app and navigate to Calendar tab
7. Check the events

**Expected Results:**

- [ ] All events are loaded from AsyncStorage
- [ ] Events still show reminder as enabled
- [ ] Notifications are automatically rescheduled on app launch
- [ ] Notifications appear at the correct times
- [ ] Console logs show "Rescheduling notifications for loaded events..."

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 13. Timezone Change Scenario

**Steps:**

1. Create an event with reminder for tomorrow at 10:00 AM
2. Note the current timezone
3. Close the app
4. Change device timezone to a different timezone (e.g., +3 hours)
5. Reopen the app
6. Check the event details

**Expected Results:**

- [ ] Event time is displayed in new local time
- [ ] Notification is rescheduled based on new timezone
- [ ] Notification appears at correct local time in new timezone
- [ ] Console logs show notification rescheduling

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 14. Rapid Event Creation/Editing

**Steps:**

1. Quickly create 5 events with reminders (within 30 seconds)
2. Immediately edit 2 of them to change reminder times
3. Delete 1 event
4. Check all events and wait for notifications

**Expected Results:**

- [ ] All operations complete successfully
- [ ] No crashes or freezes
- [ ] Loading indicators show during operations
- [ ] All notifications are scheduled correctly
- [ ] Deleted event's notification doesn't appear
- [ ] Edited events' notifications appear at new times

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 15. Event Detail Screen Reminder Display

**Steps:**

1. Create an event with reminder enabled (15 minutes)
2. Open the event detail screen
3. Check the reminder information display

**Expected Results:**

- [ ] Reminder status is clearly visible
- [ ] Reminder time is displayed (e.g., "Nhắc trước 15 phút")
- [ ] Visual indicator (icon) shows reminder is enabled
- [ ] Information is formatted correctly

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 16. All Reminder Time Options

**Steps:**

1. Create 6 events, each with a different reminder time option:
   - Event 1: 5 phút
   - Event 2: 10 phút
   - Event 3: 15 phút
   - Event 4: 30 phút
   - Event 5: 1 giờ
   - Event 6: 1 ngày trước
2. Set all events for tomorrow at the same time
3. Verify each reminder time is saved correctly

**Expected Results:**

- [ ] All reminder time options are available in picker
- [ ] Each option is displayed in Vietnamese
- [ ] Selected time is saved correctly for each event
- [ ] Event detail shows correct reminder time for each
- [ ] Notifications are scheduled at correct times

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 17. Background and Foreground Notifications

**Steps:**

1. Create an event with reminder for 5 minutes from now
2. Keep app in foreground and wait for notification
3. Create another event with reminder for 5 minutes from now
4. Put app in background (home screen) and wait for notification
5. Create a third event with reminder for 5 minutes from now
6. Close app completely and wait for notification

**Expected Results:**

- [ ] Notification appears when app is in foreground
- [ ] Notification appears when app is in background
- [ ] Notification appears when app is closed
- [ ] All notifications have sound and are visible
- [ ] Tapping notification opens the app (if implemented)

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 18. Form Validation with Reminders

**Steps:**

1. Tap "+" to add new event
2. Enable reminder toggle
3. Try to save without entering title
4. Enter title but leave other fields empty
5. Save the event

**Expected Results:**

- [ ] Cannot save without title (validation error)
- [ ] Can save with only title and reminder
- [ ] Reminder is saved correctly even with minimal data
- [ ] Notification body handles missing location gracefully

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

## Edge Cases Testing

### 19. Device Reboot

**Steps:**

1. Create events with reminders scheduled for after reboot
2. Reboot the device
3. Wait for notification times

**Expected Results:**

- [ ] Notifications still appear after reboot
- [ ] No need to open app for notifications to work

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

### 20. Low Storage Scenario

**Steps:**

1. Fill device storage to near capacity
2. Try to create events with reminders
3. Try to edit existing events

**Expected Results:**

- [ ] App handles low storage gracefully
- [ ] Error messages are clear if operations fail
- [ ] App doesn't crash

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

## Performance Testing

### 21. Many Events with Reminders

**Steps:**

1. Create 20+ events with reminders enabled
2. Navigate through calendar
3. Edit several events
4. Check app responsiveness

**Expected Results:**

- [ ] App remains responsive
- [ ] No noticeable lag when loading events
- [ ] All notifications are scheduled correctly
- [ ] Calendar view renders smoothly

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Tested

**Notes:**

---

---

## Bug Tracking

### Bugs Found

| Bug ID | Description | Severity | Steps to Reproduce | Status |
| ------ | ----------- | -------- | ------------------ | ------ |
| 1      |             |          |                    |        |
| 2      |             |          |                    |        |
| 3      |             |          |                    |        |

---

## Test Summary

**Total Test Cases:** 21
**Passed:** **_
**Failed:** _**
**Not Tested:** \_\_\_

**Pass Rate:** \_\_\_%

**Tested By:** ******\_\_\_******
**Date:** ******\_\_\_******
**Device/Simulator:** ******\_\_\_******
**OS Version:** ******\_\_\_******
**App Version:** ******\_\_\_******

---

## Notes and Observations

---

---

---

---

---

## Recommendations

Based on testing results, list any recommendations for improvements or fixes:

1. ***
2. ***
3. ***
