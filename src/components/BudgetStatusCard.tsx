import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BudgetStatus, BudgetPeriodType } from "../types/spendingLimit.types";
import { Colors } from "../../constants/theme";
import { formatCurrency } from "../utils/formatUtils";

interface BudgetStatusCardProps {
  budgetStatus: BudgetStatus;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BudgetStatusCard({
  budgetStatus,
  onPress,
}: BudgetStatusCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Determine color based on budget status
  const getStatusColor = () => {
    if (budgetStatus.isExceeded) {
      return "#EF4444"; // Red for exceeded
    }
    if (budgetStatus.isWarning) {
      return "#F59E0B"; // Yellow/Orange for warning (>= 80%)
    }
    return "#10B981"; // Green for safe
  };

  const statusColor = getStatusColor();

  // Get period label
  const getPeriodLabel = () => {
    return budgetStatus.periodType === BudgetPeriodType.WEEKLY
      ? "Tuần này"
      : "Tháng này";
  };

  // Get period icon
  const getPeriodIcon = (): keyof typeof Ionicons.glyphMap => {
    return budgetStatus.periodType === BudgetPeriodType.WEEKLY
      ? "calendar-outline"
      : "calendar";
  };

  const CardContent = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${statusColor}20` },
          ]}
        >
          <Ionicons name={getPeriodIcon()} size={24} color={statusColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.periodLabel, { color: colors.text }]}>
            {getPeriodLabel()}
          </Text>
          <Text style={[styles.limitText, { color: colors.icon }]}>
            Hạn mức: {formatCurrency(budgetStatus.limit)}
          </Text>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        )}
      </View>

      {/* Budget amounts */}
      <View style={styles.amountsContainer}>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: colors.icon }]}>
            Đã chi
          </Text>
          <Text style={[styles.amountValue, { color: statusColor }]}>
            {formatCurrency(budgetStatus.spent)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: colors.icon }]}>
            Còn lại
          </Text>
          <Text
            style={[
              styles.amountValue,
              {
                color: budgetStatus.remaining >= 0 ? colors.text : "#EF4444",
              },
            ]}
          >
            {formatCurrency(budgetStatus.remaining)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            {
              backgroundColor: colorScheme === "dark" ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(budgetStatus.percentage, 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.percentageText, { color: statusColor }]}>
          {budgetStatus.percentage.toFixed(0)}%
        </Text>
      </View>

      {/* Status message */}
      {budgetStatus.isExceeded && (
        <View style={[styles.statusMessage, { backgroundColor: "#FEE2E2" }]}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={[styles.statusMessageText, { color: "#991B1B" }]}>
            Đã vượt hạn mức
          </Text>
        </View>
      )}
      {budgetStatus.isWarning && !budgetStatus.isExceeded && (
        <View style={[styles.statusMessage, { backgroundColor: "#FEF3C7" }]}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={[styles.statusMessageText, { color: "#92400E" }]}>
            Sắp đạt hạn mức
          </Text>
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colorScheme === "dark" ? "#1F2937" : "#fff",
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === "dark" ? "#1F2937" : "#fff",
        },
      ]}
    >
      {CardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    // Responsive width for different screen sizes
    maxWidth: SCREEN_WIDTH > 768 ? 600 : "100%",
    alignSelf: "center",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  limitText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  amountsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  amountItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 11,
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 6,
  },
  statusMessageText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
