import { GoBackButton } from "@/src/components";
import { getFamilyMemberName } from "@/src/constants/FamilyMembers";
import { getIncomeCategories } from "@/src/constants/IncomeCategories";
import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import useTranslation from "@/src/hooks/useTranslation";
import {
  addIncome,
  deleteIncome,
  loadFamilyMembers,
  loadIncomes,
  setIncomeSelectedMonth,
  updateIncome,
} from "@/src/redux";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { Income, IncomeCategory } from "@/src/types/income.types";
import { formatMonthYear } from "@/src/utils/dateUtils";
import { getNextMonth, getPreviousMonth } from "@/src/utils/expenseUtils";
import {
  calculateIncomeTotal,
  filterIncomesByMonth,
} from "@/src/utils/incomeUtils";
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function IncomeScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();
  const insets = useSafeAreaInsets();

  const incomes = useAppSelector((state) => state.incomes.incomes);
  const selectedMonth = useAppSelector((state) => state.incomes.selectedMonth);
  const familyMembers = useAppSelector((state) => state.family.members);
  const INCOME_CATEGORIES = useMemo(() => getIncomeCategories(t), [t]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<IncomeCategory | null>(null);
  const [earner, setEarner] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    dispatch(loadIncomes());
    dispatch(loadFamilyMembers());
  }, [dispatch]);

  const monthlyIncomes = useMemo(
    () => filterIncomesByMonth(incomes, selectedMonth),
    [incomes, selectedMonth],
  );
  const monthlyTotal = useMemo(
    () => calculateIncomeTotal(monthlyIncomes),
    [monthlyIncomes],
  );

  const resetForm = () => {
    setAmount("");
    setCategory(null);
    setEarner(null);
    setNote("");
    setDate(new Date());
  };

  const openAddModal = () => {
    setEditingIncome(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (income: Income) => {
    setEditingIncome(income);
    setAmount(income.amount.toString());
    setCategory(income.category);
    setEarner(income.earner ?? null);
    setNote(income.note ?? "");
    setDate(new Date(income.date));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingIncome(null);
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

    if (editingIncome) {
      await dispatch(
        updateIncome({
          id: editingIncome.id,
          data: {
            amount: parsedAmount,
            category,
            earner: earner ?? undefined,
            note: note.trim() || undefined,
            date: date.toISOString(),
          },
        }),
      );
    } else {
      const now = new Date().toISOString();
      const newIncome: Income = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        amount: parsedAmount,
        category,
        earner: earner ?? undefined,
        note: note.trim() || undefined,
        date: date.toISOString(),
        createdAt: now,
        updatedAt: now,
      };
      await dispatch(addIncome(newIncome));
    }
    closeModal();
  };

  const handleDelete = (income: Income) => {
    Alert.alert(t("common.confirmDelete"), t("income.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => dispatch(deleteIncome(income.id)),
      },
    ]);
  };

  const renderIncomeItem = ({ item }: { item: Income }) => {
    const categoryConfig = INCOME_CATEGORIES.find(
      (c) => c.key === item.category,
    );
    const member = familyMembers.find((m) => m.id === item.earner);

    return (
      <TouchableOpacity
        style={styles.incomeCard}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View
          style={[
            styles.incomeIcon,
            { backgroundColor: categoryConfig?.color ?? "#10B981" },
          ]}
        >
          <Ionicons
            name={(categoryConfig?.icon as any) ?? "cash"}
            size={22}
            color="#fff"
          />
        </View>
        <View style={styles.incomeInfo}>
          <Text style={styles.incomeCategory}>{categoryConfig?.label}</Text>
          {(item.note || member) && (
            <Text style={styles.incomeMeta} numberOfLines={1}>
              {[member ? getFamilyMemberName(member, t) : null, item.note]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}
        </View>
        <Text style={styles.incomeAmount}>+{formatCurrency(item.amount)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#059669", "#10B981"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerRow}>
          <GoBackButton />
          <Text style={styles.headerTitle}>{t("income.title")}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={() =>
              dispatch(setIncomeSelectedMonth(getPreviousMonth(selectedMonth)))
            }
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {`${formatMonthYear(selectedMonth, t).month} ${formatMonthYear(selectedMonth, t).year}`}
          </Text>
          <TouchableOpacity
            onPress={() =>
              dispatch(setIncomeSelectedMonth(getNextMonth(selectedMonth)))
            }
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{t("income.monthlyTotal")}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(monthlyTotal)}</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={monthlyIncomes}
        renderItem={renderIncomeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t("income.noIncome")}</Text>
            <Text style={styles.emptySubtext}>{t("income.addFirst")}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingIncome ? t("income.editIncome") : t("income.addIncome")}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
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

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>
                  {t("expenses.category")} *
                </Text>
                <View style={styles.categoryGrid}>
                  {INCOME_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={styles.categoryItem}
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

              {familyMembers.length > 0 && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>{t("income.earner")}</Text>
                  <View style={styles.chipRow}>
                    {familyMembers.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.chip,
                          earner === member.id && styles.chipSelected,
                        ]}
                        onPress={() =>
                          setEarner(earner === member.id ? null : member.id)
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            earner === member.id && styles.chipTextSelected,
                          ]}
                        >
                          {getFamilyMemberName(member, t)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t("expenses.date")}</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, selected) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selected) setDate(selected);
                    }}
                  />
                )}
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>
                  {t("expenses.noteOptional")}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("expenses.enterNote")}
                  value={note}
                  onChangeText={setNote}
                  maxLength={200}
                />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    minWidth: 140,
    textAlign: "center",
  },
  totalBox: { alignItems: "center", marginTop: 16 },
  totalLabel: { fontSize: 13, color: "#fff", opacity: 0.9 },
  totalAmount: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  incomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  incomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  incomeInfo: { flex: 1 },
  incomeCategory: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  incomeMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  incomeAmount: { fontSize: 16, fontWeight: "700", color: "#10B981" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#999", marginTop: 12 },
  emptySubtext: { fontSize: 14, color: "#bbb", marginTop: 4 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  categoryItem: { width: "30%", alignItems: "center", marginBottom: 8 },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryLabel: { fontSize: 11, textAlign: "center", color: "#333" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  chipSelected: { backgroundColor: "#10B981" },
  chipText: { fontSize: 14, color: "#666", fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
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
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  modalSaveText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
