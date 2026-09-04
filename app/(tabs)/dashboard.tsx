import { getExpenseCategories } from "@/src/constants/ExpenseCategories";
import { useCurrencyFormat } from "@/src/hooks/useCurrency";
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
import { LinearGradient } from "expo-linear-gradient";
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
  const EXPENSE_CATEGORIES = useMemo(() => getExpenseCategories(t), [t]);

  const totalExpense = useMemo(
    () => calculateMonthlyTotal(filterExpensesByMonth(expenses, month)),
    [expenses, month],
  );
  const totalIncome = useMemo(
    () => calculateIncomeTotal(filterIncomesByMonth(incomes, month)),
    [incomes, month],
  );
  const netBalance = totalIncome - totalExpense;

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
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>{t("dashboard.title")}</Text>
        <Text style={styles.headerSubtitle}>
          {`${formatMonthYear(month, t).month} ${formatMonthYear(month, t).year}`}
        </Text>

        {/* Net balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t("dashboard.netBalance")}</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: netBalance >= 0 ? "#D1FAE5" : "#FECACA" },
            ]}
          >
            {netBalance >= 0 ? "" : "-"}
            {formatCurrency(Math.abs(netBalance))}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-down-circle" size={16} color="#D1FAE5" />
              <Text style={styles.balanceItemText}>
                {t("dashboard.income")}: {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-up-circle" size={16} color="#FECACA" />
              <Text style={styles.balanceItemText}>
                {t("dashboard.expense")}: {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/expenses/add")}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#EF4444" }]}>
              <Ionicons name="remove" size={22} color="#fff" />
            </View>
            <Text style={styles.quickText}>{t("expenses.addExpense")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/income")}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#10B981" }]}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <Text style={styles.quickText}>{t("income.addIncome")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/expenses/report")}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#667eea" }]}>
              <Ionicons name="stats-chart" size={20} color="#fff" />
            </View>
            <Text style={styles.quickText}>{t("expenses.report")}</Text>
          </TouchableOpacity>
        </View>

        {/* Budget */}
        {activeBudget && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("dashboard.budgetLeft")}</Text>
            <Text
              style={[
                styles.budgetValue,
                { color: activeBudget.isExceeded ? "#EF4444" : "#10B981" },
              ]}
            >
              {formatCurrency(activeBudget.remaining)}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(activeBudget.percentage, 100)}%`,
                    backgroundColor: activeBudget.isExceeded
                      ? "#EF4444"
                      : activeBudget.isWarning
                        ? "#F59E0B"
                        : "#10B981",
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Today's events */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t("dashboard.todayEvents")}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
              <Text style={styles.cardLink}>{t("calendar.viewAll")}</Text>
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
                <Ionicons name="time-outline" size={16} color="#667eea" />
                <Text style={styles.rowText}>{event.time}</Text>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming recurring */}
        {upcomingRecurring.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {t("dashboard.upcomingRecurring")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/settings/recurring-expenses")}
              >
                <Text style={styles.cardLink}>{t("calendar.viewAll")}</Text>
              </TouchableOpacity>
            </View>
            {upcomingRecurring.map(({ rule, next }) => {
              const cat = EXPENSE_CATEGORIES.find(
                (c) => c.key === rule.category,
              );
              return (
                <View key={rule.id} style={styles.row}>
                  <Ionicons name="repeat" size={16} color="#F59E0B" />
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {cat?.label}
                  </Text>
                  <Text style={styles.rowText}>
                    {next.toLocaleDateString()}
                  </Text>
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
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("dashboard.pinnedNotes")}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/notes")}>
                <Text style={styles.cardLink}>{t("calendar.viewAll")}</Text>
              </TouchableOpacity>
            </View>
            {pinnedNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.row}
                onPress={() => router.push(`/notes/${note.id}`)}
              >
                <Ionicons name="bookmark" size={16} color="#8B5CF6" />
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {note.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 2,
  },
  balanceCard: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
  },
  balanceLabel: { fontSize: 13, color: "#fff", opacity: 0.9 },
  balanceValue: { fontSize: 30, fontWeight: "800", marginTop: 4 },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  balanceItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  balanceItemText: { fontSize: 12, color: "#fff", opacity: 0.95 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  quickAction: { alignItems: "center", gap: 6 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  quickText: { fontSize: 12, color: "#333", fontWeight: "500" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  cardLink: { fontSize: 13, color: "#667eea", fontWeight: "600" },
  budgetValue: { fontSize: 24, fontWeight: "800", marginVertical: 6 },
  progressTrack: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
  },
  rowText: { fontSize: 13, color: "#888" },
  rowTitle: { fontSize: 14, color: "#333", flex: 1, fontWeight: "500" },
  rowAmount: { fontSize: 14, color: "#EF4444", fontWeight: "600" },
  emptyRow: { fontSize: 14, color: "#999", paddingVertical: 8 },
});
