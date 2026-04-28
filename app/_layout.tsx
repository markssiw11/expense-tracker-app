import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { Provider } from "react-redux";

import { useColorScheme } from "@/hooks/use-color-scheme";
import AuthenticationProvider from "@/src/components/AuthenticationProvider";
import { loadEvents, updateEvent } from "@/src/redux/reducers/eventSlice";
import { loadExpenses } from "@/src/redux/reducers/expenseSlice";
import { store, useAppDispatch, useAppSelector } from "@/src/redux/store";
import { rescheduleAllNotifications } from "@/src/services/notificationService";

// Initialize i18n
import "@/src/i18n";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const events = useAppSelector((state) => state.events.events);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load events from AsyncStorage
        await dispatch(loadEvents()).unwrap();
      } catch (error) {
        console.error("Failed to load events:", error);
        // Continue app initialization even if loading fails
      }

      try {
        // Load expenses from AsyncStorage
        await dispatch(loadExpenses()).unwrap();
      } catch (error) {
        console.error("Failed to load expenses:", error);
        // Continue app initialization even if loading fails
      }
    };

    initializeApp();
  }, [dispatch]);

  // Reschedule notifications after events are loaded
  // This handles edge cases like app reinstall or timezone changes
  useEffect(() => {
    const rescheduleNotifications = async () => {
      if (events.length === 0) {
        return; // No events to reschedule
      }

      try {
        console.log("Rescheduling notifications for loaded events...");
        const notificationMap = await rescheduleAllNotifications(events);

        // Update events with new notification IDs
        for (const [eventId, notificationId] of notificationMap.entries()) {
          const event = events.find((e) => e.id === eventId);
          if (event && event.notificationId !== notificationId) {
            await dispatch(
              updateEvent({
                id: eventId,
                data: { notificationId },
              }),
            ).unwrap();
          }
        }

        console.log(
          `Successfully rescheduled ${notificationMap.size} notifications`,
        );
      } catch (error) {
        console.error("Failed to reschedule notifications:", error);
        // Don't block app initialization if rescheduling fails
      }
    };

    // Only reschedule if we have events loaded
    if (events.length > 0) {
      rescheduleNotifications();
    }
  }, [events.length]); // Only run when events are first loaded

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthenticationProvider>
          <AppInitializer>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                },
                headerTitleStyle: {
                  fontWeight: "600",
                },
                contentStyle: {
                  backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="expenses/add"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="expenses/edit/[id]"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="expenses/report"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="notes/add"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="notes/edit/[id]"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="notes/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="events/add"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="events/edit/[id]"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="events/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings/family-members"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings/index"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings/authentication"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings/spending-limits"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settings/backup"
                options={{ headerShown: false }}
              />
            </Stack>
            <StatusBar style="auto" />
          </AppInitializer>
        </AuthenticationProvider>
      </ThemeProvider>
    </Provider>
  );
}
