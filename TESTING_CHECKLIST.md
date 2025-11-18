# Calendar Feature Testing Checklist

## ✅ Pre-Testing Verification (Completed)

- [x] TypeScript compilation successful
- [x] All dependencies installed
- [x] No diagnostic errors
- [x] Code review completed
- [x] All components implemented
- [x] All screens implemented
- [x] Redux integration complete
- [x] Storage service implemented
- [x] Error handling in place

## 📋 Manual Testing Tasks

### 1. Create Event - All Fields ⏳

- [ ] Open Calendar tab
- [ ] Tap FAB (+) button
- [ ] Fill all fields (title, description, location, date, time, category)
- [ ] Tap Save
- [ ] Verify success alert
- [ ] Verify event appears in calendar
- [ ] Verify event has correct category dot color

**Expected:** Event created successfully with all data saved

---

### 2. Create Event - Required Only ⏳

- [ ] Open Calendar tab
- [ ] Tap FAB (+) button
- [ ] Fill only title field
- [ ] Leave description and location empty
- [ ] Tap Save
- [ ] Verify event created

**Expected:** Event created with only required field

---

### 3. Edit Event ⏳

- [ ] Tap on existing event
- [ ] Tap Edit button (pencil icon)
- [ ] Modify title and category
- [ ] Tap Save
- [ ] Verify changes reflected
- [ ] Check updatedAt timestamp changed
- [ ] Check createdAt timestamp preserved

**Expected:** Event updated successfully

---

### 4. Delete Event ⏳

- [ ] Tap on event
- [ ] Tap Delete button (trash icon)
- [ ] Verify confirmation dialog
- [ ] Tap Cancel - event remains
- [ ] Tap Delete again
- [ ] Tap Confirm - event removed
- [ ] Verify calendar updated

**Expected:** Event deleted with confirmation

---

### 5. Month Navigation ⏳

- [ ] View current month
- [ ] Tap left arrow (previous month)
- [ ] Verify month changed
- [ ] Tap right arrow (next month)
- [ ] Verify month changed
- [ ] Verify events displayed correctly for each month

**Expected:** Smooth month navigation

---

### 6. View Mode Toggle ⏳

- [ ] Start in calendar view
- [ ] Tap toggle button (top right)
- [ ] Verify list view shows upcoming events
- [ ] Verify events sorted chronologically
- [ ] Tap toggle again
- [ ] Verify calendar view restored

**Expected:** Smooth view mode transitions

---

### 7. Today's Events ⏳

- [ ] Create 2-3 events for today
- [ ] Open Calendar tab
- [ ] Verify "Hôm nay" section shows events
- [ ] Verify events sorted by time
- [ ] Verify tab badge shows count
- [ ] Delete all today's events
- [ ] Verify empty state message

**Expected:** Today's section accurate

---

### 8. Empty States ⏳

- [ ] Clear all events (or start fresh)
- [ ] Verify calendar empty state
- [ ] Select a date with no events
- [ ] Verify selected date empty state
- [ ] Verify today empty state with icon

**Expected:** Appropriate empty messages

---

### 9. Multiple Events Same Date ⏳

- [ ] Create 3 events for same date
- [ ] Use different categories
- [ ] Use different times (e.g., 9:00, 14:00, 18:00)
- [ ] Verify all events shown when date selected
- [ ] Verify events sorted by time
- [ ] Verify calendar shows dot (first event's color)

**Expected:** All events displayed, sorted by time

---

### 10. Data Persistence ⏳

- [ ] Create 3-5 events
- [ ] Note event details
- [ ] Force quit app (swipe up from app switcher)
- [ ] Reopen app
- [ ] Navigate to Calendar tab
- [ ] Verify all events loaded
- [ ] Verify all data intact

**Expected:** All data persisted correctly

---

### 11. Category Filtering ⏳

- [ ] Create events in different categories (Work, Personal, Health, Family, Other)
- [ ] Tap "Tất cả" chip - verify all events shown
- [ ] Tap "Công việc" chip - verify only Work events shown
- [ ] Tap "Cá nhân" chip - verify only Personal events shown
- [ ] Test each category
- [ ] Verify marked dates update with filter
- [ ] Verify today's section filtered

**Expected:** Filtering works correctly

---

### 12. Error Scenarios ⏳

#### a) Form Validation

- [ ] Try to save event with empty title
- [ ] Verify error message shown
- [ ] Verify save button disabled

**Expected:** Validation prevents invalid submission

#### b) Network/Storage Issues (Simulated)

- [ ] Create event
- [ ] Observe retry mechanism if storage fails
- [ ] Verify error alert shown
- [ ] Verify retry option available

**Expected:** Graceful error handling

---

## 🐛 Bugs Found

### Bug Log

| #   | Severity | Description                                          | Status | Fix                                  |
| --- | -------- | ---------------------------------------------------- | ------ | ------------------------------------ |
| 1   | Low      | Multiple events on same date show only one dot color | Known  | Limitation of react-native-calendars |
|     |          |                                                      |        |                                      |

---

## 📱 Device Testing

### iOS Testing

- [ ] iPhone Simulator
- [ ] Physical iPhone (if available)
- [ ] Light mode
- [ ] Dark mode

### Android Testing

- [ ] Android Emulator
- [ ] Physical Android device (if available)
- [ ] Light mode
- [ ] Dark mode

---

## ✨ Additional Checks

### UI/UX

- [ ] Haptic feedback works on button presses
- [ ] Animations smooth (view mode toggle, transitions)
- [ ] Loading indicators shown during async operations
- [ ] Colors match app theme
- [ ] Typography consistent
- [ ] Spacing appropriate
- [ ] Icons display correctly

### Accessibility

- [ ] Text readable in both light/dark mode
- [ ] Touch targets adequate size (44x44 minimum)
- [ ] Color contrast sufficient

### Performance

- [ ] Calendar renders quickly
- [ ] List scrolling smooth
- [ ] No lag when switching views
- [ ] No memory leaks (check with profiler if needed)

---

## 📝 Testing Notes

**Date:** ******\_\_\_******
**Tester:** ******\_\_\_******
**Device:** ******\_\_\_******
**OS Version:** ******\_\_\_******

### General Observations:

---

---

---

### Issues Found:

---

---

---

### Recommendations:

---

---

---

---

## ✅ Sign-off

- [ ] All critical tests passed
- [ ] All bugs documented
- [ ] Feature ready for production

**Tested by:** ******\_\_\_******
**Date:** ******\_\_\_******
**Signature:** ******\_\_\_******
