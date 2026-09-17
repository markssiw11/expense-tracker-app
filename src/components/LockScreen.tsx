import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "../hooks/useTranslation";
import {
  clearLockout,
  incrementFailedAttempts,
  resetFailedAttempts,
  setAuthenticated,
  setLockout,
} from "../redux/reducers/authSlice";
import type { RootState } from "../redux/store";
import { authService } from "../services/authService";
import PasswordInput from "./PasswordInput";

interface LockScreenProps {
  onAuthenticated: () => void;
}

export default function LockScreen({ onAuthenticated }: LockScreenProps) {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const { biometricEnabled, biometricAvailable, failedAttempts, lockoutUntil } =
    useSelector((state: RootState) => state.auth);

  const [error, setError] = useState<string>("");
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState<number>(0);
  const [biometricAttempts, setBiometricAttempts] = useState<number>(0);

  // Check if currently locked out
  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  // Trigger biometric authentication on mount if enabled
  useEffect(() => {
    if (biometricEnabled && biometricAvailable && biometricAttempts === 0) {
      handleBiometricAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle lockout countdown timer
  useEffect(() => {
    if (isLockedOut && lockoutUntil) {
      const updateTimer = () => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          // Lockout expired
          dispatch(clearLockout());
          dispatch(resetFailedAttempts());
          setLockoutTimeRemaining(0);
          setError("");
        } else {
          setLockoutTimeRemaining(remaining);
        }
      };

      // Update immediately
      updateTimer();

      // Update every second
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [isLockedOut, lockoutUntil, dispatch]);

  const handlePasswordComplete = async (password: string) => {
    // Clear any previous errors
    setError("");

    try {
      const isValid = await authService.verifyPassword(password);

      if (isValid) {
        // Success - reset failed attempts and authenticate
        dispatch(resetFailedAttempts());
        dispatch(setAuthenticated(true));
        onAuthenticated();
      } else {
        // Failed - increment attempts
        dispatch(incrementFailedAttempts());
        const newFailedAttempts = failedAttempts + 1;

        // Check if should trigger lockout
        if (authService.shouldLockout(newFailedAttempts)) {
          const lockoutDuration =
            authService.getLockoutDuration(newFailedAttempts);
          const lockoutTimestamp = Date.now() + lockoutDuration * 1000;
          dispatch(setLockout(lockoutTimestamp));
          setError(
            `Too many failed attempts. Please wait ${lockoutDuration} seconds.`,
          );
        } else {
          setError(`Incorrect password (${newFailedAttempts}/${5} attempts)`);
        }
      }
    } catch (err) {
      console.error("Password verification error:", err);
      setError("An error occurred. Please try again.");
    }
  };

  const handleBiometricAuth = async () => {
    setBiometricAttempts((prev) => prev + 1);
    setError("");

    try {
      const success = await authService.authenticateWithBiometric();

      if (success) {
        // Success - authenticate
        dispatch(resetFailedAttempts());
        dispatch(setAuthenticated(true));
        onAuthenticated();
      } else {
        // Failed or cancelled
        if (biometricAttempts >= 2) {
          // After 3 attempts (0, 1, 2), show error and switch to password
          setError("Biometric authentication failed. Please use password.");
        } else {
          setError(
            "Biometric authentication failed. Try again or use password.",
          );
        }
      }
    } catch (err) {
      console.error("Biometric authentication error:", err);
      setError("Biometric authentication unavailable. Please use password.");
    }
  };

  const getBiometricIcon = () => {
    if (Platform.OS === "ios") {
      return "finger-print-outline" as const; // Face ID/Touch ID on iOS
    }
    return "finger-print-outline" as const; // Fingerprint on Android
  };

  const getBiometricLabel = () => {
    if (Platform.OS === "ios") {
      return "Use Face ID / Touch ID";
    }
    return "Use Fingerprint";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* App Logo and Title */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appTitle, { color: colors.text }]}>
          {t("app.name")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Enter your password to continue
        </Text>
      </View>

      {/* Lockout Timer */}
      {isLockedOut && (
        <View style={styles.lockoutContainer}>
          <Ionicons name="lock-closed" size={32} color="#FF3B30" />
          <Text style={styles.lockoutText}>Too many failed attempts</Text>
          <Text style={styles.lockoutTimer}>
            Try again in {lockoutTimeRemaining}s
          </Text>
        </View>
      )}

      {/* Password Input */}
      {!isLockedOut && (
        <View style={styles.inputContainer}>
          <PasswordInput
            length={4}
            onComplete={handlePasswordComplete}
            error={error}
            disabled={isLockedOut}
          />
        </View>
      )}

      {/* Biometric Button */}
      {!isLockedOut && biometricEnabled && biometricAvailable && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricAuth}
        >
          <Ionicons
            name={getBiometricIcon()}
            size={24}
            color={colors.tint}
            style={styles.biometricIcon}
          />
          <Text style={[styles.biometricText, { color: colors.tint }]}>
            {getBiometricLabel()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
  },
  lockoutContainer: {
    alignItems: "center",
    marginVertical: 48,
  },
  lockoutText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF3B30",
    marginTop: 16,
    marginBottom: 8,
  },
  lockoutTimer: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF3B30",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  biometricIcon: {
    marginRight: 8,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
