import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import { useTranslation } from "@/src/hooks/useTranslation";
import {
  calculateSplitBalances,
  createEqualShares,
  loadSplitTrips,
  saveSplitTrips,
} from "@/src/services/splitExpenseService";
import {
  SplitExpense,
  SplitParticipant,
  SplitTrip,
} from "@/src/types/splitExpense.types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

type FormType = "trip" | "expense" | null;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, "").trim());
}

export default function SplitTab() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();
  const [trips, setTrips] = useState<SplitTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [formType, setFormType] = useState<FormType>(null);
  const [tripName, setTripName] = useState("");
  const [draftParticipants, setDraftParticipants] = useState<
    SplitParticipant[]
  >([]);
  const [personName, setPersonName] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  const [customSplit, setCustomSplit] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadSplitTrips()
        .then((storedTrips) => {
          if (!isActive) return;
          setTrips(storedTrips);
          setSelectedTripId((currentId) =>
            storedTrips.some((trip) => trip.id === currentId)
              ? currentId
              : (storedTrips[0]?.id ?? null),
          );
        })
        .catch(() => {
          if (isActive) Alert.alert(t("common.error"), t("split.loadFailed"));
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [t]),
  );

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? null;
  const totalSpent =
    selectedTrip?.expenses.reduce(
      (total, expense) => total + expense.amount,
      0,
    ) ?? 0;
  const balances = useMemo(
    () =>
      selectedTrip
        ? calculateSplitBalances(
            selectedTrip.participants,
            selectedTrip.expenses,
          )
        : [],
    [selectedTrip],
  );

  const commitTrips = (nextTrips: SplitTrip[]) => {
    setTrips(nextTrips);
    void saveSplitTrips(nextTrips).catch(() =>
      Alert.alert(t("common.error"), t("split.saveFailed")),
    );
  };

  const openTripForm = () => {
    setTripName("");
    setDraftParticipants([]);
    setPersonName("");
    setFormType("trip");
  };

  const openExpenseForm = () => {
    if (!selectedTrip || selectedTrip.participants.length === 0) return;
    const ids = selectedTrip.participants.map((participant) => participant.id);
    setExpenseTitle("");
    setExpenseAmount("");
    setPayerId(ids[0]);
    setIncludedIds(ids);
    setCustomAmounts({});
    setCustomSplit(false);
    setFormType("expense");
  };

  const addDraftPerson = () => {
    const name = personName.trim();
    if (!name) return;
    setDraftParticipants((current) => [...current, { id: makeId(), name }]);
    setPersonName("");
  };

  const saveTrip = () => {
    const name = tripName.trim();
    if (!name || draftParticipants.length === 0) {
      Alert.alert(t("common.warning"), t("split.tripRequired"));
      return;
    }

    const trip: SplitTrip = {
      id: makeId(),
      name,
      participants: draftParticipants,
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    commitTrips([trip, ...trips]);
    setSelectedTripId(trip.id);
    setFormType(null);
  };

  const saveExpense = () => {
    if (!selectedTrip) return;
    const amount = parseAmount(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(t("common.warning"), t("split.invalidAmount"));
      return;
    }
    if (includedIds.length === 0) {
      Alert.alert(t("common.warning"), t("split.chooseParticipant"));
      return;
    }

    const shares = customSplit
      ? includedIds.map((participantId) => ({
          participantId,
          amount: parseAmount(customAmounts[participantId] ?? "0"),
        }))
      : createEqualShares(amount, includedIds);

    const sharesTotal = Math.round(
      shares.reduce((total, share) => total + share.amount, 0) * 100,
    );
    if (
      shares.some(
        (share) => !Number.isFinite(share.amount) || share.amount < 0,
      ) ||
      sharesTotal !== Math.round(amount * 100)
    ) {
      Alert.alert(t("common.warning"), t("split.sharesMustMatch"));
      return;
    }

    const expense: SplitExpense = {
      id: makeId(),
      title: expenseTitle.trim() || t("split.expenseName"),
      amount,
      paidById: payerId,
      shares,
      date: new Date().toISOString().slice(0, 10),
    };
    commitTrips(
      trips.map((trip) =>
        trip.id === selectedTrip.id
          ? { ...trip, expenses: [expense, ...trip.expenses] }
          : trip,
      ),
    );
    setFormType(null);
  };

  const deleteTrip = (trip: SplitTrip) => {
    Alert.alert(t("split.deleteTrip"), t("split.deleteTripConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          const nextTrips = trips.filter((item) => item.id !== trip.id);
          commitTrips(nextTrips);
          setSelectedTripId(nextTrips[0]?.id ?? null);
        },
      },
    ]);
  };

  const deleteExpense = (expenseId: string) => {
    if (!selectedTrip) return;
    commitTrips(
      trips.map((trip) =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              expenses: trip.expenses.filter(
                (expense) => expense.id !== expenseId,
              ),
            }
          : trip,
      ),
    );
  };

  const addTripPerson = () => {
    if (!selectedTrip) return;
    const name = personName.trim();
    if (!name) return;
    const participant = { id: makeId(), name };
    commitTrips(
      trips.map((trip) =>
        trip.id === selectedTrip.id
          ? { ...trip, participants: [...trip.participants, participant] }
          : trip,
      ),
    );
    setPersonName("");
  };

  const removeTripPerson = (participant: SplitParticipant) => {
    if (!selectedTrip) return;
    const isUsed = selectedTrip.expenses.some(
      (expense) =>
        expense.paidById === participant.id ||
        expense.shares.some((share) => share.participantId === participant.id),
    );
    if (isUsed) {
      Alert.alert(t("common.warning"), t("split.personInUse"));
      return;
    }
    commitTrips(
      trips.map((trip) =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              participants: trip.participants.filter(
                (item) => item.id !== participant.id,
              ),
            }
          : trip,
      ),
    );
  };

  const toggleIncluded = (participantId: string) => {
    setIncludedIds((current) =>
      current.includes(participantId)
        ? current.filter((id) => id !== participantId)
        : [...current, participantId],
    );
  };

  const getParticipantName = (participantId: string) =>
    selectedTrip?.participants.find(
      (participant) => participant.id === participantId,
    )?.name ?? t("common.unknown");

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{t("split.subtitle")}</Text>
            <Text style={styles.title}>{t("split.title")}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={t("split.newTrip")}
            style={styles.headerButton}
            onPress={openTripForm}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {trips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripSelector}
          >
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={[
                  styles.tripChip,
                  selectedTripId === trip.id && styles.tripChipActive,
                ]}
                onPress={() => setSelectedTripId(trip.id)}
                onLongPress={() => deleteTrip(trip)}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tripChipText,
                    selectedTripId === trip.id && styles.tripChipTextActive,
                  ]}
                >
                  {trip.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {isLoading ? (
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        ) : !selectedTrip ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={30} color="#667eea" />
            </View>
            <Text style={styles.emptyTitle}>{t("split.emptyTitle")}</Text>
            <Text style={styles.emptySubtitle}>{t("split.emptySubtitle")}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={openTripForm}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>{t("split.newTrip")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.tripHeading}>
              <View style={styles.tripHeadingText}>
                <Text style={styles.tripName}>{selectedTrip.name}</Text>
                <Text style={styles.tripMeta}>
                  {selectedTrip.participants.length}{" "}
                  {t("split.participants").toLowerCase()}
                  {"  ·  "}
                  {selectedTrip.expenses.length}{" "}
                  {t("split.expenses").toLowerCase()}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={t("split.deleteTrip")}
                style={styles.iconButton}
                onPress={() => deleteTrip(selectedTrip)}
              >
                <Ionicons name="trash-outline" size={19} color="#78827F" />
              </TouchableOpacity>
            </View>

            <View style={styles.totalBand}>
              <View>
                <Text style={styles.totalLabel}>{t("split.totalSpent")}</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
              <View style={styles.totalIcon}>
                <Ionicons name="receipt-outline" size={23} color="#667eea" />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("split.participants")}</Text>
              <View style={styles.personAdd}>
                <TextInput
                  value={personName}
                  onChangeText={setPersonName}
                  placeholder={t("split.participantPlaceholder")}
                  placeholderTextColor="#8A9692"
                  style={styles.personInput}
                  returnKeyType="done"
                  onSubmitEditing={addTripPerson}
                />
                <TouchableOpacity
                  accessibilityLabel={t("split.addPerson")}
                  style={styles.smallAddButton}
                  onPress={addTripPerson}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.peopleList}>
              {selectedTrip.participants.map((participant) => (
                <View key={participant.id} style={styles.personPill}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {participant.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={styles.personPillText}>
                    {participant.name}
                  </Text>
                  <TouchableOpacity
                    accessibilityLabel={`${t("split.removePerson")}: ${participant.name}`}
                    onPress={() => removeTripPerson(participant)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color="#93A09B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("split.summary")}</Text>
            </View>
            <View style={styles.summaryList}>
              {balances.map((balance) => {
                const positive = balance.balance > 0.005;
                const negative = balance.balance < -0.005;
                const color = positive
                  ? "#10B981"
                  : negative
                    ? "#C65A3A"
                    : "#68736F";
                return (
                  <View key={balance.participantId} style={styles.summaryRow}>
                    <View style={styles.summaryPerson}>
                      <View style={[styles.avatar, styles.summaryAvatar]}>
                        <Text style={styles.avatarText}>
                          {getParticipantName(balance.participantId)
                            .slice(0, 1)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.summaryLabels}>
                        <Text style={styles.summaryName}>
                          {getParticipantName(balance.participantId)}
                        </Text>
                        <Text style={styles.summaryDetail}>
                          {t("split.paid")} {formatCurrency(balance.paid)}
                          {"  ·  "}
                          {t("split.owes")} {formatCurrency(balance.share)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.balanceValue}>
                      <Text style={[styles.balanceAmount, { color }]}>
                        {formatCurrency(Math.abs(balance.balance))}
                      </Text>
                      <Text style={[styles.balanceCaption, { color }]}>
                        {positive
                          ? t("split.getsBack")
                          : negative
                            ? t("split.owesAmount")
                            : t("split.settled")}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {balances.length === 0 && (
                <Text style={styles.mutedText}>{t("split.emptySubtitle")}</Text>
              )}
            </View>

            <View style={styles.expenseHeader}>
              <Text style={styles.sectionTitle}>{t("split.expenses")}</Text>
              <TouchableOpacity
                style={styles.addExpenseButton}
                onPress={openExpenseForm}
              >
                <Ionicons name="add" size={18} color="#667eea" />
                <Text style={styles.addExpenseText}>
                  {t("split.addExpense")}
                </Text>
              </TouchableOpacity>
            </View>
            {selectedTrip.expenses.length === 0 ? (
              <TouchableOpacity
                style={styles.firstExpense}
                onPress={openExpenseForm}
              >
                <Ionicons name="add-circle-outline" size={22} color="#667eea" />
                <Text style={styles.firstExpenseText}>
                  {t("split.addExpense")}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.expenseList}>
                {selectedTrip.expenses.map((expense) => (
                  <View key={expense.id} style={styles.expenseRow}>
                    <View style={styles.expenseIcon}>
                      <Ionicons
                        name="receipt-outline"
                        size={19}
                        color="#667eea"
                      />
                    </View>
                    <View style={styles.expenseDescription}>
                      <Text numberOfLines={1} style={styles.expenseTitle}>
                        {expense.title}
                      </Text>
                      <Text style={styles.expenseMeta}>
                        {t("split.payer")}:{" "}
                        {getParticipantName(expense.paidById)}
                        {"  ·  "}
                        {expense.date}
                      </Text>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>
                        {formatCurrency(expense.amount)}
                      </Text>
                      <TouchableOpacity
                        accessibilityLabel={t("split.deleteExpense")}
                        onPress={() => deleteExpense(expense.id)}
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={19} color="#8A9692" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={formType !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setFormType(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formType === "trip"
                  ? t("split.newTrip")
                  : t("split.addExpense")}
              </Text>
              <TouchableOpacity
                accessibilityLabel={t("common.close")}
                onPress={() => setFormType(null)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={22} color="#53605B" />
              </TouchableOpacity>
            </View>

            {formType === "trip" ? (
              <>
                <Text style={styles.inputLabel}>{t("split.tripName")}</Text>
                <TextInput
                  value={tripName}
                  onChangeText={setTripName}
                  placeholder={t("split.tripPlaceholder")}
                  placeholderTextColor="#98A39F"
                  style={styles.textInput}
                  autoFocus
                />
                <Text style={styles.inputLabel}>{t("split.participants")}</Text>
                <View style={styles.inlineInput}>
                  <TextInput
                    value={personName}
                    onChangeText={setPersonName}
                    placeholder={t("split.participantPlaceholder")}
                    placeholderTextColor="#98A39F"
                    style={styles.inlineTextInput}
                    returnKeyType="done"
                    onSubmitEditing={addDraftPerson}
                  />
                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={addDraftPerson}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.draftPeople}>
                  {draftParticipants.map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      style={styles.draftPerson}
                      onPress={() =>
                        setDraftParticipants((current) =>
                          current.filter((item) => item.id !== participant.id),
                        )
                      }
                    >
                      <Text style={styles.draftPersonText}>
                        {participant.name}
                      </Text>
                      <Ionicons name="close" size={15} color="#667eea" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={saveTrip}
                >
                  <Text style={styles.primaryButtonText}>
                    {t("split.newTrip")}
                  </Text>
                </TouchableOpacity>
              </>
            ) : selectedTrip ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.expenseForm}
              >
                <Text style={styles.inputLabel}>{t("split.expenseName")}</Text>
                <TextInput
                  value={expenseTitle}
                  onChangeText={setExpenseTitle}
                  placeholder={t("split.expensePlaceholder")}
                  placeholderTextColor="#98A39F"
                  style={styles.textInput}
                  autoFocus
                />
                <Text style={styles.inputLabel}>{t("split.amount")}</Text>
                <TextInput
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  placeholder="0"
                  placeholderTextColor="#98A39F"
                  style={styles.textInput}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.inputLabel}>{t("split.payer")}</Text>
                <View style={styles.optionList}>
                  {selectedTrip.participants.map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      style={styles.optionRow}
                      onPress={() => setPayerId(participant.id)}
                    >
                      <View
                        style={[
                          styles.radio,
                          payerId === participant.id && styles.radioSelected,
                        ]}
                      >
                        {payerId === participant.id && (
                          <View style={styles.radioDot} />
                        )}
                      </View>
                      <Text style={styles.optionText}>{participant.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>{t("split.sharedBy")}</Text>
                <View style={styles.optionList}>
                  {selectedTrip.participants.map((participant) => {
                    const included = includedIds.includes(participant.id);
                    return (
                      <View key={participant.id} style={styles.shareOptionRow}>
                        <TouchableOpacity
                          style={styles.optionRow}
                          onPress={() => toggleIncluded(participant.id)}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              included && styles.checkboxSelected,
                            ]}
                          >
                            {included && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#fff"
                              />
                            )}
                          </View>
                          <Text style={styles.optionText}>
                            {participant.name}
                          </Text>
                        </TouchableOpacity>
                        {customSplit && included && (
                          <TextInput
                            value={customAmounts[participant.id] ?? ""}
                            onChangeText={(value) =>
                              setCustomAmounts((current) => ({
                                ...current,
                                [participant.id]: value,
                              }))
                            }
                            placeholder="0"
                            placeholderTextColor="#98A39F"
                            keyboardType="decimal-pad"
                            style={styles.shareInput}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={styles.customToggle}
                  onPress={() => {
                    const nextMode = !customSplit;
                    setCustomSplit(nextMode);
                    if (nextMode && expenseAmount) {
                      const equal = createEqualShares(
                        parseAmount(expenseAmount),
                        includedIds,
                      );
                      setCustomAmounts(
                        Object.fromEntries(
                          equal.map((share) => [
                            share.participantId,
                            String(share.amount),
                          ]),
                        ),
                      );
                    }
                  }}
                >
                  <Ionicons
                    name={customSplit ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color="#667eea"
                  />
                  <Text style={styles.customToggleText}>
                    {customSplit
                      ? t("split.customSplit")
                      : t("split.equalSplit")}
                  </Text>
                  <Text style={styles.customModeHint}>
                    {customSplit
                      ? t("split.equalSplit")
                      : t("split.customSplit")}
                  </Text>
                </TouchableOpacity>
                {customSplit && (
                  <Text style={styles.shareHint}>
                    {t("split.sharesMustMatch")}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={saveExpense}
                >
                  <Text style={styles.primaryButtonText}>
                    {t("split.addExpense")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: "#888", fontSize: 13, marginBottom: 5 },
  title: { color: "#1A1A1A", fontSize: 29, fontWeight: "800" },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },
  tripSelector: { gap: 9, paddingBottom: 18 },
  tripChip: {
    maxWidth: 190,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  tripChipActive: { backgroundColor: "#667eea" },
  tripChipText: { color: "#555", fontSize: 14, fontWeight: "600" },
  tripChipTextActive: { color: "#fff" },
  loadingText: { textAlign: "center", color: "#68736F", paddingVertical: 44 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    color: "#1C2925",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#68736F",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 22,
  },
  primaryButton: {
    minHeight: 50,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#667eea",
    borderRadius: 12,
    paddingHorizontal: 18,
    marginTop: 20,
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  tripHeading: { flexDirection: "row", alignItems: "center", marginBottom: 17 },
  tripHeadingText: { flex: 1 },
  tripName: { color: "#1C2925", fontSize: 23, fontWeight: "700" },
  tripMeta: { color: "#75817C", fontSize: 13, marginTop: 5 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  totalBand: {
    minHeight: 112,
    borderRadius: 17,
    backgroundColor: "#EEF0FF",
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  totalLabel: { color: "#646B83", fontSize: 13, marginBottom: 7 },
  totalAmount: { color: "#4F5FC2", fontSize: 27, fontWeight: "800" },
  totalIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: { gap: 13, marginBottom: 12 },
  sectionTitle: { color: "#25322D", fontSize: 17, fontWeight: "700" },
  personAdd: { flexDirection: "row", alignItems: "center", gap: 8 },
  personInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 13,
    backgroundColor: "#fff",
    color: "#1C2925",
    fontSize: 14,
  },
  smallAddButton: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 25,
  },
  personPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EEF0FF",
  },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: "#F4C66A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#35413B", fontSize: 12, fontWeight: "800" },
  personPillText: { color: "#37443E", fontSize: 13, maxWidth: 150 },
  summaryList: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 26,
  },
  summaryRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5EAE6",
    paddingVertical: 10,
  },
  summaryPerson: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EEF0FF",
  },
  summaryLabels: { flex: 1 },
  summaryName: { color: "#25322D", fontSize: 14, fontWeight: "600" },
  summaryDetail: { color: "#78847F", fontSize: 11, marginTop: 4 },
  balanceValue: { alignItems: "flex-end", maxWidth: 115, marginLeft: 8 },
  balanceAmount: { fontSize: 14, fontWeight: "700" },
  balanceCaption: { fontSize: 11, marginTop: 3, textAlign: "right" },
  mutedText: { color: "#78847F", paddingVertical: 16, fontSize: 14 },
  expenseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 5,
  },
  addExpenseText: { color: "#667eea", fontSize: 13, fontWeight: "700" },
  firstExpense: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 13,
    paddingHorizontal: 15,
  },
  firstExpenseText: { color: "#667eea", fontSize: 14, fontWeight: "600" },
  expenseList: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 13,
  },
  expenseRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5EAE6",
    paddingVertical: 10,
  },
  expenseIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  expenseDescription: { flex: 1 },
  expenseTitle: { color: "#25322D", fontSize: 14, fontWeight: "600" },
  expenseMeta: { color: "#78847F", fontSize: 11, marginTop: 4 },
  expenseRight: { alignItems: "flex-end", gap: 5 },
  expenseAmount: { color: "#25322D", fontSize: 13, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(20, 20, 30, 0.42)",
  },
  modalSheet: {
    maxHeight: "92%",
    backgroundColor: "#f5f6fa",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D9D4",
    alignSelf: "center",
    marginBottom: 15,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { color: "#1C2925", fontSize: 20, fontWeight: "700" },
  modalClose: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: "#43504A",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 13,
  },
  textInput: {
    minHeight: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#DCE3DE",
    backgroundColor: "#fff",
    paddingHorizontal: 13,
    color: "#1C2925",
    fontSize: 15,
  },
  inlineInput: { flexDirection: "row", alignItems: "center", gap: 8 },
  inlineTextInput: {
    flex: 1,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#DCE3DE",
    backgroundColor: "#fff",
    paddingHorizontal: 13,
    color: "#1C2925",
    fontSize: 14,
  },
  modalAddButton: {
    width: 46,
    height: 46,
    borderRadius: 11,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },
  draftPeople: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  draftPerson: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "#EEF0FF",
  },
  draftPersonText: { color: "#4F5FC2", fontSize: 13, fontWeight: "600" },
  expenseForm: { paddingBottom: 10 },
  optionList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  optionRow: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionText: { color: "#35413B", fontSize: 14 },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#9BA7A1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: "#667eea" },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#667eea",
  },
  shareOptionRow: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#9BA7A1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: "#667eea", borderColor: "#667eea" },
  shareInput: {
    width: 96,
    height: 35,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCE3DE",
    paddingHorizontal: 8,
    textAlign: "right",
    color: "#25322D",
  },
  customToggle: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  customToggleText: { color: "#25322D", fontSize: 13, fontWeight: "600" },
  customModeHint: { color: "#667eea", fontSize: 12, marginLeft: 8 },
  shareHint: { color: "#78847F", fontSize: 12, lineHeight: 17, marginTop: 1 },
});
