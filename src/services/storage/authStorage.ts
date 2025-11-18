// Auth Storage Service
// Manages secure storage of authentication data
import * as SecureStore from "expo-secure-store";

const STORAGE_KEYS = {
  PASSWORD_HASH: "app_password_hash",
  AUTH_ENABLED: "app_auth_enabled",
  BIOMETRIC_ENABLED: "app_biometric_enabled",
};

export interface AuthStorage {
  savePasswordHash(hash: string): Promise<void>;
  getPasswordHash(): Promise<string | null>;
  removePasswordHash(): Promise<void>;
  saveAuthEnabled(enabled: boolean): Promise<void>;
  getAuthEnabled(): Promise<boolean>;
  saveBiometricEnabled(enabled: boolean): Promise<void>;
  getBiometricEnabled(): Promise<boolean>;
}

// Implementation
export const authStorage: AuthStorage = {
  // Password Hash Management
  savePasswordHash: async (hash: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_HASH, hash);
    } catch (error) {
      console.error("Failed to save password hash:", error);
      throw new Error("Failed to save password. Please try again.");
    }
  },

  getPasswordHash: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD_HASH);
    } catch (error) {
      console.error("Failed to get password hash:", error);
      return null;
    }
  },

  removePasswordHash: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD_HASH);
    } catch (error) {
      console.error("Failed to remove password hash:", error);
      throw new Error("Failed to remove password. Please try again.");
    }
  },

  // Auth Enabled Setting
  saveAuthEnabled: async (enabled: boolean): Promise<void> => {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.AUTH_ENABLED,
        enabled.toString()
      );
    } catch (error) {
      console.error("Failed to save auth enabled setting:", error);
      throw new Error(
        "Failed to save authentication setting. Please try again."
      );
    }
  },

  getAuthEnabled: async (): Promise<boolean> => {
    try {
      const value = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_ENABLED);
      return value === "true";
    } catch (error) {
      console.error("Failed to get auth enabled setting:", error);
      return false;
    }
  },

  // Biometric Enabled Setting
  saveBiometricEnabled: async (enabled: boolean): Promise<void> => {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        enabled.toString()
      );
    } catch (error) {
      console.error("Failed to save biometric enabled setting:", error);
      throw new Error("Failed to save biometric setting. Please try again.");
    }
  },

  getBiometricEnabled: async (): Promise<boolean> => {
    try {
      const value = await SecureStore.getItemAsync(
        STORAGE_KEYS.BIOMETRIC_ENABLED
      );
      return value === "true";
    } catch (error) {
      console.error("Failed to get biometric enabled setting:", error);
      return false;
    }
  },
};
