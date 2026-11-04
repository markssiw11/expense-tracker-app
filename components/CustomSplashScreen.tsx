import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export default function CustomSplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={styles.brandMark}
          resizeMode="contain"
        />
        <Text style={styles.title}>FamFinance</Text>
        <Text style={styles.subtitle}>Family Budget</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBFCFA",
  },
  content: {
    alignItems: "center",
  },
  brandMark: { width: 176, height: 176, marginBottom: 18 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1D2923",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6E7972",
  },
});
