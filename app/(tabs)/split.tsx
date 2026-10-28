import { useCurrencyFormat } from "@/src/hooks/useCurrency";
import { useTranslation } from "@/src/hooks/useTranslation";
import { syncSplitExpenses } from "@/src/redux";
import { useAppDispatch } from "@/src/redux/store";
import {
  buildPersonalSplitExpenses,
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
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
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
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormat();
  const [trips, setTrips] = useState<SplitTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [tripView, setTripView] = useState<"overview" | "details">("overview");
  const [sharePreviewVisible, setSharePreviewVisible] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const shareCardRef = useRef<View>(null);
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
          void dispatch(
            syncSplitExpenses(buildPersonalSplitExpenses(storedTrips)),
          );
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
    }, [dispatch, t]),
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
    void dispatch(syncSplitExpenses(buildPersonalSplitExpenses(nextTrips)))
      .unwrap()
      .catch(() => Alert.alert(t("common.error"), t("split.syncFailed")));
  };

  const updateSelectedTrip = (updates: Partial<SplitTrip>) => {
    if (!selectedTrip) return;
    commitTrips(
      trips.map((trip) =>
        trip.id === selectedTrip.id ? { ...trip, ...updates } : trip,
      ),
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
      includeInPersonalExpenses: false,
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
              personalParticipantId:
                trip.personalParticipantId === participant.id
                  ? trip.participants.find((item) => item.id !== participant.id)
                      ?.id
                  : trip.personalParticipantId,
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

  const buildShareMessage = () => {
    if (!selectedTrip) return "";
    const expenseLines = selectedTrip.expenses.map(
      (expense) =>
        `- ${expense.title} (${expense.date}) - ${formatCurrency(expense.amount)} · ${getParticipantName(expense.paidById)}`,
    );
    const settlementLines = balances.map((balance) => {
      const direction =
        balance.balance > 0.005
          ? t("split.getsBack")
          : balance.balance < -0.005
            ? t("split.owesAmount")
            : t("split.settled");
      return `- ${getParticipantName(balance.participantId)}: ${direction} ${formatCurrency(Math.abs(balance.balance))}`;
    });

    return [
      `${t("split.shareTitle")}: ${selectedTrip.name}`,
      `${t("split.totalSpent")}: ${formatCurrency(totalSpent)}`,
      "",
      `${t("split.expenses")}:`,
      ...(expenseLines.length > 0
        ? expenseLines
        : [`- ${t("split.noExpenses")}`]),
      "",
      `${t("split.settlementOverview")}:`,
      ...(settlementLines.length > 0
        ? settlementLines
        : [`- ${t("split.noParticipants")}`]),
    ].join("\n");
  };

  const shareSummary = async () => {
    if (!selectedTrip || isSharingImage) return;
    setIsSharingImage(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        await Share.share({
          title: selectedTrip.name,
          message: buildShareMessage(),
        });
        return;
      }

      const { captureRef } = await import("react-native-view-shot");
      const imageUri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      await Sharing.shareAsync(imageUri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: selectedTrip.name,
      });
    } catch {
      try {
        await Share.share({
          title: selectedTrip.name,
          message: buildShareMessage(),
        });
      } catch {
        Alert.alert(t("common.error"), t("split.shareFailed"));
      }
    } finally {
      setIsSharingImage(false);
    }
  };

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
                onPress={() => {
                  setSelectedTripId(trip.id);
                  setTripView("overview");
                }}
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

            <View style={styles.viewTabs}>
              <TouchableOpacity
                style={[
                  styles.viewTab,
                  tripView === "overview" && styles.viewTabActive,
                ]}
                onPress={() => setTripView("overview")}
              >
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color={tripView === "overview" ? "#fff" : "#6E7974"}
                />
                <Text
                  style={[
                    styles.viewTabText,
                    tripView === "overview" && styles.viewTabTextActive,
                  ]}
                >
                  {t("split.overview")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewTab,
                  tripView === "details" && styles.viewTabActive,
                ]}
                onPress={() => setTripView("details")}
              >
                <Ionicons
                  name="list-outline"
                  size={17}
                  color={tripView === "details" ? "#fff" : "#6E7974"}
                />
                <Text
                  style={[
                    styles.viewTabText,
                    tripView === "details" && styles.viewTabTextActive,
                  ]}
                >
                  {t("split.details")}
                </Text>
              </TouchableOpacity>
            </View>

            {tripView === "overview" ? (
              <View style={styles.overviewContent}>
                <View style={styles.overviewHero}>
                  <View style={styles.overviewHeroTop}>
                    <View>
                      <Text style={styles.overviewEyebrow}>
                        {t("split.totalSpent")}
                      </Text>
                      <Text style={styles.overviewTotal}>
                        {formatCurrency(totalSpent)}
                      </Text>
                    </View>
                    <View style={styles.overviewIcon}>
                      <Ionicons name="receipt" size={22} color="#124A40" />
                    </View>
                  </View>
                  <View style={styles.overviewMetrics}>
                    <View style={styles.overviewMetric}>
                      <Text style={styles.overviewMetricValue}>
                        {selectedTrip.expenses.length}
                      </Text>
                      <Text style={styles.overviewMetricLabel}>
                        {t("split.expenses")}
                      </Text>
                    </View>
                    <View style={styles.overviewMetricDivider} />
                    <View style={styles.overviewMetric}>
                      <Text style={styles.overviewMetricValue}>
                        {selectedTrip.participants.length}
                      </Text>
                      <Text style={styles.overviewMetricLabel}>
                        {t("split.participants")}
                      </Text>
                    </View>
                    {selectedTrip.expenses.length > 0 && (
                      <>
                        <View style={styles.overviewMetricDivider} />
                        <View style={styles.overviewMetric}>
                          <Text style={styles.overviewMetricValue}>
                            {formatCurrency(
                              totalSpent / selectedTrip.expenses.length,
                            )}
                          </Text>
                          <Text style={styles.overviewMetricLabel}>
                            {t("split.averageExpense")}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.shareSummaryButton}
                  onPress={() => setSharePreviewVisible(true)}
                >
                  <Ionicons name="share-outline" size={18} color="#fff" />
                  <Text style={styles.shareSummaryButtonText}>
                    {t("split.shareSummary")}
                  </Text>
                </TouchableOpacity>

                <View style={styles.overviewSection}>
                  <View style={styles.overviewSectionHeading}>
                    <View>
                      <Text style={styles.overviewSectionTitle}>
                        {t("split.settlementOverview")}
                      </Text>
                      <Text style={styles.overviewSectionHint}>
                        {t("split.settlementOverviewHint")}
                      </Text>
                    </View>
                    <Ionicons
                      name="swap-horizontal"
                      size={20}
                      color="#667eea"
                    />
                  </View>
                  <View style={styles.overviewBalanceList}>
                    {balances.map((balance, index) => {
                      const positive = balance.balance > 0.005;
                      const negative = balance.balance < -0.005;
                      const color = positive
                        ? "#187A51"
                        : negative
                          ? "#C65A3A"
                          : "#68736F";
                      return (
                        <View
                          key={balance.participantId}
                          style={[
                            styles.overviewBalanceRow,
                            index === balances.length - 1 &&
                              styles.overviewBalanceRowLast,
                          ]}
                        >
                          <View style={styles.overviewBalancePerson}>
                            <View style={styles.overviewAvatar}>
                              <Text style={styles.overviewAvatarText}>
                                {getParticipantName(balance.participantId)
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.overviewBalanceName}>
                                {getParticipantName(balance.participantId)}
                              </Text>
                              <Text style={styles.overviewBalanceMeta}>
                                {t("split.paid")} {formatCurrency(balance.paid)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.overviewBalanceRight}>
                            <Text
                              style={[styles.overviewBalanceAmount, { color }]}
                            >
                              {formatCurrency(Math.abs(balance.balance))}
                            </Text>
                            <Text
                              style={[styles.overviewBalanceStatus, { color }]}
                            >
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
                      <Text style={styles.mutedText}>
                        {t("split.emptySubtitle")}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.overviewSection}>
                  <View style={styles.overviewSectionHeading}>
                    <Text style={styles.overviewSectionTitle}>
                      {t("split.recentExpenses")}
                    </Text>
                    <TouchableOpacity
                      style={styles.seeAllButton}
                      onPress={() => setTripView("details")}
                    >
                      <Text style={styles.seeAllText}>{t("split.seeAll")}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color="#667eea"
                      />
                    </TouchableOpacity>
                  </View>
                  {selectedTrip.expenses.length === 0 ? (
                    <TouchableOpacity
                      style={styles.overviewEmptyExpenses}
                      onPress={openExpenseForm}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#667eea"
                      />
                      <Text style={styles.overviewEmptyText}>
                        {t("split.addExpense")}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.overviewRecentList}>
                      {selectedTrip.expenses.slice(0, 3).map((expense) => (
                        <View key={expense.id} style={styles.overviewRecentRow}>
                          <View style={styles.overviewRecentIcon}>
                            <Ionicons
                              name="receipt-outline"
                              size={17}
                              color="#667eea"
                            />
                          </View>
                          <View style={styles.overviewRecentDescription}>
                            <Text
                              numberOfLines={1}
                              style={styles.overviewRecentTitle}
                            >
                              {expense.title}
                            </Text>
                            <Text style={styles.overviewRecentMeta}>
                              {getParticipantName(expense.paidById)}
                              {"  ·  "}
                              {expense.date}
                            </Text>
                          </View>
                          <Text style={styles.overviewRecentAmount}>
                            {formatCurrency(expense.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <>
                <View style={styles.totalBand}>
                  <View>
                    <Text style={styles.totalLabel}>
                      {t("split.totalSpent")}
                    </Text>
                    <Text style={styles.totalAmount}>
                      {formatCurrency(totalSpent)}
                    </Text>
                  </View>
                  <View style={styles.totalIcon}>
                    <Ionicons
                      name="receipt-outline"
                      size={23}
                      color="#667eea"
                    />
                  </View>
                </View>

                <View style={styles.personalExpenseSetting}>
                  <View style={styles.personalExpenseHeader}>
                    <View style={styles.personalExpenseCopy}>
                      <Text style={styles.sectionTitle}>
                        {t("split.includeInPersonalExpenses")}
                      </Text>
                      <Text style={styles.personalExpenseHint}>
                        {t("split.personalExpensesHint")}
                      </Text>
                    </View>
                    <Switch
                      value={selectedTrip.includeInPersonalExpenses ?? false}
                      onValueChange={(enabled) =>
                        updateSelectedTrip({
                          includeInPersonalExpenses: enabled,
                          personalParticipantId: enabled
                            ? (selectedTrip.personalParticipantId ??
                              selectedTrip.participants[0]?.id)
                            : selectedTrip.personalParticipantId,
                        })
                      }
                      trackColor={{ false: "#C9D1CC", true: "#8CCF94" }}
                      thumbColor={
                        selectedTrip.includeInPersonalExpenses
                          ? "#2E7D32"
                          : "#fff"
                      }
                    />
                  </View>
                  {selectedTrip.includeInPersonalExpenses && (
                    <View style={styles.personalParticipantList}>
                      <Text style={styles.personalParticipantLabel}>
                        {t("split.personalParticipant")}
                      </Text>
                      {selectedTrip.participants.map((participant) => (
                        <TouchableOpacity
                          key={participant.id}
                          style={styles.personalParticipantRow}
                          onPress={() =>
                            updateSelectedTrip({
                              personalParticipantId: participant.id,
                            })
                          }
                        >
                          <View
                            style={[
                              styles.radio,
                              selectedTrip.personalParticipantId ===
                                participant.id && styles.radioSelected,
                            ]}
                          >
                            {selectedTrip.personalParticipantId ===
                              participant.id && (
                              <View style={styles.radioDot} />
                            )}
                          </View>
                          <Text style={styles.optionText}>
                            {participant.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {t("split.participants")}
                  </Text>
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
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#93A09B"
                        />
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
                      <View
                        key={balance.participantId}
                        style={styles.summaryRow}
                      >
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
                    <Text style={styles.mutedText}>
                      {t("split.emptySubtitle")}
                    </Text>
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
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color="#667eea"
                    />
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
                {expenseAmount &&
                  Number.isFinite(parseAmount(expenseAmount)) &&
                  parseAmount(expenseAmount) > 0 && (
                    <View style={styles.formattedAmountContainer}>
                      <Text style={styles.formattedAmountText}>
                        {formatCurrency(parseAmount(expenseAmount))}
                      </Text>
                    </View>
                  )}

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

      <Modal
        visible={sharePreviewVisible && Boolean(selectedTrip)}
        animationType="slide"
        transparent
        onRequestClose={() => setSharePreviewVisible(false)}
      >
        <View style={styles.sharePreviewBackdrop}>
          <View
            style={[
              styles.sharePreviewSheet,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t("split.sharePreview")}</Text>
                <Text style={styles.sharePreviewSubtitle}>
                  {t("split.sharePreviewHint")}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={t("common.close")}
                onPress={() => setSharePreviewVisible(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={22} color="#53605B" />
              </TouchableOpacity>
            </View>
            {selectedTrip && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sharePreviewContent}
              >
                <View
                  ref={shareCardRef}
                  collapsable={false}
                  style={styles.shareImageCard}
                >
                  <View style={styles.sharePreviewHero}>
                    <Text style={styles.sharePreviewTripName}>
                      {selectedTrip.name}
                    </Text>
                    <Text style={styles.sharePreviewTotalLabel}>
                      {t("split.totalSpent")}
                    </Text>
                    <Text style={styles.sharePreviewTotal}>
                      {formatCurrency(totalSpent)}
                    </Text>
                    <Text style={styles.sharePreviewMeta}>
                      {selectedTrip.expenses.length} {t("split.expenses")}
                      {"  ·  "}
                      {selectedTrip.participants.length}{" "}
                      {t("split.participants")}
                    </Text>
                  </View>

                  <View style={styles.sharePreviewSection}>
                    <Text style={styles.sharePreviewSectionTitle}>
                      {t("split.expenses")}
                    </Text>
                    {selectedTrip.expenses.length === 0 ? (
                      <Text style={styles.sharePreviewEmpty}>
                        {t("split.noExpenses")}
                      </Text>
                    ) : (
                      selectedTrip.expenses.map((expense, index) => (
                        <View
                          key={expense.id}
                          style={[
                            styles.sharePreviewRow,
                            index === selectedTrip.expenses.length - 1 &&
                              styles.sharePreviewRowLast,
                          ]}
                        >
                          <View style={styles.sharePreviewRowCopy}>
                            <Text style={styles.sharePreviewRowTitle}>
                              {expense.title}
                            </Text>
                            <Text style={styles.sharePreviewRowMeta}>
                              {getParticipantName(expense.paidById)}
                              {"  ·  "}
                              {expense.date}
                            </Text>
                          </View>
                          <Text style={styles.sharePreviewAmount}>
                            {formatCurrency(expense.amount)}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={styles.sharePreviewSection}>
                    <Text style={styles.sharePreviewSectionTitle}>
                      {t("split.settlementOverview")}
                    </Text>
                    {balances.map((balance, index) => {
                      const positive = balance.balance > 0.005;
                      const negative = balance.balance < -0.005;
                      const color = positive
                        ? "#187A51"
                        : negative
                          ? "#C65A3A"
                          : "#68736F";
                      return (
                        <View
                          key={balance.participantId}
                          style={[
                            styles.sharePreviewRow,
                            index === balances.length - 1 &&
                              styles.sharePreviewRowLast,
                          ]}
                        >
                          <View style={styles.sharePreviewRowCopy}>
                            <Text style={styles.sharePreviewRowTitle}>
                              {getParticipantName(balance.participantId)}
                            </Text>
                            <Text style={styles.sharePreviewRowMeta}>
                              {t("split.paid")} {formatCurrency(balance.paid)}
                            </Text>
                          </View>
                          <View style={styles.sharePreviewSettlement}>
                            <Text
                              style={[styles.sharePreviewAmount, { color }]}
                            >
                              {formatCurrency(Math.abs(balance.balance))}
                            </Text>
                            <Text
                              style={[styles.sharePreviewStatus, { color }]}
                            >
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
                  </View>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.sharePreviewAction}
              onPress={shareSummary}
              disabled={!selectedTrip || isSharingImage}
            >
              {isSharingImage ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="share-outline" size={19} color="#fff" />
              )}
              <Text style={styles.sharePreviewActionText}>
                {isSharingImage
                  ? t("split.creatingImage")
                  : t("split.shareNow")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  viewTabs: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 13,
    backgroundColor: "#E7EBE8",
    marginBottom: 17,
  },
  viewTab: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
  },
  viewTabActive: { backgroundColor: "#263D38" },
  viewTabText: { color: "#6E7974", fontSize: 13, fontWeight: "600" },
  viewTabTextActive: { color: "#fff" },
  overviewContent: { gap: 18, paddingBottom: 18 },
  shareSummaryButton: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#263D38",
  },
  shareSummaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  overviewHero: {
    borderRadius: 17,
    padding: 19,
    backgroundColor: "#174A40",
  },
  overviewHeroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  overviewEyebrow: {
    color: "#B9D7CC",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 7,
  },
  overviewTotal: { color: "#fff", fontSize: 29, fontWeight: "800" },
  overviewIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#D3E5A9",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewMetrics: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
  },
  overviewMetric: { flex: 1, gap: 4 },
  overviewMetricValue: { color: "#fff", fontSize: 15, fontWeight: "700" },
  overviewMetricLabel: { color: "#B9D7CC", fontSize: 11 },
  overviewMetricDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  overviewSection: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  overviewSectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  overviewSectionTitle: { color: "#25322D", fontSize: 15, fontWeight: "700" },
  overviewSectionHint: { color: "#78847F", fontSize: 11, marginTop: 3 },
  overviewBalanceList: {},
  overviewBalanceRow: {
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8ECE9",
  },
  overviewBalanceRowLast: { borderBottomWidth: 0 },
  overviewBalancePerson: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  overviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#E3EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewAvatarText: { color: "#174A40", fontSize: 13, fontWeight: "800" },
  overviewBalanceName: { color: "#25322D", fontSize: 13, fontWeight: "600" },
  overviewBalanceMeta: { color: "#8A9692", fontSize: 10, marginTop: 3 },
  overviewBalanceRight: { alignItems: "flex-end", marginLeft: 8 },
  overviewBalanceAmount: { fontSize: 13, fontWeight: "700" },
  overviewBalanceStatus: { fontSize: 10, marginTop: 3 },
  seeAllButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { color: "#667eea", fontSize: 12, fontWeight: "700" },
  overviewRecentList: { gap: 12 },
  overviewRecentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  overviewRecentIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewRecentDescription: { flex: 1 },
  overviewRecentTitle: { color: "#25322D", fontSize: 12, fontWeight: "600" },
  overviewRecentMeta: { color: "#8A9692", fontSize: 10, marginTop: 3 },
  overviewRecentAmount: { color: "#25322D", fontSize: 12, fontWeight: "700" },
  overviewEmptyExpenses: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  overviewEmptyText: { color: "#667eea", fontSize: 13, fontWeight: "600" },
  sharePreviewBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(20, 20, 30, 0.48)",
  },
  sharePreviewSheet: {
    maxHeight: "94%",
    backgroundColor: "#F5F6F2",
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    paddingTop: 10,
    paddingHorizontal: 19,
  },
  sharePreviewSubtitle: { color: "#78847F", fontSize: 12, marginTop: 3 },
  sharePreviewContent: { gap: 13, paddingBottom: 14 },
  shareImageCard: {
    alignSelf: "stretch",
    gap: 13,
    padding: 2,
    backgroundColor: "#F5F6F2",
  },
  sharePreviewHero: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#174A40",
  },
  sharePreviewTripName: {
    color: "#D3E5A9",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 17,
  },
  sharePreviewTotalLabel: { color: "#B9D7CC", fontSize: 12, marginBottom: 5 },
  sharePreviewTotal: { color: "#fff", fontSize: 27, fontWeight: "800" },
  sharePreviewMeta: { color: "#B9D7CC", fontSize: 11, marginTop: 9 },
  sharePreviewSection: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 13,
  },
  sharePreviewSectionTitle: {
    color: "#25322D",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },
  sharePreviewRow: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8ECE9",
  },
  sharePreviewRowLast: { borderBottomWidth: 0 },
  sharePreviewRowCopy: { flex: 1 },
  sharePreviewRowTitle: { color: "#25322D", fontSize: 12, fontWeight: "600" },
  sharePreviewRowMeta: { color: "#8A9692", fontSize: 10, marginTop: 3 },
  sharePreviewAmount: { color: "#25322D", fontSize: 12, fontWeight: "700" },
  sharePreviewSettlement: { alignItems: "flex-end" },
  sharePreviewStatus: { fontSize: 10, marginTop: 3 },
  sharePreviewEmpty: { color: "#78847F", fontSize: 12, paddingVertical: 11 },
  sharePreviewAction: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#263D38",
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  sharePreviewActionText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  personalExpenseSetting: {
    backgroundColor: "#fff",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 22,
  },
  personalExpenseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  personalExpenseCopy: { flex: 1, gap: 4 },
  personalExpenseHint: { color: "#78847F", fontSize: 12, lineHeight: 17 },
  personalParticipantList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5EAE6",
    marginTop: 12,
    paddingTop: 8,
  },
  personalParticipantLabel: {
    color: "#78847F",
    fontSize: 12,
    marginBottom: 3,
  },
  personalParticipantRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
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
