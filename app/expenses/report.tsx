import { GoBackButton } from "@/src/components";
import BarChart from "@/src/components/BarChart";
import PieChart from "@/src/components/PieChart";
import { getExpenseCategories } from "@/src/constants/ExpenseCategories";
import { useTranslation } from "@/src/hooks/useTranslation";
import { loadFamilyMembers } from "@/src/redux";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { SpenderBreakdown } from "@/src/types";
import {
  filterExpensesByMonth,
  formatCurrency,
  generateMonthlySummary,
  getCurrentMonth,
  getNextMonth,
  getPreviousMonth,
} from "@/src/utils/expenseUtils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MonthlyReportScreen() {
  const expenses = useAppSelector((state) => state.expenses.expenses);
  const familyMembers = useAppSelector((state) => state.family.members);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [viewMode, setViewMode] = useState<"category" | "spender">("spender");
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const EXPENSE_CATEGORIES = useMemo(() => getExpenseCategories(t), [t]);

  useEffect(() => {
    dispatch(loadFamilyMembers());
  }, [dispatch]);

  const monthlySummary = useMemo(
    () => generateMonthlySummary(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const monthlyExpenses = useMemo(
    () => filterExpensesByMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const spenderBreakdown = useMemo(() => {
    const breakdown: { [key: string]: SpenderBreakdown } = {};
    const total = monthlySummary.totalAmount;

    monthlyExpenses.forEach((expense) => {
      const spenderId = expense.spender || "unknown";

      if (!breakdown[spenderId]) {
        breakdown[spenderId] = {
          spender: spenderId,
          amount: 0,
          percentage: 0,
          count: 0,
          categoryBreakdown: [],
        };
      }

      breakdown[spenderId].amount += expense.amount;
      breakdown[spenderId].count += 1;
    });

    // Calculate percentages
    Object.values(breakdown).forEach((item) => {
      item.percentage = total > 0 ? (item.amount / total) * 100 : 0;
    });

    return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
  }, [monthlyExpenses, monthlySummary.totalAmount]);

  const handlePreviousMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonth(selectedMonth));
  };

  const getCategoryConfig = (categoryKey: string) => {
    return EXPENSE_CATEGORIES.find((cat) => cat.key === categoryKey);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <GoBackButton />
              <Text style={styles.headerTitle}>{t("reports.headerTitle")}</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.monthNavigation}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={handlePreviousMonth}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.monthText}>{selectedMonth}</Text>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={handleNextMonth}
              >
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>
                {t("reports.totalExpenses")}
              </Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(monthlySummary.totalAmount)}
              </Text>
              <Text style={styles.summaryCount}>
                {monthlySummary.expenseCount} {t("reports.transactions")}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* View Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "spender" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("spender")}
          >
            <Ionicons
              name="people"
              size={18}
              color={viewMode === "spender" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.toggleText,
                viewMode === "spender" && styles.toggleTextActive,
              ]}
            >
              {t("reports.bySpender")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "category" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("category")}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === "category" ? "#fff" : "#666"}
            />
            <Text
              style={[
                styles.toggleText,
                viewMode === "category" && styles.toggleTextActive,
              ]}
            >
              {t("reports.byCategory")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spender Breakdown */}
        {viewMode === "spender" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("reports.spenderBreakdown")}
            </Text>

            {spenderBreakdown.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {t("reports.noSpenderData")}
                </Text>
              </View>
            ) : (
              <>
                {/* Pie Chart */}
                <View style={styles.chartCard}>
                  <PieChart
                    data={spenderBreakdown.map((breakdown) => {
                      const member = familyMembers.find(
                        (m) => m.id === breakdown.spender,
                      );
                      return {
                        value: breakdown.amount,
                        color: member?.color || "#999",
                        label: member?.name || t("reports.uncategorized"),
                        percentage: breakdown.percentage,
                      };
                    })}
                    size={180}
                    strokeWidth={28}
                  />
                  <View style={styles.legendContainer}>
                    {spenderBreakdown.map((breakdown) => {
                      const member = familyMembers.find(
                        (m) => m.id === breakdown.spender,
                      );
                      const displayName =
                        member?.name || t("reports.uncategorized");
                      const color = member?.color || "#999";

                      return (
                        <View key={breakdown.spender} style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: color },
                            ]}
                          />
                          <Text style={styles.legendLabel}>{displayName}</Text>
                          <Text style={styles.legendValue}>
                            {breakdown.percentage.toFixed(0)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Bar Chart */}
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>
                    {t("reports.amountDetail")}
                  </Text>
                  <BarChart
                    data={spenderBreakdown.map((breakdown) => {
                      const member = familyMembers.find(
                        (m) => m.id === breakdown.spender,
                      );
                      return {
                        label: member?.name || t("reports.uncategorized"),
                        value: breakdown.amount,
                        percentage: breakdown.percentage,
                        color: member?.color || "#999",
                        icon: member?.icon || "person",
                      };
                    })}
                    formatValue={formatCurrency}
                  />
                </View>
              </>
            )}
          </View>
        )}

        {/* Category Breakdown */}
        {viewMode === "category" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("reports.categoryDetail")}
            </Text>

            {monthlySummary.categoryBreakdown.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {t("reports.noExpensesThisMonth")}
                </Text>
              </View>
            ) : (
              <>
                {/* Pie Chart */}
                <View style={styles.chartCard}>
                  <PieChart
                    data={monthlySummary.categoryBreakdown.map((breakdown) => {
                      const categoryConfig = getCategoryConfig(
                        breakdown.category,
                      );
                      return {
                        value: breakdown.amount,
                        color: categoryConfig?.color || "#999",
                        label: categoryConfig?.label || breakdown.category,
                        percentage: breakdown.percentage,
                      };
                    })}
                    size={180}
                    strokeWidth={28}
                  />
                  <View style={styles.legendContainer}>
                    {monthlySummary.categoryBreakdown.map((breakdown) => {
                      const categoryConfig = getCategoryConfig(
                        breakdown.category,
                      );
                      if (!categoryConfig) return null;

                      return (
                        <View
                          key={breakdown.category}
                          style={styles.legendItem}
                        >
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: categoryConfig.color },
                            ]}
                          />
                          <Text style={styles.legendLabel}>
                            {categoryConfig.label}
                          </Text>
                          <Text style={styles.legendValue}>
                            {breakdown.percentage.toFixed(0)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Bar Chart */}
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>
                    {t("reports.amountDetail")}
                  </Text>
                  <BarChart
                    data={monthlySummary.categoryBreakdown.map((breakdown) => {
                      const categoryConfig = getCategoryConfig(
                        breakdown.category,
                      );
                      return {
                        label: categoryConfig?.label || breakdown.category,
                        value: breakdown.amount,
                        percentage: breakdown.percentage,
                        color: categoryConfig?.color || "#999",
                        icon: categoryConfig?.icon,
                      };
                    })}
                    formatValue={formatCurrency}
                  />
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  headerContent: {
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 8,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    minWidth: 80,
    textAlign: "center",
  },
  summaryBox: {
    alignItems: "center",
    paddingTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.85,
    fontWeight: "500",
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  summaryCount: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.9,
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#667eea",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  toggleTextActive: {
    color: "#fff",
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  legendContainer: {
    marginTop: 20,
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },

  emptyState: {
    alignItems: "center",
    padding: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
});
