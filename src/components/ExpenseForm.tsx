import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ExpenseCategory, BudgetStatus } from "@/src/types";
import { EXPENSE_CATEGORIES } from "@/src/constants/ExpenseCategories";
import { FamilyMember } from "@/src/redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BudgetWarningBanner from "./BudgetWarningBanner";
import { formatDateObject } from "@/src/utils/formatUtils";

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
  weeklyBudgetStatus?: BudgetStatus | null;
  monthlyBudgetStatus?: BudgetStatus | null;
  existingExpenseAmount?: number;
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
  weeklyBudgetStatus,
  monthlyBudgetStatus,
  existingExpenseAmount = 0,
}: ExpenseFormProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleNoteFocus = () => {
    // Scroll to bottom when note field is focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Calculate predictive budget status
  const predictiveBudgetStatus = useMemo(() => {
    const newAmount = parseFloat(amount) || 0;
    const amountDelta = newAmount - existingExpenseAmount;

    if (amountDelta === 0 || (!weeklyBudgetStatus && !monthlyBudgetStatus)) {
      return {
        weekly: weeklyBudgetStatus || null,
        monthly: monthlyBudgetStatus || null,
      };
    }

    const predictWeekly = weeklyBudgetStatus
      ? {
          ...weeklyBudgetStatus,
          spent: weeklyBudgetStatus.spent + amountDelta,
          remaining: weeklyBudgetStatus.remaining - amountDelta,
          percentage:
            ((weeklyBudgetStatus.spent + amountDelta) /
              weeklyBudgetStatus.limit) *
            100,
          isWarning:
            ((weeklyBudgetStatus.spent + amountDelta) /
              weeklyBudgetStatus.limit) *
              100 >=
            80,
          isExceeded:
            weeklyBudgetStatus.spent + amountDelta > weeklyBudgetStatus.limit,
        }
      : null;

    const predictMonthly = monthlyBudgetStatus
      ? {
          ...monthlyBudgetStatus,
          spent: monthlyBudgetStatus.spent + amountDelta,
          remaining: monthlyBudgetStatus.remaining - amountDelta,
          percentage:
            ((monthlyBudgetStatus.spent + amountDelta) /
              monthlyBudgetStatus.limit) *
            100,
          isWarning:
            ((monthlyBudgetStatus.spent + amountDelta) /
              monthlyBudgetStatus.limit) *
              100 >=
            80,
          isExceeded:
            monthlyBudgetStatus.spent + amountDelta > monthlyBudgetStatus.limit,
        }
      : null;

    return { weekly: predictWeekly, monthly: predictMonthly };
  }, [amount, existingExpenseAmount, weeklyBudgetStatus, monthlyBudgetStatus]);

  // Check if saving would exceed any limits
  const wouldExceedLimit = useMemo(() => {
    return (
      (predictiveBudgetStatus.weekly?.isExceeded &&
        !weeklyBudgetStatus?.isExceeded) ||
      (predictiveBudgetStatus.monthly?.isExceeded &&
        !monthlyBudgetStatus?.isExceeded)
    );
  }, [predictiveBudgetStatus, weeklyBudgetStatus, monthlyBudgetStatus]);

  const handleSaveWithConfirmation = () => {
    if (wouldExceedLimit) {
      const exceededPeriods: string[] = [];
      if (
        predictiveBudgetStatus.weekly?.isExceeded &&
        !weeklyBudgetStatus?.isExceeded
      ) {
        exceededPeriods.push("tuần");
      }
      if (
        predictiveBudgetStatus.monthly?.isExceeded &&
        !monthlyBudgetStatus?.isExceeded
      ) {
        exceededPeriods.push("tháng");
      }

      Alert.alert(
        "Vượt hạn mức",
        `Chi phí này sẽ vượt hạn mức ${exceededPeriods.join(
          " và "
        )} của bạn. Bạn có muốn tiếp tục?`,
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Tiếp tục",
            onPress: onSave,
          },
        ]
      );
    } else {
      onSave();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Warning Banner */}
        {(predictiveBudgetStatus.weekly || predictiveBudgetStatus.monthly) && (
          <View style={styles.warningSection}>
            <BudgetWarningBanner
              weeklyStatus={predictiveBudgetStatus.weekly}
              monthlyStatus={predictiveBudgetStatus.monthly}
            />
          </View>
        )}

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
          {amount && !errors.amount && parseFloat(amount) > 0 && (
            <View style={styles.formattedAmountContainer}>
              <Text style={styles.formattedAmountText}>
                {parseFloat(amount).toLocaleString("vi-VN")} ₫
              </Text>
            </View>
          )}
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
            <Text style={styles.dateText}>{formatDateObject(date)}</Text>
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
            onFocus={handleNoteFocus}
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
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveWithConfirmation}
        >
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
  warningSection: {
    marginBottom: 16,
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
  formattedAmountContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#81C784",
  },
  formattedAmountText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E7D32",
    textAlign: "center",
    letterSpacing: 0.5,
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
