import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GoBackButton from "./GoBackButton";

interface StickyHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: Animated.Value;
  children?: React.ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
  onBackPress?: () => void;
}

export default function StickyHeader({
  title,
  subtitle,
  scrollY,
  children,
  gradientColors = ["#667eea", "#764ba2"],
  onBackPress,
}: StickyHeaderProps) {
  const insets = useSafeAreaInsets();

  // Animated values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [subtitle || children ? 200 : 140, 80],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [50, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const contentOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View style={{ height: headerHeight }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Compact Header (visible when scrolled) */}
        <Animated.View
          style={[styles.compactHeader, { opacity: compactTitleOpacity }]}
        >
          <GoBackButton onPress={onBackPress} />
          <Text style={styles.compactTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Expanded Header (visible when at top) */}
        <Animated.View
          style={[styles.expandedHeader, { opacity: titleOpacity }]}
        >
          <View style={styles.headerRow}>
            <GoBackButton onPress={onBackPress} />
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {children && (
            <Animated.View style={{ opacity: contentOpacity }}>
              {children}
            </Animated.View>
          )}
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    height: 80,
  },
  compactTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  expandedHeader: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },
});
