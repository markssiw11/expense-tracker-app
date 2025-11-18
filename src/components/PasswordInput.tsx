import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

interface PasswordInputProps {
  length?: number;
  onComplete: (password: string) => void;
  error?: string;
  disabled?: boolean;
  value?: string;
}

export default function PasswordInput({
  length = 4,
  onComplete,
  error,
  disabled = false,
  value,
}: PasswordInputProps) {
  const [password, setPassword] = useState("");
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Sync with external value prop if provided
  useEffect(() => {
    if (value !== undefined) {
      setPassword(value);
    }
  }, [value]);

  // Animation values
  const shakeAnimation = useSharedValue(0);
  const dotScale0 = useSharedValue(1);
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);
  const dotScale4 = useSharedValue(1);
  const dotScale5 = useSharedValue(1);

  const dotScales = [
    dotScale0,
    dotScale1,
    dotScale2,
    dotScale3,
    dotScale4,
    dotScale5,
  ];

  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const dot0Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale0.value }],
  }));
  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }],
  }));
  const dot4Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale4.value }],
  }));
  const dot5Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale5.value }],
  }));

  const dotAnimatedStyles = [
    dot0Style,
    dot1Style,
    dot2Style,
    dot3Style,
    dot4Style,
    dot5Style,
  ];

  // Trigger shake animation when error changes
  useEffect(() => {
    if (error) {
      // Haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Shake animation
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Clear password after error animation
      setTimeout(() => {
        setPassword("");
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const handleNumberPress = (num: number) => {
    if (disabled || password.length >= length) return;

    // Haptic feedback on button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newPassword = password + num.toString();
    const currentIndex = password.length;

    // Animate the dot that's being filled
    if (currentIndex < length) {
      dotScales[currentIndex].value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    }

    setPassword(newPassword);

    if (newPassword.length === length) {
      onComplete(newPassword);
    }
  };

  const handleBackspace = () => {
    if (disabled || password.length === 0) return;

    // Haptic feedback on backspace
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPassword(password.slice(0, -1));
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < length; i++) {
      const isFilled = i < password.length;

      dots.push(
        <Animated.View
          key={i}
          style={[
            styles.dot,
            isFilled && styles.dotFilled,
            error && styles.dotError,
            { borderColor: colors.icon },
            isFilled && { backgroundColor: colors.tint },
            dotAnimatedStyles[i],
          ]}
        />
      );
    }
    return dots;
  };

  const renderNumberPad = () => {
    const numbers = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [null, 0, "backspace"],
    ];

    return numbers.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.numberRow}>
        {row.map((item, colIndex) => {
          if (item === null) {
            return <View key={colIndex} style={styles.numberButton} />;
          }

          if (item === "backspace") {
            return (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.numberButton,
                  disabled && styles.numberButtonDisabled,
                ]}
                onPress={handleBackspace}
                disabled={disabled}
              >
                <Ionicons
                  name="backspace-outline"
                  size={28}
                  color={disabled ? colors.icon : colors.text}
                />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={colIndex}
              style={[
                styles.numberButton,
                disabled && styles.numberButtonDisabled,
              ]}
              onPress={() => handleNumberPress(item as number)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.numberText,
                  { color: colors.text },
                  disabled && styles.numberTextDisabled,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Password Dots with shake animation */}
      <Animated.View style={[styles.dotsContainer, shakeStyle]}>
        {renderDots()}
      </Animated.View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Number Pad */}
      <View style={styles.numberPad}>{renderNumberPad()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  dotFilled: {
    borderWidth: 0,
  },
  dotError: {
    borderColor: "#FF3B30",
  },
  errorContainer: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  numberPad: {
    gap: 12,
  },
  numberRow: {
    flexDirection: "row",
    gap: 12,
  },
  numberButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  numberButtonDisabled: {
    opacity: 0.5,
  },
  numberText: {
    fontSize: 28,
    fontWeight: "600",
  },
  numberTextDisabled: {
    opacity: 0.5,
  },
});
