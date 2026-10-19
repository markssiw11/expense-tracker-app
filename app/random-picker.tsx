import { useTranslation } from "@/src/hooks/useTranslation";
import {
  drawRandomEntries,
  getWheelRotationTarget,
  RANDOM_PICKER_ENTRIES_KEY,
} from "@/src/utils/randomPicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polygon, Text as SvgText } from "react-native-svg";

const DURATIONS = [2, 4, 7] as const;
const WHEEL_COLORS = [
  "#E6B56F",
  "#D98570",
  "#68AFA2",
  "#7899BF",
  "#C5839B",
  "#A5B879",
  "#D99A59",
  "#75AEB5",
];

function polarPoint(center: number, angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function wheelSlicePath(
  center: number,
  radius: number,
  start: number,
  end: number,
) {
  const first = polarPoint(center, start, radius);
  const last = polarPoint(center, end, radius);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${center} ${center} L ${first.x} ${first.y} A ${radius} ${radius} 0 ${largeArc} 1 ${last.x} ${last.y} Z`;
}

export default function RandomPickerScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { t } = useTranslation();
  const [entryText, setEntryText] = useState("");
  const [winnerCount, setWinnerCount] = useState("1");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(4);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [spinningIndex, setSpinningIndex] = useState<number | null>(null);
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationDegrees = useRef(0);
  const nextSpinTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelSize = Math.min(windowWidth - 76, 350);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(RANDOM_PICKER_ENTRIES_KEY)
      .then((storedEntries) => {
        if (!isMounted || !storedEntries) return;
        const parsed: unknown = JSON.parse(storedEntries);
        if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string")) {
          setEntryText((current) => current || parsed.join("\n"));
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const entries = useMemo(
    () =>
      entryText
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    [entryText],
  );
  const parsedWinnerCount = Math.max(1, Number.parseInt(winnerCount, 10) || 1);
  const maximumWinners = allowDuplicates
    ? undefined
    : Math.min(parsedWinnerCount, entries.length);
  const wheelEntries = entries.map((label, index) => ({ label, id: index }));
  const rotationStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
          extrapolate: "extend" as const,
        }),
      },
    ],
  };

  useEffect(
    () => () => {
      if (nextSpinTimeout.current) clearTimeout(nextSpinTimeout.current);
      rotation.stopAnimation();
    },
    [rotation],
  );

  const startDraw = () => {
    if (entries.length === 0 || isDrawing) return;
    const result = drawRandomEntries(
      wheelEntries,
      maximumWinners ?? parsedWinnerCount,
      allowDuplicates,
    );
    if (result.length === 0) return;
    setIsDrawing(true);
    setWinners([]);
    const spinForWinner = (winnerIndex: number) => {
      const winner = result[winnerIndex];
      const currentRotation = rotationDegrees.current;
      const destination = getWheelRotationTarget(
        currentRotation,
        winner.id,
        entries.length,
      );

      setSpinningIndex(winner.id);
      Animated.timing(rotation, {
        toValue: destination,
        duration: duration * 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        rotationDegrees.current = destination;
        const revealed = result
          .slice(0, winnerIndex + 1)
          .map((entry) => entry.label);
        setWinners(revealed);

        if (winnerIndex + 1 < result.length) {
          nextSpinTimeout.current = setTimeout(
            () => spinForWinner(winnerIndex + 1),
            350,
          );
        } else {
          setHistory((current) =>
            [result.map((entry) => entry.label), ...current].slice(0, 5),
          );
          setIsDrawing(false);
          setSpinningIndex(null);
        }
      });
    };
    spinForWinner(0);
  };

  const clearResults = () => {
    setWinners([]);
    setHistory([]);
  };

  const displayedEntries = winners;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            accessibilityLabel={t("common.back")}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color="#4F5FC2" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{t("randomPicker.title")}</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.wheelStage}>
          <View style={styles.wheelCaption}>
            <Text style={styles.wheelHeadline}>
              {t("randomPicker.headline")}
            </Text>
            <Text style={styles.wheelSubtitle}>
              {t("randomPicker.subtitle")}
            </Text>
          </View>
          <View
            style={[
              styles.wheelFrame,
              { width: wheelSize + 28, height: wheelSize + 38 },
            ]}
          >
            <Svg width={wheelSize} height={wheelSize} style={styles.wheelSvg}>
              <Circle
                cx={wheelSize / 2}
                cy={wheelSize / 2}
                r={wheelSize / 2 - 2}
                fill="#667eea"
              />
            </Svg>
            {entries.length > 0 ? (
              <Animated.View
                style={[
                  styles.rotatingWheel,
                  { width: wheelSize, height: wheelSize },
                  rotationStyle,
                ]}
              >
                <Svg
                  width={wheelSize}
                  height={wheelSize}
                  viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                >
                  {wheelEntries.map((entry, index) => {
                    const sweep = 360 / wheelEntries.length;
                    const start = -90 + index * sweep;
                    const end = start + sweep;
                    const labelPoint = polarPoint(
                      wheelSize / 2,
                      start + sweep / 2,
                      wheelSize * 0.31,
                    );
                    const labelSize =
                      wheelEntries.length > 16
                        ? 0
                        : wheelEntries.length > 10
                          ? 10
                          : 12;
                    return (
                      <React.Fragment key={entry.id}>
                        <Path
                          d={wheelSlicePath(
                            wheelSize / 2,
                            wheelSize / 2 - 4,
                            start,
                            end,
                          )}
                          fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                        {labelSize > 0 && (
                          <SvgText
                            x={labelPoint.x}
                            y={labelPoint.y}
                            fill="#19342E"
                            fontSize={labelSize}
                            fontWeight="700"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                          >
                            {entry.label.length > 13
                              ? `${entry.label.slice(0, 12)}…`
                              : entry.label}
                          </SvgText>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {wheelEntries.length === 1 && (
                    <Circle
                      cx={wheelSize / 2}
                      cy={wheelSize / 2}
                      r={wheelSize / 2 - 5}
                      fill={WHEEL_COLORS[0]}
                    />
                  )}
                </Svg>
              </Animated.View>
            ) : (
              <View
                style={[
                  styles.wheelEmpty,
                  { width: wheelSize, height: wheelSize },
                ]}
              >
                <Ionicons name="people-outline" size={34} color="#53766D" />
                <Text style={styles.wheelEmptyText}>
                  {t("randomPicker.wheelEmpty")}
                </Text>
              </View>
            )}
            <View style={styles.wheelPointer}>
              <Svg width={28} height={34} viewBox="0 0 28 34">
                <Polygon
                  points="14,34 1,2 27,2"
                  fill="#4F5FC2"
                  stroke="#F7F7ED"
                  strokeWidth={2}
                />
              </Svg>
            </View>
            {entries.length > 0 && (
              <View style={styles.wheelHub}>
                <Ionicons
                  name={isDrawing ? "sync" : "sparkles"}
                  size={20}
                  color="#4F5FC2"
                />
              </View>
            )}
          </View>
          {isDrawing && spinningIndex !== null && (
            <Text style={styles.spinningLabel}>{entries[spinningIndex]}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.drawButton,
            (entries.length === 0 || isDrawing) && styles.drawButtonDisabled,
          ]}
          onPress={startDraw}
          disabled={entries.length === 0 || isDrawing}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isDrawing ? "sync" : "shuffle"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.drawButtonText}>
            {isDrawing ? t("randomPicker.drawing") : t("randomPicker.draw")}
          </Text>
        </TouchableOpacity>

        {(displayedEntries.length > 0 || history.length > 0) && (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {t("randomPicker.result")}
              </Text>
              {!isDrawing && history.length > 0 && (
                <TouchableOpacity onPress={clearResults}>
                  <Text style={styles.clearText}>
                    {t("randomPicker.clearHistory")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {displayedEntries.map((entry, index) => (
              <View key={`${entry}-${index}`} style={styles.winnerRow}>
                <View style={styles.winnerNumber}>
                  <Text style={styles.winnerNumberText}>{index + 1}</Text>
                </View>
                <Text numberOfLines={1} style={styles.winnerName}>
                  {entry}
                </Text>
                {!isDrawing && (
                  <Ionicons name="checkmark-circle" size={22} color="#667eea" />
                )}
              </View>
            ))}
            {!isDrawing && history.length > 1 && (
              <View style={styles.historyBlock}>
                <Text style={styles.historyTitle}>
                  {t("randomPicker.previousDraws")}
                </Text>
                {history.slice(1).map((draw, index) => (
                  <View key={`history-${index}`} style={styles.historyRow}>
                    <Text style={styles.historyIndex}>
                      #{history.length - index - 1}
                    </Text>
                    <Text numberOfLines={1} style={styles.historyNames}>
                      {draw.join(", ")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            {t("randomPicker.participants")}
          </Text>
          <Text style={styles.countLabel}>
            {entries.length} {t("randomPicker.people")}
          </Text>
        </View>
        <TextInput
          value={entryText}
          onChangeText={setEntryText}
          placeholder={t("randomPicker.participantsPlaceholder")}
          placeholderTextColor="#8A9792"
          multiline
          editable={!isDrawing}
          textAlignVertical="top"
          style={styles.participantsInput}
          accessibilityLabel={t("randomPicker.participants")}
        />
        <Text style={styles.helperText}>{t("randomPicker.listHint")}</Text>

        <View style={styles.optionsHeader}>
          <Text style={styles.sectionTitle}>{t("randomPicker.options")}</Text>
        </View>

        <View style={styles.optionLine}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>
              {t("randomPicker.winnerCount")}
            </Text>
            <Text style={styles.optionDescription}>
              {t("randomPicker.winnerCountHint")}
            </Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity
              accessibilityLabel={t("randomPicker.decreaseWinners")}
              style={styles.stepButton}
              disabled={isDrawing}
              onPress={() =>
                setWinnerCount(String(Math.max(1, parsedWinnerCount - 1)))
              }
            >
              <Ionicons name="remove" size={18} color="#667eea" />
            </TouchableOpacity>
            <TextInput
              value={winnerCount}
              onChangeText={(value) => setWinnerCount(value.replace(/\D/g, ""))}
              keyboardType="number-pad"
              selectTextOnFocus
              editable={!isDrawing}
              style={styles.stepValue}
              accessibilityLabel={t("randomPicker.winnerCount")}
            />
            <TouchableOpacity
              accessibilityLabel={t("randomPicker.increaseWinners")}
              style={styles.stepButton}
              disabled={isDrawing}
              onPress={() => setWinnerCount(String(parsedWinnerCount + 1))}
            >
              <Ionicons name="add" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.optionLine}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{t("randomPicker.duration")}</Text>
            <Text style={styles.optionDescription}>
              {t("randomPicker.durationHint")}
            </Text>
          </View>
          <View style={styles.durationControl}>
            {DURATIONS.map((seconds) => (
              <TouchableOpacity
                key={seconds}
                disabled={isDrawing}
                style={[
                  styles.durationButton,
                  duration === seconds && styles.durationButtonActive,
                ]}
                onPress={() => setDuration(seconds)}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === seconds && styles.durationTextActive,
                  ]}
                >
                  {seconds}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.optionLine, styles.lastOptionLine]}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>
              {t("randomPicker.allowDuplicates")}
            </Text>
            <Text style={styles.optionDescription}>
              {t("randomPicker.allowDuplicatesHint")}
            </Text>
          </View>
          <Switch
            value={allowDuplicates}
            onValueChange={setAllowDuplicates}
            disabled={isDrawing}
            trackColor={{ false: "#D9DCE5", true: "#C6CCF8" }}
            thumbColor={allowDuplicates ? "#667eea" : "#FFFFFF"}
            accessibilityLabel={t("randomPicker.allowDuplicates")}
          />
        </View>

        {!allowDuplicates &&
          entries.length > 0 &&
          parsedWinnerCount > entries.length && (
            <Text style={styles.limitNote}>
              {t("randomPicker.winnerLimit")}
            </Text>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  content: { paddingHorizontal: 20, paddingBottom: 38 },
  topBar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: { color: "#1A1A1A", fontSize: 16, fontWeight: "700" },
  topBarSpacer: { width: 40 },
  wheelStage: { alignItems: "center", paddingTop: 4, marginBottom: 0 },
  wheelCaption: { alignItems: "center", marginBottom: 13 },
  wheelHeadline: { color: "#1A1A1A", fontSize: 21, fontWeight: "800" },
  wheelSubtitle: {
    color: "#78847D",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  wheelFrame: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  wheelSvg: { position: "absolute" },
  rotatingWheel: { alignItems: "center", justifyContent: "center" },
  wheelEmpty: {
    borderRadius: 999,
    backgroundColor: "#EEF0FF",
    borderWidth: 9,
    borderColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  wheelEmptyText: { color: "#53675F", fontSize: 12, fontWeight: "600" },
  wheelPointer: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -14,
    zIndex: 3,
    alignItems: "center",
  },
  wheelHub: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F5F6EF",
    borderWidth: 4,
    borderColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  spinningLabel: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 7,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { color: "#1A1A1A", fontSize: 16, fontWeight: "700" },
  countLabel: { color: "#667eea", fontSize: 12, fontWeight: "700" },
  participantsInput: {
    minHeight: 118,
    maxHeight: 190,
    borderRadius: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E4EA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#24352F",
    fontSize: 15,
    lineHeight: 22,
  },
  helperText: {
    color: "#78847D",
    fontSize: 12,
    marginTop: 7,
    marginBottom: 22,
  },
  optionsHeader: { marginBottom: 2 },
  optionLine: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DCE4DD",
    gap: 12,
  },
  lastOptionLine: { borderBottomWidth: 0 },
  optionCopy: { flex: 1 },
  optionTitle: { color: "#2C3A34", fontSize: 14, fontWeight: "600" },
  optionDescription: {
    color: "#7A867F",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 3,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    minWidth: 34,
    textAlign: "center",
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: "700",
    padding: 0,
  },
  durationControl: { flexDirection: "row", gap: 5 },
  durationButton: {
    width: 39,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  durationButtonActive: { backgroundColor: "#667eea" },
  durationText: { color: "#555", fontSize: 12, fontWeight: "600" },
  durationTextActive: { color: "#fff" },
  limitNote: { color: "#A05E2B", fontSize: 12, lineHeight: 17, marginTop: 3 },
  drawButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#667eea",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 0,
    marginBottom: 14,
  },
  drawButtonDisabled: { opacity: 0.4 },
  drawButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  resultsSection: { marginTop: 16 },
  clearText: { color: "#74817A", fontSize: 12, fontWeight: "600" },
  winnerRow: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 7,
  },
  winnerNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  winnerNumberText: { color: "#667eea", fontSize: 13, fontWeight: "800" },
  winnerName: { flex: 1, color: "#1A1A1A", fontSize: 16, fontWeight: "700" },
  historyBlock: { marginTop: 16 },
  historyTitle: {
    color: "#78847D",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  historyRow: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DCE4DD",
  },
  historyIndex: { color: "#87928B", fontSize: 11, fontWeight: "700" },
  historyNames: { flex: 1, color: "#52615A", fontSize: 12 },
});
