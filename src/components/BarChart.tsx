import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BarChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  icon?: string;
}

interface BarChartProps {
  data: BarChartData[];
  formatValue?: (value: number) => string;
}

export default function BarChart({ data, formatValue }: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <View key={index} style={styles.barContainer}>
          <View style={styles.labelContainer}>
            {item.icon && (
              <View
                style={[styles.iconContainer, { backgroundColor: item.color }]}
              >
                <Ionicons name={item.icon as any} size={18} color="#fff" />
              </View>
            )}
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </View>

          <View style={styles.barWrapper}>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.value}>
              {formatValue ? formatValue(item.value) : item.value}
            </Text>
          </View>

          <Text style={[styles.percentage, { color: item.color }]}>
            {item.percentage.toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
    gap: 6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  barWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barBackground: {
    flex: 1,
    height: 24,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 12,
    minWidth: 2,
  },
  value: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    minWidth: 60,
    textAlign: "right",
  },
  percentage: {
    fontSize: 13,
    fontWeight: "700",
    width: 40,
    textAlign: "right",
  },
});
