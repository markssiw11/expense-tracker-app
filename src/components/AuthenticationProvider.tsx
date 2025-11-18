import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import LockScreen from "./LockScreen";
import { authService } from "../services/authService";
import {
  setAuthenticated,
  setAuthEnabled,
  setBiometricEnabled,
  setBiometricAvailable,
} from "../redux/reducers/authSlice";
import type { RootState } from "../redux/store";

interface AuthenticationProviderProps {
  children: React.ReactNode;
}

export default function AuthenticationProvider({
  children,
}: AuthenticationProviderProps) {
  const dispatch = useDispatch();
  const { isAuthenticated, isEnabled } = useSelector(
    (state: RootState) => state.auth
  );

  const [isInitialized, setIsInitialized] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTimestamp = useRef<number | null>(null);

  // Initialize authentication settings on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load auth enabled status from storage
        const authEnabled = await authService.isAuthEnabled();
        dispatch(setAuthEnabled(authEnabled));

        // Load biometric enabled status from storage
        const biometricEnabled = await authService.isBiometricEnabled();
        dispatch(setBiometricEnabled(biometricEnabled));

        // Check biometric availability
        const biometricAvailable =
          await authService.checkBiometricAvailability();
        dispatch(setBiometricAvailable(biometricAvailable));

        // If auth is enabled, user needs to authenticate
        if (authEnabled) {
          dispatch(setAuthenticated(false));
        } else {
          // If auth is not enabled, user is automatically authenticated
          dispatch(setAuthenticated(true));
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize authentication:", error);
        // On error, assume auth is not enabled
        dispatch(setAuthEnabled(false));
        dispatch(setAuthenticated(true));
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Monitor app state changes for background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // App is going to background
    if (
      appState.current.match(/active|foreground/) &&
      nextAppState === "background"
    ) {
      // Record timestamp when app goes to background
      backgroundTimestamp.current = Date.now();
    }

    // App is coming back to foreground
    if (
      appState.current === "background" &&
      nextAppState.match(/active|foreground/)
    ) {
      // Calculate inactive duration
      if (backgroundTimestamp.current !== null && isEnabled) {
        const inactiveDuration = Date.now() - backgroundTimestamp.current;
        const inactiveSeconds = inactiveDuration / 1000;

        // If inactive for more than 30 seconds, require re-authentication
        if (inactiveSeconds > 30) {
          dispatch(setAuthenticated(false));
        }
      }

      // Clear background timestamp
      backgroundTimestamp.current = null;
    }

    appState.current = nextAppState;
  };

  const handleAuthenticated = () => {
    dispatch(setAuthenticated(true));
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return null; // Or a loading spinner if desired
  }

  // Show lock screen if auth is enabled and user is not authenticated
  if (isEnabled && !isAuthenticated) {
    return <LockScreen onAuthenticated={handleAuthenticated} />;
  }

  // Show app content if authenticated or auth is disabled
  return <>{children}</>;
}
