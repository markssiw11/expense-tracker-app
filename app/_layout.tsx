import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import "react-native-reanimated";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { store, useAppDispatch } from "@/src/redux/store";
import AuthenticationProvider from "@/src/components/AuthenticationProvider";
import { loadEvents } from "@/src/redux/reducers/eventSlice";
import { loadExpenses } from "@/src/redux/reducers/expenseSlice";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

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
            </Stack>
            <StatusBar style="auto" />
          </AppInitializer>
        </AuthenticationProvider>
      </ThemeProvider>
    </Provider>
  );
}
