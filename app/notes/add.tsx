import { getNoteCategories } from "@/src/constants";
import { useTranslation } from "@/src/hooks/useTranslation";
import { addNote } from "@/src/redux/reducers/noteSlice";
import { useAppDispatch } from "@/src/redux/store";
import { Note, NoteCategory } from "@/src/types/note.types";
import { parseTagsString, validateNoteData } from "@/src/utils/noteUtils";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddNoteScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    category?: string;
    amount?: string;
    tags?: string;
  }>({});

  // Get note categories with translations
  const NOTE_CATEGORIES = getNoteCategories(t);

  const validateForm = () => {
    const tags = parseTagsString(tagsInput);
    const noteData: Partial<Note> = {
      title,
      content,
      category: category || undefined,
      amount: amount ? parseFloat(amount) : undefined,
      tags,
    };

    const validation = validateNoteData(noteData);

    if (!validation.isValid) {
      const newErrors: typeof errors = {};
      validation.errors.forEach(({ field, messageKey }) => {
        newErrors[field] = t(messageKey);
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const tags = parseTagsString(tagsInput);
    const newNote: Note = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      content: content.trim(),
      category: category!,
      tags: tags.length > 0 ? tags : undefined,
      date: date.toISOString(),
      amount: amount ? parseFloat(amount) : undefined,
      isPinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dispatch(addNote(newNote)).unwrap();
      Alert.alert(t("common.success"), t("notes.addNote"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("notes.addNoteFailed"));
    }
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("notes.noteTitle")} *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder={`${t("common.add")} ${t(
              "notes.noteTitle",
            ).toLowerCase()}...`}
            maxLength={100}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("expenses.category")} *</Text>
          <View style={styles.categoryGrid}>
            {NOTE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryItem,
                  category === cat.key && styles.categoryItemSelected,
                ]}
                onPress={() => {
                  setCategory(cat.key);
                  if (errors.category)
                    setErrors({ ...errors, category: undefined });
                }}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor:
                        category === cat.key ? cat.color : "#f0f0f0",
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.key ? "#fff" : "#666"}
                  />
                </View>
                <Text style={styles.categoryLabel} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("notes.content")} *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.content && styles.inputError,
            ]}
            placeholder={`${t("common.add")} ${t(
              "notes.content",
            ).toLowerCase()}...`}
            multiline
            numberOfLines={6}
            maxLength={2000}
            value={content}
            onChangeText={(text) => {
              setContent(text);
              if (errors.content) setErrors({ ...errors, content: undefined });
            }}
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>
          {errors.content && (
            <Text style={styles.errorText}>{errors.content}</Text>
          )}
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("expenses.date")}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString("vi-VN")}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t("expenses.amount")} ({t("expenses.optional") || "Optional"})
          </Text>
          <TextInput
            style={[styles.input, errors.amount && styles.inputError]}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (errors.amount) setErrors({ ...errors, amount: undefined });
            }}
          />
          {errors.amount && (
            <Text style={styles.errorText}>{errors.amount}</Text>
          )}
        </View>

        {/* Tags Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags (tùy chọn)</Text>
          <TextInput
            style={[styles.input, errors.tags && styles.inputError]}
            placeholder="Nhập tags, phân cách bằng dấu phẩy..."
            value={tagsInput}
            onChangeText={(text) => {
              setTagsInput(text);
              if (errors.tags) setErrors({ ...errors, tags: undefined });
            }}
          />
          <Text style={styles.helperText}>
            Ví dụ: quan trọng, cần xem lại, mua sắm
          </Text>
          {errors.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
        </View>

        {/* Pin Toggle */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="pin" size={20} color="#FF9500" />
              <Text style={styles.label}>
                {t("notes.pinned") || "Pin Note"}
              </Text>
            </View>
            <Switch
              value={isPinned}
              onValueChange={setIsPinned}
              trackColor={{ false: "#ddd", true: "#FF9500" }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t("common.save")}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    height: 120,
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
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryItem: {
    width: "22%",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  categoryItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    textAlign: "center",
    color: "#333",
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  switchLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
