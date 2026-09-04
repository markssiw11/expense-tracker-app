import { GoBackButton } from "@/src/components";
import { getExpenseCategories } from "@/src/constants/ExpenseCategories";
import { getFamilyMemberName } from "@/src/constants/FamilyMembers";
import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import useTranslation from "@/src/hooks/useTranslation";
import {
  addRecurringExpense,
  deleteRecurringExpense,
  loadFamilyMembers,
  loadRecurringExpenses,
  processRecurringExpenses,
  updateRecurringExpense,
} from "@/src/redux";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { ExpenseCategory } from "@/src/types";
import {
  RecurrenceFrequency,
  RecurringExpense,
} from "@/src/types/recurringExpense.types";
import { getNextOccurrence } from "@/src/utils/recurrenceUtils";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecurringExpensesScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();
  const insets = useSafeAreaInsets();

  const rules = useAppSelector((state) => state.recurringExpenses.rules);
  const familyMembers = useAppSelector((state) => state.family.members);
  const EXPENSE_CATEGORIES = useMemo(() => getExpenseCategories(t), [t]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringExpense | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [spender, setSpender] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    RecurrenceFrequency.MONTHLY,
  );
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    dispatch(loadRecurringExpenses());
    dispatch(loadFamilyMembers());
  }, [dispatch]);

  const resetForm = () => {
    setAmount("");
    setCategory(null);
    setSpender(null);
    setFrequency(RecurrenceFrequency.MONTHLY);
    setStartDate(new Date());
  };

  const openAddModal = () => {
    setEditingRule(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (rule: RecurringExpense) => {
    setEditingRule(rule);
    setAmount(rule.amount.toString());
    setCategory(rule.category);
    setSpender(rule.spender ?? null);
    setFrequency(rule.frequency);
    setStartDate(new Date(rule.startDate));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingRule(null);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t("common.error"), t("expenses.amountRequired"));
      return;
    }
    if (!category) {
      Alert.alert(t("common.error"), t("expenses.categoryRequired"));
      return;
    }

    if (editingRule) {
      await dispatch(
        updateRecurringExpense({
          id: editingRule.id,
          data: {
            amount: parsedAmount,
            category,
            spender: spender ?? undefined,
            frequency,
            startDate: startDate.toISOString(),
          },
        }),
      );
    } else {
      const now = new Date().toISOString();
      const newRule: RecurringExpense = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        amount: parsedAmount,
        category,
        spender: spender ?? undefined,
        frequency,
        startDate: startDate.toISOString(),
        lastGeneratedDate: null,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      };
      await dispatch(addRecurringExpense(newRule));
    }

    // Generate any occurrences that are already due for the new/updated rule.
    await dispatch(processRecurringExpenses());
    closeModal();
  };

  const handleToggle = (rule: RecurringExpense) => {
    dispatch(
      updateRecurringExpense({
        id: rule.id,
        data: { enabled: !rule.enabled },
      }),
    );
  };

  const handleDelete = (rule: RecurringExpense) => {
    Alert.alert(
      t("common.confirmDelete"),
      t("recurring.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => dispatch(deleteRecurringExpense(rule.id)),
        },
      ],
    );
  };

  const frequencyLabel = (freq: RecurrenceFrequency) =>
    freq === RecurrenceFrequency.WEEKLY
      ? t("recurring.weekly")
      : t("recurring.monthly");

  const renderRuleItem = ({ item }: { item: RecurringExpense }) => {
    const categoryConfig = EXPENSE_CATEGORIES.find(
      (c) => c.key === item.category,
    );
    const member = familyMembers.find((m) => m.id === item.spender);
    const nextDate = getNextOccurrence(item);

    return (
      <View style={[styles.ruleCard, !item.enabled && styles.ruleCardDisabled]}>
        <View
          style={[
            styles.ruleIcon,
            { backgroundColor: categoryConfig?.color ?? "#999" },
          ]}
        >
          <Ionicons
            name={(categoryConfig?.icon as any) ?? "repeat"}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.ruleInfo}>
          <Text style={styles.ruleAmount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.ruleMeta}>
            {categoryConfig?.label}
            {member ? ` · ${getFamilyMemberName(member, t)}` : ""}
          </Text>
          <Text style={styles.ruleSchedule}>
            {frequencyLabel(item.frequency)}
            {item.enabled
              ? ` · ${t("recurring.next")}: ${nextDate.toLocaleDateString()}`
              : ` · ${t("recurring.paused")}`}
          </Text>
        </View>
        <View style={styles.ruleActions}>
          <Switch
            value={item.enabled}
            onValueChange={() => handleToggle(item)}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={item.enabled ? "#667eea" : "#f4f3f4"}
          />
          <View style={styles.ruleButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="create-outline" size={20} color="#667eea" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
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
          <Text style={styles.headerTitle}>{t("recurring.headerTitle")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("recurring.headerSubtitle")}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={rules}
        renderItem={renderRuleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="repeat" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t("recurring.noRules")}</Text>
            <Text style={styles.emptySubtext}>{t("recurring.addFirst")}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRule
                ? t("recurring.editRule")
                : t("recurring.addRule")}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t("expenses.amount")} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Category */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>
                  {t("expenses.category")} *
                </Text>
                <View style={styles.categoryGrid}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryItem,
                        category === cat.key && styles.categoryItemSelected,
                      ]}
                      onPress={() => setCategory(cat.key)}
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
                          size={22}
                          color={category === cat.key ? "#fff" : "#666"}
                        />
                      </View>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Spender */}
              {familyMembers.length > 0 && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>{t("expenses.spender")}</Text>
                  <View style={styles.spenderRow}>
                    {familyMembers.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.spenderChip,
                          spender === member.id && styles.spenderChipSelected,
                        ]}
                        onPress={() =>
                          setSpender(spender === member.id ? null : member.id)
                        }
                      >
                        <Text
                          style={[
                            styles.spenderChipText,
                            spender === member.id &&
                              styles.spenderChipTextSelected,
                          ]}
                        >
                          {getFamilyMemberName(member, t)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Frequency */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t("recurring.frequency")}</Text>
                <View style={styles.frequencyRow}>
                  {[
                    RecurrenceFrequency.WEEKLY,
                    RecurrenceFrequency.MONTHLY,
                  ].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyOption,
                        frequency === freq && styles.frequencyOptionSelected,
                      ]}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          frequency === freq && styles.frequencyTextSelected,
                        ]}
                      >
                        {frequencyLabel(freq)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Start date */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t("recurring.startDate")}</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateText}>
                    {startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(_, selected) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selected) setStartDate(selected);
                    }}
                  />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeModal}
              >
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSave}
              >
                <Text style={styles.modalSaveText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
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
  headerSubtitle: { fontSize: 14, color: "#fff", opacity: 0.9 },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  ruleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ruleCardDisabled: { opacity: 0.55 },
  ruleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  ruleInfo: { flex: 1 },
  ruleAmount: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  ruleMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  ruleSchedule: { fontSize: 12, color: "#999", marginTop: 2 },
  ruleActions: { alignItems: "center", gap: 6 },
  ruleButtonsRow: { flexDirection: "row", gap: 4 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 12,
  },
  emptySubtext: { fontSize: 14, color: "#bbb", marginTop: 4 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "88%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
  },
  inputSection: { marginBottom: 20 },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryItem: { width: "22%", alignItems: "center" },
  categoryItemSelected: {},
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryLabel: { fontSize: 11, textAlign: "center", color: "#333" },
  spenderRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  spenderChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  spenderChipSelected: { backgroundColor: "#667eea" },
  spenderChipText: { fontSize: 14, color: "#666", fontWeight: "500" },
  spenderChipTextSelected: { color: "#fff", fontWeight: "600" },
  frequencyRow: { flexDirection: "row", gap: 12 },
  frequencyOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  frequencyOptionSelected: { backgroundColor: "#667eea" },
  frequencyText: { fontSize: 15, color: "#666", fontWeight: "600" },
  frequencyTextSelected: { color: "#fff" },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  dateText: { fontSize: 16, color: "#333" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  modalCancelText: { fontSize: 16, fontWeight: "600", color: "#666" },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#667eea",
    alignItems: "center",
  },
  modalSaveText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
