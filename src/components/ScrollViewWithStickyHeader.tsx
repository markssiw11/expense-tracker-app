import React, { useRef } from "react";
import { View, StyleSheet, Animated, ScrollViewProps } from "react-native";
import StickyHeader from "./StickyHeader";

interface ScrollViewWithStickyHeaderProps extends ScrollViewProps {
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
  onBackPress?: () => void;
  children: React.ReactNode;
}

export default function ScrollViewWithStickyHeader({
  title,
  subtitle,
  headerContent,
  gradientColors,
  onBackPress,
  children,
  ...scrollViewProps
}: ScrollViewWithStickyHeaderProps) {
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.container}>
      <StickyHeader
        title={title}
        subtitle={subtitle}
        scrollY={scrollY}
        gradientColors={gradientColors}
        onBackPress={onBackPress}
      >
        {headerContent}
      </StickyHeader>

      <Animated.ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
});
