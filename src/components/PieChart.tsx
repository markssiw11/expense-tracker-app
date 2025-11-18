import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface PieChartData {
  value: number;
  color: string;
  label: string;
  percentage: number;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
}

export default function PieChart({
  data,
  size = 200,
  strokeWidth = 30,
}: PieChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentAngle = -90; // Start from top

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G rotation={0} origin={`${center}, ${center}`}>
          {data.map((item, index) => {
            const angle = (item.percentage / 100) * 360;
            const strokeDashoffset =
              circumference - (item.percentage / 100) * circumference;

            const segment = (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                rotation={currentAngle}
                origin={`${center}, ${center}`}
                strokeLinecap="round"
              />
            );

            currentAngle += angle;
            return segment;
          })}
        </G>
      </Svg>

      {/* Center hole for donut effect */}
      <View style={[styles.centerHole, { width: size - strokeWidth * 2 }]}>
        <Text style={styles.centerText}>100%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerHole: {
    position: "absolute",
    aspectRatio: 1,
    borderRadius: 1000,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  centerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
});
