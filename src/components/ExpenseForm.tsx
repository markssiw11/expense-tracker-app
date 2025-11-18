import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ExpenseCategory } from "@/src/types";
import { EXPENSE_CATEGORIES } from "@/src/constants/ExpenseCategories";
import { FamilyMember } from "@/src/redux";

interface FormErrors {
  amount?: string;
  category?: string;
  note?: string;
}

interface ExpenseFormProps {
  amount: string;
  setAmount: (value: string) => void;
  category: ExpenseCategory | null;
  setCategory: (value: ExpenseCategory) => void;
  spender: string | null;
  setSpender: (value: string | null) => void;
  date: Date;
  setDate: (value: Date) => void;
  note: string;
  setNote: (value: string) => void;
  showDatePicker: boolean;
  setShowDatePicker: (value: boolean) => void;
  errors: FormErrors;
  clearError: (field: keyof FormErrors) => void;
  familyMembers: FamilyMember[];
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  saveButtonText?: string;
}

export default function ExpenseForm({
  amount,
  setAmount,
  category,
  setCategory,
  spender,
  setSpender,
  date,
  setDate,
  note,
  setNote,
  showDatePicker,
  setShowDatePicker,
  errors,
  clearError,
  familyMembers,
  onCancel,
  onSave,
  onDelete,
  saveButtonText = "Lưu",
}: ExpenseFormProps) {
  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

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
        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Số tiền *</Text>
          <TextInput
            style={[styles.input, errors.amount && styles.inputError]}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (errors.amount) clearError("amount");
            }}
          />
          {errors.amount && (
            <Text style={styles.errorText}>{errors.amount}</Text>
          )}
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Danh mục *</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryItem,
                  category === cat.key && styles.categoryItemSelected,
                ]}
                onPress={() => {
                  setCategory(cat.key);
                  if (errors.category) clearError("category");
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
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Spender Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Người chi tiêu</Text>
          <View style={styles.spenderGrid}>
            {familyMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.spenderItem,
                  spender === member.id && styles.spenderItemSelected,
                ]}
                onPress={() => setSpender(member.id)}
              >
                <View
                  style={[
                    styles.spenderIcon,
                    {
                      backgroundColor:
                        spender === member.id ? member.color : "#f0f0f0",
                    },
                  ]}
                >
                  <Ionicons
                    name={member.icon as any}
                    size={24}
                    color={spender === member.id ? "#fff" : "#666"}
                  />
                </View>
                <Text style={styles.spenderLabel}>{member.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Ngày</Text>
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

        {/* Note Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.note && styles.inputError,
            ]}
            placeholder="Nhập ghi chú..."
            multiline
            numberOfLines={3}
            maxLength={200}
            value={note}
            autoComplete="off"
            autoCorrect={false}
            onChangeText={(text) => {
              setNote(text);
              if (errors.note) clearError("note");
            }}
          />
          <Text style={styles.charCount}>{note.length}/200</Text>
          {errors.note && <Text style={styles.errorText}>{errors.note}</Text>}
        </View>

        {/* Delete Button (only for edit mode) */}
        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Xóa chi phí</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>{saveButtonText}</Text>
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
    fontSize: 12,
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
  spenderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  spenderItem: {
    width: "22%",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  spenderItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  spenderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  spenderLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
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
