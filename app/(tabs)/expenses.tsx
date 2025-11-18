import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import {
  loadExpenses,
  deleteExpense,
  setSelectedMonth,
  setFilters,
} from "@/src/redux";
import {
  filterExpensesByMonth,
  calculateMonthlyTotal,
  formatCurrency,
  formatDate,
  getPreviousMonth,
  getNextMonth,
} from "@/src/utils/expenseUtils";
import {
  getCategoryConfig,
  EXPENSE_CATEGORIES,
} from "@/src/constants/ExpenseCategories";
import { Expense, ExpenseCategory } from "@/src/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExpensesTab() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { expenses, loading, selectedMonth, filters } = useAppSelector(
    (state) => state.expenses
  );

  useEffect(() => {
    dispatch(loadExpenses());
  }, [dispatch]);

  const monthlyExpenses = useMemo(() => {
    let filtered = filterExpensesByMonth(expenses, selectedMonth);

    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter((expense) =>
        filters.categories.includes(expense.category)
      );
    }

    return filtered;
  }, [expenses, selectedMonth, filters]);

  const totalAmount = useMemo(() => {
    return calculateMonthlyTotal(monthlyExpenses);
  }, [monthlyExpenses]);

  const handlePreviousMonth = () => {
    dispatch(setSelectedMonth(getPreviousMonth(selectedMonth)));
  };

  const handleNextMonth = () => {
    dispatch(setSelectedMonth(getNextMonth(selectedMonth)));
  };

  const handleAddExpense = () => {
    router.push("/expenses/add");
  };

  const handleEditExpense = (id: string) => {
    router.push(`/expenses/edit/${id}`);
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert("Xóa chi phí", "Bạn có chắc chắn muốn xóa chi phí này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => dispatch(deleteExpense(id)),
      },
    ]);
  };

  const toggleCategoryFilter = (category: ExpenseCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    dispatch(setFilters({ categories: newCategories }));
  };

  const clearFilters = () => {
    dispatch(setFilters({ categories: [] }));
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const categoryConfig = getCategoryConfig(item.category);

    return (
      <TouchableOpacity
        style={styles.expenseItem}
        onPress={() => handleEditExpense(item.id)}
      >
        <View style={styles.expenseLeft}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: categoryConfig.color },
            ]}
          >
            <Ionicons
              name={categoryConfig.icon as any}
              size={24}
              color="#fff"
            />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.categoryLabel}>{categoryConfig.label}</Text>
            {item.note && <Text style={styles.noteText}>{item.note}</Text>}
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteExpense(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Chưa có chi phí nào</Text>
      <Text style={styles.emptySubtext}>
        Nhấn nút + để thêm chi phí đầu tiên
      </Text>
    </View>
  );

  return (
    <View style={[styles.container]}>
      {/* Compact Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.compactHeader, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.monthText}>{selectedMonth}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              style={styles.settingsButton}
            >
              <Ionicons name="settings" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.monthNavigation}>
              <TouchableOpacity
                onPress={handlePreviousMonth}
                style={styles.monthButton}
              >
                <Ionicons name="chevron-back" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthButton}
              >
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalAmount}>
              {formatCurrency(totalAmount)}
            </Text>
            <Text style={styles.totalLabel}>
              {monthlyExpenses.length} giao dịch
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push("/expenses/report")}
          >
            <Ionicons name="stats-chart" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Category Filters */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.categories.length > 0 && (
            <TouchableOpacity
              style={styles.clearFilterChip}
              onPress={clearFilters}
            >
              <Ionicons name="close-circle" size={16} color="#FF3B30" />
              <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
          {EXPENSE_CATEGORIES.map((category) => {
            const isSelected = filters.categories.includes(category.key);
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.filterChip,
                  isSelected && {
                    backgroundColor: category.color,
                    borderColor: category.color,
                  },
                ]}
                onPress={() => toggleCategoryFilter(category.key)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={isSelected ? "#fff" : "#666"}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Expense List */}
      <FlatList
        data={monthlyExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={() => dispatch(loadExpenses())}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  compactHeader: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    opacity: 0.95,
    marginBottom: 4,
  },
  monthText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthNavigation: {
    flexDirection: "row",
    gap: 8,
  },
  monthButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalBox: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    fontWeight: "600",
  },
  reportButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  filterContainer: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  filterScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    backgroundColor: "#FAFAFA",
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  filterChipTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  clearFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFE5E5",
    gap: 6,
  },
  clearFilterText: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 100,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    color: "#1A1A1A",
  },
  noteText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 18,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FF3B30",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
