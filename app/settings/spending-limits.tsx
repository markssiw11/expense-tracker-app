import { GoBackButton } from "@/src/components";
import useTranslation from "@/src/hooks/useTranslation";
import {
  clearError,
  loadConfig,
  saveLimit,
  selectMonthlyLimit,
  selectSpendingLimitError,
  selectSpendingLimitLoading,
  selectWeeklyLimit,
  updateLimit,
} from "@/src/redux/reducers/spendingLimitSlice";
import { AppDispatch } from "@/src/redux/store";
import { BudgetPeriodType } from "@/src/types";
import { formatCurrency } from "@/src/utils/formatUtils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

export default function SpendingLimitSettingsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  const weeklyLimit = useSelector(selectWeeklyLimit);
  const monthlyLimit = useSelector(selectMonthlyLimit);
  const loading = useSelector(selectSpendingLimitLoading);
  const error = useSelector(selectSpendingLimitError);

  // Local state for form inputs
  const [weeklyAmount, setWeeklyAmount] = useState("");
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [monthlyEnabled, setMonthlyEnabled] = useState(false);

  // Validation errors
  const [weeklyError, setWeeklyError] = useState("");
  const [monthlyError, setMonthlyError] = useState("");

  // Load configuration on mount
  useEffect(() => {
    dispatch(loadConfig());
  }, [dispatch]);

  // Update local state when Redux state changes
  useEffect(() => {
    if (weeklyLimit) {
      setWeeklyAmount(weeklyLimit.amount.toString());
      setWeeklyEnabled(weeklyLimit.enabled);
    }
  }, [weeklyLimit]);

  useEffect(() => {
    if (monthlyLimit) {
      setMonthlyAmount(monthlyLimit.amount.toString());
      setMonthlyEnabled(monthlyLimit.enabled);
    }
  }, [monthlyLimit]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert(t("common.error"), error, [
        {
          text: t("common.ok"),
          onPress: () => dispatch(clearError()),
        },
      ]);
    }
  }, [error, dispatch]);

  const validateAmount = (amount: string): boolean => {
    if (amount.trim() === "") {
      return true; // Empty is valid (means no limit)
    }
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  };

  const handleWeeklyAmountChange = (text: string) => {
    setWeeklyAmount(text);
    if (text.trim() !== "" && !validateAmount(text)) {
      setWeeklyError(t("budget.positiveNumberRequired"));
    } else {
      setWeeklyError("");
    }
  };

  const handleMonthlyAmountChange = (text: string) => {
    setMonthlyAmount(text);
    if (text.trim() !== "" && !validateAmount(text)) {
      setMonthlyError(t("budget.positiveNumberRequired"));
    } else {
      setMonthlyError("");
    }
  };

  const handleSave = async () => {
    // Validate inputs
    let hasError = false;

    if (weeklyAmount.trim() !== "" && !validateAmount(weeklyAmount)) {
      setWeeklyError(t("budget.positiveNumberRequired"));
      hasError = true;
    }

    if (monthlyAmount.trim() !== "" && !validateAmount(monthlyAmount)) {
      setMonthlyError(t("budget.positiveNumberRequired"));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      // Save weekly limit
      if (weeklyAmount.trim() !== "") {
        const amount = parseFloat(weeklyAmount);
        if (weeklyLimit) {
          await dispatch(
            updateLimit({
              periodType: BudgetPeriodType.WEEKLY,
              amount,
              enabled: weeklyEnabled,
            }),
          ).unwrap();
        } else {
          await dispatch(
            saveLimit({
              periodType: BudgetPeriodType.WEEKLY,
              amount,
            }),
          ).unwrap();
          // Update enabled state after creation
          if (!weeklyEnabled) {
            await dispatch(
              updateLimit({
                periodType: BudgetPeriodType.WEEKLY,
                enabled: weeklyEnabled,
              }),
            ).unwrap();
          }
        }
      }

      // Save monthly limit
      if (monthlyAmount.trim() !== "") {
        const amount = parseFloat(monthlyAmount);
        if (monthlyLimit) {
          await dispatch(
            updateLimit({
              periodType: BudgetPeriodType.MONTHLY,
              amount,
              enabled: monthlyEnabled,
            }),
          ).unwrap();
        } else {
          await dispatch(
            saveLimit({
              periodType: BudgetPeriodType.MONTHLY,
              amount,
            }),
          ).unwrap();
          // Update enabled state after creation
          if (!monthlyEnabled) {
            await dispatch(
              updateLimit({
                periodType: BudgetPeriodType.MONTHLY,
                enabled: monthlyEnabled,
              }),
            ).unwrap();
          }
        }
      }

      Alert.alert(t("common.success"), t("budget.saveSuccess"), [
        {
          text: t("common.ok"),
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      // Error is handled by the useEffect above
      console.error("Failed to save spending limits:", err);
    }
  };

  const formatCurrencyDisplay = (amount: string) => {
    if (amount.trim() === "") return "";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;
    return formatCurrency(numAmount);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <GoBackButton />
        <View>
          <Text style={styles.headerTitle}>{t("budget.headerTitle")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("budget.headerSubtitle")}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Limit Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar-outline" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>
                {t("budget.weeklySection")}
              </Text>
            </View>
            <Switch
              value={weeklyEnabled}
              onValueChange={setWeeklyEnabled}
              trackColor={{ false: "#ddd", true: "#667eea" }}
              thumbColor={weeklyEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t("budget.limitAmount")}</Text>
            <TextInput
              style={[styles.input, weeklyError ? styles.inputError : null]}
              value={weeklyAmount}
              onChangeText={handleWeeklyAmountChange}
              placeholder={t("budget.enterAmount")}
              placeholderTextColor="#999"
              keyboardType="numeric"
              editable={!loading}
            />
            {weeklyError ? (
              <Text style={styles.errorText}>{weeklyError}</Text>
            ) : null}
            {weeklyAmount.trim() !== "" && !weeklyError ? (
              <Text style={styles.formattedAmount}>
                {formatCurrencyDisplay(weeklyAmount)}
              </Text>
            ) : null}
            <Text style={styles.helperText}>{t("budget.weeklyHelper")}</Text>
          </View>
        </View>

        {/* Monthly Limit Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar" size={20} color="#FF6B9D" />
              <Text style={styles.sectionTitle}>
                {t("budget.monthlySection")}
              </Text>
            </View>
            <Switch
              value={monthlyEnabled}
              onValueChange={setMonthlyEnabled}
              trackColor={{ false: "#ddd", true: "#FF6B9D" }}
              thumbColor={monthlyEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t("budget.limitAmount")}</Text>
            <TextInput
              style={[styles.input, monthlyError ? styles.inputError : null]}
              value={monthlyAmount}
              onChangeText={handleMonthlyAmountChange}
              placeholder={t("budget.enterAmount")}
              placeholderTextColor="#999"
              keyboardType="numeric"
              editable={!loading}
            />
            {monthlyError ? (
              <Text style={styles.errorText}>{monthlyError}</Text>
            ) : null}
            {monthlyAmount.trim() !== "" && !monthlyError ? (
              <Text style={styles.formattedAmount}>
                {formatCurrencyDisplay(monthlyAmount)}
              </Text>
            ) : null}
            <Text style={styles.helperText}>{t("budget.monthlyHelper")}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#667eea" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t("budget.noteTitle")}</Text>
            <Text style={styles.infoText}>{t("budget.noteText")}</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading || !!weeklyError || !!monthlyError}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {t("budget.saveSettings")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f6fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 13,
    marginTop: 6,
  },
  formattedAmount: {
    fontSize: 14,
    color: "#667eea",
    marginTop: 8,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: "#f0f4ff",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#667eea",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: "#667eea",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
});
