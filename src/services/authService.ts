// Authentication Service
// Handles authentication logic including password management and biometric authentication
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import { authStorage } from "./storage/authStorage";

// Constants for lockout management
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 30;

export interface AuthService {
  setupPassword(password: string): Promise<void>;
  verifyPassword(password: string): Promise<boolean>;
  changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<boolean>;
  removePassword(): Promise<void>;
  checkBiometricAvailability(): Promise<boolean>;
  authenticateWithBiometric(): Promise<boolean>;
  isAuthEnabled(): Promise<boolean>;
  isBiometricEnabled(): Promise<boolean>;
  shouldLockout(failedAttempts: number): boolean;
  getLockoutDuration(failedAttempts: number): number;
}

// Helper function to hash password using SHA-256
const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
};

// Implementation
export const authService: AuthService = {
  // Password Management
  setupPassword: async (password: string): Promise<void> => {
    try {
      const hash = await hashPassword(password);
      await authStorage.savePasswordHash(hash);
      await authStorage.saveAuthEnabled(true);
    } catch (error) {
      console.error("Failed to setup password:", error);
      throw new Error("Failed to setup password. Please try again.");
    }
  },

  verifyPassword: async (password: string): Promise<boolean> => {
    try {
      const storedHash = await authStorage.getPasswordHash();
      if (!storedHash) {
        return false;
      }
      const inputHash = await hashPassword(password);
      return inputHash === storedHash;
    } catch (error) {
      console.error("Failed to verify password:", error);
      return false;
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      // Verify current password first
      const isCurrentValid = await authService.verifyPassword(currentPassword);
      if (!isCurrentValid) {
        return false;
      }

      // Hash and save new password
      const newHash = await hashPassword(newPassword);
      await authStorage.savePasswordHash(newHash);
      return true;
    } catch (error) {
      console.error("Failed to change password:", error);
      throw new Error("Failed to change password. Please try again.");
    }
  },

  removePassword: async (): Promise<void> => {
    try {
      await authStorage.removePasswordHash();
      await authStorage.saveAuthEnabled(false);
      await authStorage.saveBiometricEnabled(false);
    } catch (error) {
      console.error("Failed to remove password:", error);
      throw new Error("Failed to remove password. Please try again.");
    }
  },

  // Biometric Authentication
  checkBiometricAvailability: async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error("Failed to check biometric availability:", error);
      return false;
    }
  },

  authenticateWithBiometric: async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access Expense Tracker",
        fallbackLabel: "Use Password",
        cancelLabel: "Cancel",
      });
      return result.success;
    } catch (error) {
      console.error("Biometric authentication failed:", error);
      return false;
    }
  },

  // Settings Check
  isAuthEnabled: async (): Promise<boolean> => {
    return await authStorage.getAuthEnabled();
  },

  isBiometricEnabled: async (): Promise<boolean> => {
    return await authStorage.getBiometricEnabled();
  },

  // Lockout Management
  shouldLockout: (failedAttempts: number): boolean => {
    return failedAttempts >= MAX_FAILED_ATTEMPTS;
  },

  getLockoutDuration: (failedAttempts: number): number => {
    return LOCKOUT_DURATION_SECONDS;
  },
};
