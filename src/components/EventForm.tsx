import useTranslation from "@/src/hooks/useTranslation";
import {
  EventCategory,
  EventFormData,
  ReminderTime,
} from "@/src/types/event.types";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CategoryPicker from "./CategoryPicker";
import ReminderPicker from "./ReminderPicker";

interface FormErrors {
  title?: string;
}

// Map the app language code to a BCP-47 locale tag for date/time formatting.
function getLocaleTag(language: string): string {
  switch (language) {
    case "vi":
      return "vi-VN";
    case "ja":
      return "ja-JP";
    case "ko":
      return "ko-KR";
    default:
      return "en-US";
  }
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function EventForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EventFormProps) {
  const { t, getCurrentLanguage } = useTranslation();
  const locale = getLocaleTag(getCurrentLanguage());

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [category, setCategory] = useState<EventCategory>(
    initialData?.category || "Personal",
  );
  const [date, setDate] = useState(initialData?.date || new Date());
  const [time, setTime] = useState(initialData?.time || new Date());
  const [reminderEnabled, setReminderEnabled] = useState(
    initialData?.reminderEnabled ?? false,
  );
  const [reminderMinutes, setReminderMinutes] = useState<ReminderTime>(
    initialData?.reminderMinutes || 5,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (title.trim().length === 0) {
      newErrors.title = t("events.titleRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const formData: EventFormData = {
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        location: location.trim(),
        category,
        reminderEnabled,
        reminderMinutes,
      };
      onSubmit(formData);
    }
  };

  const isFormValid = title.trim().length > 0;
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View style={[styles.section, { marginTop: insets?.top }]}>
          <Text style={styles.label}>{t("events.titleLabel")} *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder={t("events.titlePlaceholder")}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) clearError("title");
            }}
            maxLength={100}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("events.descriptionLabel")}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t("events.descriptionPlaceholder")}
            multiline
            numberOfLines={3}
            maxLength={200}
            value={description}
            autoComplete="off"
            autoCorrect={false}
            onChangeText={setDescription}
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* Location Input */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("events.locationLabel")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("events.locationPlaceholder")}
            value={location}
            onChangeText={setLocation}
            maxLength={100}
          />
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("events.dateLabel")}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString(locale)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Time Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("events.timeLabel")}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.dateText}>
              {time.toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={(_, selectedTime) => {
                setShowTimePicker(Platform.OS === "ios");
                if (selectedTime) {
                  setTime(selectedTime);
                }
              }}
            />
          )}
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("events.categoryLabel")}</Text>
          <CategoryPicker selectedCategory={category} onSelect={setCategory} />
        </View>

        {/* Reminder Picker */}
        <View style={styles.section}>
          <ReminderPicker
            enabled={reminderEnabled}
            reminderMinutes={reminderMinutes}
            onToggle={setReminderEnabled}
            onSelectTime={setReminderMinutes}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { marginBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isSubmitting) && styles.saveButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? `${t("common.saving")}...` : t("common.save")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
