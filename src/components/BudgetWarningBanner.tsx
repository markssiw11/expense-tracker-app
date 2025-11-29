import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BudgetStatus, BudgetPeriodType } from "../types/spendingLimit.types";
import { formatCurrency } from "../utils/formatUtils";

interface BudgetWarningBannerProps {
  weeklyStatus: BudgetStatus | null;
  monthlyStatus: BudgetStatus | null;
}

export default function BudgetWarningBanner({
  weeklyStatus,
  monthlyStatus,
}: BudgetWarningBannerProps) {
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(
    new Set()
  );

  // Determine which warnings to show
  const warnings: {
    key: string;
    status: BudgetStatus;
    type: "warning" | "exceeded";
  }[] = [];

  if (weeklyStatus) {
    if (weeklyStatus.isExceeded && !dismissedWarnings.has("weekly-exceeded")) {
      warnings.push({
        key: "weekly-exceeded",
        status: weeklyStatus,
        type: "exceeded",
      });
    } else if (
      weeklyStatus.isWarning &&
      !weeklyStatus.isExceeded &&
      !dismissedWarnings.has("weekly-warning")
    ) {
      warnings.push({
        key: "weekly-warning",
        status: weeklyStatus,
        type: "warning",
      });
    }
  }

  if (monthlyStatus) {
    if (
      monthlyStatus.isExceeded &&
      !dismissedWarnings.has("monthly-exceeded")
    ) {
      warnings.push({
        key: "monthly-exceeded",
        status: monthlyStatus,
        type: "exceeded",
      });
    } else if (
      monthlyStatus.isWarning &&
      !monthlyStatus.isExceeded &&
      !dismissedWarnings.has("monthly-warning")
    ) {
      warnings.push({
        key: "monthly-warning",
        status: monthlyStatus,
        type: "warning",
      });
    }
  }

  // Don't render if no warnings
  if (warnings.length === 0) {
    return null;
  }

  const handleDismiss = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissedWarnings((prev) => new Set([...prev, key]));
  };

  const getPeriodLabel = (periodType: BudgetPeriodType) => {
    return periodType === BudgetPeriodType.WEEKLY ? "tuần" : "tháng";
  };

  const getWarningConfig = (type: "warning" | "exceeded") => {
    if (type === "exceeded") {
      return {
        backgroundColor: "#FEE2E2",
        borderColor: "#EF4444",
        iconColor: "#EF4444",
        textColor: "#991B1B",
        icon: "alert-circle" as keyof typeof Ionicons.glyphMap,
      };
    }
    return {
      backgroundColor: "#FEF3C7",
      borderColor: "#F59E0B",
      iconColor: "#F59E0B",
      textColor: "#92400E",
      icon: "warning" as keyof typeof Ionicons.glyphMap,
    };
  };

  return (
    <View style={styles.container}>
      {warnings.map((warning) => {
        const config = getWarningConfig(warning.type);
        const periodLabel = getPeriodLabel(warning.status.periodType);
        const message =
          warning.type === "exceeded"
            ? `Bạn đã vượt hạn mức ${periodLabel} ${formatCurrency(
                warning.status.limit
              )}. Đã chi: ${formatCurrency(warning.status.spent)}`
            : `Bạn đã chi ${warning.status.percentage.toFixed(
                0
              )}% hạn mức ${periodLabel}. Còn lại: ${formatCurrency(
                warning.status.remaining
              )}`;

        return (
          <View
            key={warning.key}
            style={[
              styles.banner,
              {
                backgroundColor: config.backgroundColor,
                borderLeftColor: config.borderColor,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={config.icon} size={24} color={config.iconColor} />
            </View>
            <View style={styles.content}>
              <Text style={[styles.message, { color: config.textColor }]}>
                {message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDismiss(warning.key)}
              style={styles.dismissButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={config.textColor} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  dismissButton: {
    padding: 2,
  },
});
