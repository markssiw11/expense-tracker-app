import { getExpenseCategories } from "@/src/constants/ExpenseCategories";
import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import { useCustomExpenseCategories } from "@/src/hooks/useCustomExpenseCategories";
import { useTranslation } from "@/src/hooks/useTranslation";
import { selectTodayEvents } from "@/src/redux/reducers/eventSlice";
import {
  selectMonthlyBudgetStatus,
  selectWeeklyBudgetStatus,
} from "@/src/redux/reducers/spendingLimitSlice";
import { useAppSelector } from "@/src/redux/store";
import { formatMonthYear } from "@/src/utils/dateUtils";
import {
  calculateMonthlyTotal,
  filterExpensesByMonth,
  getCurrentMonth,
} from "@/src/utils/expenseUtils";
import {
  calculateIncomeTotal,
  filterIncomesByMonth,
} from "@/src/utils/incomeUtils";
import { getNextOccurrence } from "@/src/utils/recurrenceUtils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardTab() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();

  const expenses = useAppSelector((state) => state.expenses.expenses);
  const incomes = useAppSelector((state) => state.incomes.incomes);
  const rules = useAppSelector((state) => state.recurringExpenses.rules);
  const notes = useAppSelector((state) => state.notes.notes);
  const todayEvents = useAppSelector(selectTodayEvents);
  const weeklyStatus = useAppSelector(selectWeeklyBudgetStatus);
  const monthlyStatus = useAppSelector(selectMonthlyBudgetStatus);

  const month = getCurrentMonth();
  const customCategories = useCustomExpenseCategories();
  const EXPENSE_CATEGORIES = useMemo(
    () => getExpenseCategories(t, customCategories),
    [t, customCategories],
  );

  const totalExpense = useMemo(
    () => calculateMonthlyTotal(filterExpensesByMonth(expenses, month)),
    [expenses, month],
  );
  const totalIncome = useMemo(
    () => calculateIncomeTotal(filterIncomesByMonth(incomes, month)),
    [incomes, month],
  );
  const netBalance = totalIncome - totalExpense;
  const monthExpenses = useMemo(
    () =>
      filterExpensesByMonth(expenses, month).sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      ),
    [expenses, month],
  );
  const recentExpenses = monthExpenses.slice(0, 3);
  const maxCashFlow = Math.max(totalIncome, totalExpense);
  const incomeScale = maxCashFlow > 0 ? (totalIncome / maxCashFlow) * 100 : 0;
  const expenseScale = maxCashFlow > 0 ? (totalExpense / maxCashFlow) * 100 : 0;

  const pinnedNotes = useMemo(
    () => notes.filter((n) => n.isPinned).slice(0, 3),
    [notes],
  );

  const upcomingRecurring = useMemo(() => {
    return rules
      .filter((r) => r.enabled)
      .map((r) => ({ rule: r, next: getNextOccurrence(r) }))
      .sort((a, b) => a.next.getTime() - b.next.getTime())
      .slice(0, 3);
  }, [rules]);

  const activeBudget = monthlyStatus ?? weeklyStatus;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>{t("dashboard.title")}</Text>
            <Text style={styles.headerSubtitle}>
              {`${formatMonthYear(month, t).month} ${formatMonthYear(month, t).year}`}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("settings.title")}
            style={styles.settingsButton}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Ionicons name="settings-outline" size={19} color="#34433D" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>{t("dashboard.netBalance")}</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: netBalance >= 0 ? "#17231F" : "#B94738" },
            ]}
          >
            {netBalance >= 0 ? "" : "-"}
            {formatCurrency(Math.abs(netBalance))}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>
                {t("dashboard.income")}
              </Text>
              <Text style={[styles.balanceItemText, styles.incomeText]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>
                {t("dashboard.expense")}
              </Text>
              <Text style={[styles.balanceItemText, styles.expenseText]}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/expenses/add")}
          >
            <Ionicons name="add-circle-outline" size={21} color="#24745B" />
            <Text style={styles.quickText}>{t("expenses.addExpense")}</Text>
            <Ionicons name="arrow-forward" size={15} color="#8A948E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/income")}
          >
            <Ionicons name="trending-up-outline" size={20} color="#24745B" />
            <Text style={styles.quickText}>{t("income.addIncome")}</Text>
            <Ionicons name="arrow-forward" size={15} color="#8A948E" />
          </TouchableOpacity>
        </View>

        <View style={styles.cashFlowSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              {t("dashboard.monthlyFlow")}
            </Text>
            <TouchableOpacity onPress={() => router.push("/expenses/report")}>
              <Text style={styles.sectionLink}>{t("expenses.report")}</Text>
            </TouchableOpacity>
          </View>
          <View
            accessibilityLabel={`${t("dashboard.income")} ${formatCurrency(totalIncome)}, ${t("dashboard.expense")} ${formatCurrency(totalExpense)}`}
            style={styles.cashFlowBars}
          >
            <View style={styles.cashFlowRow}>
              <Text style={styles.cashFlowLabel}>{t("dashboard.income")}</Text>
              <View style={styles.cashFlowTrack}>
                <View
                  style={[
                    styles.cashFlowFill,
                    styles.cashFlowIncome,
                    { width: `${incomeScale}%` },
                  ]}
                />
              </View>
              <Text style={styles.cashFlowAmount}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={styles.cashFlowRow}>
              <Text style={styles.cashFlowLabel}>{t("dashboard.expense")}</Text>
              <View style={styles.cashFlowTrack}>
                <View
                  style={[
                    styles.cashFlowFill,
                    styles.cashFlowExpense,
                    { width: `${expenseScale}%` },
                  ]}
                />
              </View>
              <Text style={styles.cashFlowAmount}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget */}
        {activeBudget && (
          <View style={styles.budgetSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {t("dashboard.budgetLeft")}
              </Text>
              <Text
                style={[
                  styles.budgetValue,
                  { color: activeBudget.isExceeded ? "#B94738" : "#24745B" },
                ]}
              >
                {formatCurrency(activeBudget.remaining)}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(activeBudget.percentage, 100)}%`,
                    backgroundColor: activeBudget.isExceeded
                      ? "#B94738"
                      : activeBudget.isWarning
                        ? "#C8872E"
                        : "#24745B",
                  },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              {t("dashboard.recentActivity")}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")}>
              <Text style={styles.sectionLink}>{t("calendar.viewAll")}</Text>
            </TouchableOpacity>
          </View>
          {recentExpenses.length === 0 ? (
            <View style={styles.activityEmpty}>
              <View style={styles.activityEmptyMark}>
                <Ionicons name="receipt-outline" size={21} color="#24745B" />
              </View>
              <View style={styles.activityEmptyCopy}>
                <Text style={styles.activityEmptyTitle}>
                  {t("dashboard.noRecentExpenses")}
                </Text>
                <Text style={styles.activityEmptyText}>
                  {t("expenses.addFirstExpense")}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("expenses.addExpense")}
                style={styles.activityAddButton}
                onPress={() => router.push("/expenses/add")}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            recentExpenses.map((expense) => {
              const category = EXPENSE_CATEGORIES.find(
                (item) => item.key === expense.category,
              );
              return (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.activityRow}
                  onPress={() => router.push(`/expenses/edit/${expense.id}`)}
                >
                  <View style={styles.activityCategoryMark}>
                    <Ionicons
                      name={(category?.icon ?? "receipt-outline") as any}
                      size={17}
                      color="#24745B"
                    />
                  </View>
                  <View style={styles.activityDescription}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {expense.note?.trim() ||
                        category?.label ||
                        t("expenses.title")}
                    </Text>
                    <Text style={styles.activityMeta}>
                      {category?.label} ·{" "}
                      {new Date(expense.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.activityAmount}>
                    −{formatCurrency(expense.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Today's events */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              {t("dashboard.todayEvents")}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
              <Text style={styles.sectionLink}>{t("calendar.viewAll")}</Text>
            </TouchableOpacity>
          </View>
          {todayEvents.length === 0 ? (
            <Text style={styles.emptyRow}>{t("calendar.noEventsToday")}</Text>
          ) : (
            todayEvents.slice(0, 3).map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.row}
                onPress={() => router.push(`/events/${event.id}`)}
              >
                <Text style={styles.rowTime}>{event.time}</Text>
                <View style={styles.rowRule} />
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#A2AAA5" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming recurring */}
        {upcomingRecurring.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {t("dashboard.upcomingRecurring")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/settings/recurring-expenses")}
              >
                <Text style={styles.sectionLink}>{t("calendar.viewAll")}</Text>
              </TouchableOpacity>
            </View>
            {upcomingRecurring.map(({ rule, next }) => {
              const cat = EXPENSE_CATEGORIES.find(
                (c) => c.key === rule.category,
              );
              return (
                <View key={rule.id} style={styles.recurringRow}>
                  <View style={styles.recurringLabel}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {cat?.label}
                    </Text>
                    <Text style={styles.rowText}>
                      {next.toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>
                    {formatCurrency(rule.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Pinned notes */}
        {pinnedNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {t("dashboard.pinnedNotes")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/notes")}>
                <Text style={styles.sectionLink}>{t("calendar.viewAll")}</Text>
              </TouchableOpacity>
            </View>
            {pinnedNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.row}
                onPress={() => router.push(`/notes/${note.id}`)}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {note.title}
                </Text>
                <Ionicons name="arrow-forward" size={15} color="#A2AAA5" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBFCFA" },
  header: {
    paddingBottom: 18,
    paddingHorizontal: 22,
    backgroundColor: "#FBFCFA",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "#24745B",
    textTransform: "uppercase",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6E7972",
    marginTop: 4,
    fontFamily: "Georgia",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E3E8E3",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceBlock: {
    marginTop: 24,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#DDE4DE",
  },
  balanceLabel: { fontSize: 13, color: "#68756D", fontWeight: "600" },
  balanceValue: {
    fontFamily: "Georgia",
    fontSize: 48,
    lineHeight: 58,
    fontWeight: "400",
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  balanceItem: { flex: 1, gap: 3 },
  balanceDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#DDE4DE",
    marginHorizontal: 14,
  },
  balanceItemLabel: { fontSize: 12, color: "#7A857E" },
  balanceItemText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#25332C",
    fontVariant: ["tabular-nums"],
  },
  incomeText: { color: "#24745B" },
  expenseText: { color: "#B94738" },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 22, paddingBottom: 36 },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderBottomWidth: 1,
    borderBottomColor: "#DDE4DE",
    paddingBottom: 8,
  },
  quickAction: {
    width: "50%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 9,
    paddingRight: 6,
  },
  quickText: { flex: 1, fontSize: 13, color: "#25332C", fontWeight: "600" },
  cashFlowSection: {
    paddingTop: 18,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#DDE4DE",
  },
  cashFlowBars: { gap: 10 },
  cashFlowRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  cashFlowTrack: {
    flex: 1,
    height: 8,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#E5EAE5",
  },
  cashFlowFill: { height: "100%", borderRadius: 4 },
  cashFlowIncome: { backgroundColor: "#24745B" },
  cashFlowExpense: { backgroundColor: "#D08069" },
  cashFlowLabel: { width: 72, fontSize: 11, color: "#7A857E" },
  cashFlowAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#25332C",
    minWidth: 68,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  activityEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 72,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#E9EDE9",
  },
  activityEmptyMark: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#E3EFEA",
  },
  activityEmptyCopy: { flex: 1, gap: 3 },
  activityEmptyTitle: { fontSize: 13, color: "#25332C", fontWeight: "600" },
  activityEmptyText: { fontSize: 11, color: "#7A857E" },
  activityAddButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#24745B",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#E9EDE9",
  },
  activityCategoryMark: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#E3EFEA",
  },
  activityDescription: { flex: 1, gap: 3 },
  activityTitle: { fontSize: 14, fontWeight: "600", color: "#25332C" },
  activityMeta: { fontSize: 11, color: "#7A857E" },
  activityAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B94738",
    fontVariant: ["tabular-nums"],
  },
  budgetSection: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#DDE4DE",
  },
  section: {
    paddingTop: 20,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#DDE4DE",
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 9,
  },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1D2923" },
  sectionLink: { fontSize: 13, color: "#24745B", fontWeight: "600" },
  budgetValue: { fontSize: 16, fontWeight: "700", textAlign: "right" },
  progressTrack: {
    height: 5,
    backgroundColor: "#E5EAE5",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 7,
  },
  progressFill: { height: "100%", borderRadius: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 45,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#E9EDE9",
  },
  rowTime: {
    width: 58,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    color: "#6E7972",
  },
  rowRule: { width: 2, height: 20, backgroundColor: "#91B9A5" },
  rowText: { fontSize: 12, color: "#7A857E" },
  rowTitle: { fontSize: 14, color: "#25332C", flex: 1, fontWeight: "500" },
  rowAmount: { fontSize: 14, color: "#25332C", fontWeight: "600" },
  recurringRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 49,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: "#E9EDE9",
  },
  recurringLabel: { flex: 1, gap: 3 },
  emptyRow: {
    fontSize: 14,
    color: "#7A857E",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E9EDE9",
  },
});
