import BudgetStatusCard from "@/src/components/BudgetStatusCard";
import BudgetWarningBanner from "@/src/components/BudgetWarningBanner";
import {
  getCategoryConfig,
  getExpenseCategories,
} from "@/src/constants/ExpenseCategories";
import { getFamilyMemberName } from "@/src/constants/FamilyMembers";
import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  deleteExpense,
  loadConfig,
  loadExpenses,
  selectMonthlyBudgetStatus,
  selectWeeklyBudgetStatus,
  setFilters,
  setSelectedMonth,
} from "@/src/redux";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { Expense, ExpenseCategory } from "@/src/types";
import { formatMonthYear } from "@/src/utils/dateUtils";
import {
  calculateMonthlyTotal,
  filterExpensesByMonth,
  formatDate,
  getNextMonth,
  getPreviousMonth,
} from "@/src/utils/expenseUtils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExpensesTab() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();
  const { expenses, loading, selectedMonth, filters } = useAppSelector(
    (state) => state.expenses,
  );

  // Get budget status from Redux
  const weeklyBudgetStatus = useAppSelector(selectWeeklyBudgetStatus);
  const monthlyBudgetStatus = useAppSelector(selectMonthlyBudgetStatus);

  // State for collapsible budget section
  const [isBudgetExpanded, setIsBudgetExpanded] = React.useState(true);

  // State for view mode: 'list' or 'grid'
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");

  // Local search + spender filter (not persisted).
  const [searchQuery, setSearchQuery] = React.useState("");
  const [spenderFilter, setSpenderFilter] = React.useState<string | null>(null);
  const familyMembers = useAppSelector((state) => state.family.members);

  // Get expense categories with translations
  const EXPENSE_CATEGORIES = useMemo(() => getExpenseCategories(t), [t]);

  // Format month display with translated month names
  const formattedMonth = formatMonthYear(selectedMonth, t);

  useEffect(() => {
    dispatch(loadExpenses());
    dispatch(loadConfig());
  }, [dispatch]);

  const monthlyExpenses = useMemo(() => {
    let filtered = filterExpensesByMonth(expenses, selectedMonth);

    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter((expense) =>
        filters.categories.includes(expense.category),
      );
    }

    // Apply spender filter
    if (spenderFilter) {
      filtered = filtered.filter(
        (expense) => expense.spender === spenderFilter,
      );
    }

    // Apply text search (note text or amount)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((expense) => {
        const noteMatch = expense.note?.toLowerCase().includes(query);
        const amountMatch = expense.amount.toString().includes(query);
        return noteMatch || amountMatch;
      });
    }

    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [expenses, selectedMonth, filters, spenderFilter, searchQuery]);

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
    Alert.alert(t("expenses.deleteExpense"), t("expenses.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
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
    const categoryConfig = getCategoryConfig(item.category, t);

    if (viewMode === "grid") {
      // Grid view - compact card
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => handleEditExpense(item.id)}
          activeOpacity={0.7}
        >
          <View
            style={[styles.gridIcon, { backgroundColor: categoryConfig.color }]}
          >
            <Ionicons
              name={categoryConfig.icon as any}
              size={20}
              color="#fff"
            />
          </View>
          <Text style={styles.gridCategory} numberOfLines={1}>
            {categoryConfig.label}
          </Text>
          <Text style={styles.gridAmount} numberOfLines={1}>
            {formatCurrency(item.amount)}
          </Text>
          {item.note && (
            <Text style={styles.gridNote} numberOfLines={1}>
              {item.note}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // List view - default
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
      <Text style={styles.emptyText}>{t("expenses.noExpenses")}</Text>
      <Text style={styles.emptySubtext}>{t("expenses.addFirstExpense")}</Text>
    </View>
  );

  return (
    <View style={[styles.container]}>
      {/* Single Row Modern Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.modernHeader, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.singleRowHeader}>
          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity
              onPress={handlePreviousMonth}
              style={styles.monthNavButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={styles.monthInfo}>
              <Text style={styles.monthName}>{formattedMonth.month}</Text>
              <Text style={styles.yearText}>{formattedMonth.year}</Text>
            </View>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.monthNavButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Total Amount */}
          <View style={styles.totalSection}>
            <Text style={styles.totalAmount}>
              {formatCurrency(totalAmount)}
            </Text>
            <Text style={styles.transactionCount}>
              {monthlyExpenses.length} {t("expenses.transactions")}
            </Text>
          </View>

          {/* Report Button */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push("/expenses/report")}
            activeOpacity={0.8}
          >
            <Ionicons name="stats-chart-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search + Spender Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={t("expenses.searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
        {familyMembers.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spenderFilterContent}
          >
            <TouchableOpacity
              style={[
                styles.spenderFilterChip,
                !spenderFilter && styles.spenderFilterChipActive,
              ]}
              onPress={() => setSpenderFilter(null)}
            >
              <Text
                style={[
                  styles.spenderFilterText,
                  !spenderFilter && styles.spenderFilterTextActive,
                ]}
              >
                {t("common.all")}
              </Text>
            </TouchableOpacity>
            {familyMembers.map((member) => {
              const active = spenderFilter === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.spenderFilterChip,
                    active && styles.spenderFilterChipActive,
                    active && { backgroundColor: member.color },
                  ]}
                  onPress={() => setSpenderFilter(active ? null : member.id)}
                >
                  <Text
                    style={[
                      styles.spenderFilterText,
                      active && styles.spenderFilterTextActive,
                    ]}
                  >
                    {getFamilyMemberName(member, t)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Category Filters with View Toggle */}
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            style={{ flex: 1 }}
          >
            {filters.categories.length > 0 && (
              <TouchableOpacity
                style={styles.clearFilterChip}
                onPress={clearFilters}
              >
                <Ionicons name="close-circle" size={16} color="#FF3B30" />
                <Text style={styles.clearFilterText}>
                  {t("common.clearFilters")}
                </Text>
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

          {/* View Mode Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === "list" && styles.viewButtonActive,
              ]}
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === "list" ? "#667eea" : "#999"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === "grid" && styles.viewButtonActive,
              ]}
              onPress={() => setViewMode("grid")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid"
                size={18}
                color={viewMode === "grid" ? "#667eea" : "#999"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Collapsible Budget Section */}
      {(weeklyBudgetStatus || monthlyBudgetStatus) && (
        <View style={styles.budgetSection}>
          <TouchableOpacity
            style={styles.budgetHeader}
            onPress={() => setIsBudgetExpanded(!isBudgetExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.budgetHeaderLeft}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color="#667eea"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.budgetHeaderText}>
                {t("expenses.spendingLimits")}
              </Text>
            </View>
            <Ionicons
              name={isBudgetExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#667eea"
            />
          </TouchableOpacity>

          {isBudgetExpanded && (
            <>
              {/* Budget Warning Banner */}
              <View style={styles.warningContainer}>
                <BudgetWarningBanner
                  weeklyStatus={weeklyBudgetStatus}
                  monthlyStatus={monthlyBudgetStatus}
                />
              </View>

              {/* Budget Status Cards */}
              <View style={styles.budgetCardsContainer}>
                {weeklyBudgetStatus && (
                  <BudgetStatusCard
                    budgetStatus={weeklyBudgetStatus}
                    onPress={() =>
                      router.push("/settings/spending-limits" as any)
                    }
                  />
                )}
                {monthlyBudgetStatus && (
                  <BudgetStatusCard
                    budgetStatus={monthlyBudgetStatus}
                    onPress={() =>
                      router.push("/settings/spending-limits" as any)
                    }
                  />
                )}
              </View>
            </>
          )}
        </View>
      )}

      {/* Expense List */}
      <FlatList
        data={monthlyExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={() => dispatch(loadExpenses())}
        numColumns={viewMode === "grid" ? 3 : 1}
        key={viewMode}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
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
  modernHeader: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  singleRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    gap: 8,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthInfo: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 75,
  },
  monthName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  yearText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.8,
    marginTop: 1,
  },
  totalSection: {
    flex: 1,
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  transactionCount: {
    fontSize: 10,
    color: "#fff",
    opacity: 0.85,
    fontWeight: "600",
    marginTop: 2,
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  searchContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    gap: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    padding: 0,
  },
  spenderFilterContent: {
    gap: 8,
    paddingRight: 8,
  },
  spenderFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  spenderFilterChipActive: {
    backgroundColor: "#667eea",
    borderColor: "transparent",
  },
  spenderFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  spenderFilterTextActive: {
    color: "#fff",
  },
  filterContainer: {
    backgroundColor: "#fff",
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 4,
    marginRight: 12,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetSection: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8F9FF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAFF",
  },
  budgetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#667eea",
  },
  warningContainer: {
    marginTop: 12,
    marginHorizontal: 12,
  },
  budgetCardsContainer: {
    marginTop: 8,
    marginHorizontal: 12,
    marginBottom: 12,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    flexGrow: 1,
    paddingBottom: 100,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  expenseInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
    color: "#1A1A1A",
  },
  noteText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
    lineHeight: 16,
  },
  dateText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF3B30",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  deleteButton: {
    padding: 4,
    backgroundColor: "#FFF0F0",
    borderRadius: 6,
  },
  // Grid view styles
  gridRow: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  gridItem: {
    width: "31%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  gridIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  gridCategory: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 4,
  },
  gridAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 2,
  },
  gridNote: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
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
