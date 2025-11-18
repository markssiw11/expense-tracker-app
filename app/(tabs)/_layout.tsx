import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSelector } from "react-redux";
import { selectTodayEvents } from "@/src/redux/reducers/eventSlice";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const todayEvents = useSelector(selectTodayEvents);
  const todayEventsCount = todayEvents.length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Chi Phí",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Lịch",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerShown: false,
          tabBarBadge: todayEventsCount > 0 ? todayEventsCount : undefined,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Ghi Chú",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
