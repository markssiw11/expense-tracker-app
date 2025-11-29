import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SpendingLimitConfig,
  SpendingLimit,
  BudgetPeriodType,
} from "../../types";

const STORAGE_KEY = "@expense_tracker:spending_limits";

class SpendingLimitStorageService {
  /**
   * Save spending limit configuration to AsyncStorage
   */
  async saveConfig(config: SpendingLimitConfig): Promise<void> {
    try {
      const jsonValue = JSON.stringify(config);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error("Error saving spending limit config:", error);
      throw new Error("Failed to save spending limit configuration");
    }
  }

  /**
   * Load spending limit configuration from AsyncStorage
   */
  async loadConfig(): Promise<SpendingLimitConfig> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) {
        return { weekly: null, monthly: null };
      }
      const config = JSON.parse(jsonValue);

      // Validate data structure
      if (typeof config !== "object" || config === null) {
        console.warn(
          "Invalid spending limit config structure, returning default"
        );
        return { weekly: null, monthly: null };
      }

      return config;
    } catch (error) {
      // Handle JSON parse errors and other errors gracefully
      console.warn(
        "Error loading spending limit config, returning default:",
        error
      );
      return { weekly: null, monthly: null };
    }
  }

  /**
   * Update a specific spending limit (weekly or monthly)
   */
  async updateLimit(
    periodType: BudgetPeriodType,
    limit: SpendingLimit
  ): Promise<void> {
    try {
      const config = await this.loadConfig();

      if (periodType === BudgetPeriodType.WEEKLY) {
        config.weekly = limit;
      } else if (periodType === BudgetPeriodType.MONTHLY) {
        config.monthly = limit;
      } else {
        throw new Error("Invalid period type");
      }

      await this.saveConfig(config);
    } catch (error) {
      console.error("Error updating spending limit:", error);
      throw new Error("Failed to update spending limit");
    }
  }

  /**
   * Delete a specific spending limit (weekly or monthly)
   */
  async deleteLimit(periodType: BudgetPeriodType): Promise<void> {
    try {
      const config = await this.loadConfig();

      if (periodType === BudgetPeriodType.WEEKLY) {
        config.weekly = null;
      } else if (periodType === BudgetPeriodType.MONTHLY) {
        config.monthly = null;
      } else {
        throw new Error("Invalid period type");
      }

      await this.saveConfig(config);
    } catch (error) {
      console.error("Error deleting spending limit:", error);
      throw new Error("Failed to delete spending limit");
    }
  }
}

export default new SpendingLimitStorageService();
