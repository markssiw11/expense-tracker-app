import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface GoBackButtonProps {
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
}

export default function GoBackButton({
  onPress,
  color = "#fff",
  backgroundColor = "rgba(255, 255, 255, 0.2)",
  size = 40,
  iconSize = 18,
  style,
}: GoBackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      onPress={handlePress}
    >
      <Ionicons name="arrow-back" size={iconSize} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
});
