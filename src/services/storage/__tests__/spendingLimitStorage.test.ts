/**
 * Property-Based Tests for Spending Limit Storage Service
 *
 * **Feature: spending-limits, Property 2: Configuration persistence round-trip**
 *
 * These tests verify that spending limit configurations can be saved and loaded
 * correctly using property-based testing with fast-check.
 */

import * as fc from "fast-check";
import AsyncStorage from "@react-native-async-storage/async-storage";
import spendingLimitStorage from "../spendingLimitStorage";
import {
  SpendingLimitConfig,
  SpendingLimit,
  BudgetPeriodType,
} from "../../../types";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe("SpendingLimitStorage - Property-Based Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Arbitrary generator for SpendingLimit
   */
  const spendingLimitArbitrary = (
    periodType: BudgetPeriodType
  ): fc.Arbitrary<SpendingLimit> => {
    return fc.record({
      id: fc.uuid(),
      periodType: fc.constant(periodType),
      amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
      enabled: fc.boolean(),
      createdAt: fc
        .integer({ min: 1577836800000, max: 1924905600000 })
        .map((ts) => new Date(ts).toISOString()),
      updatedAt: fc
        .integer({ min: 1577836800000, max: 1924905600000 })
        .map((ts) => new Date(ts).toISOString()),
    });
  };

  /**
   * Arbitrary generator for SpendingLimitConfig
   */
  const spendingLimitConfigArbitrary: fc.Arbitrary<SpendingLimitConfig> =
    fc.record({
      weekly: fc.option(spendingLimitArbitrary(BudgetPeriodType.WEEKLY), {
        nil: null,
      }),
      monthly: fc.option(spendingLimitArbitrary(BudgetPeriodType.MONTHLY), {
        nil: null,
      }),
    });

  /**
   * **Feature: spending-limits, Property 2: Configuration persistence round-trip**
   * **Validates: Requirements 1.3, 5.4**
   *
   * For any valid spending limit configuration (including weekly limit, monthly limit,
   * and their enabled states), saving the configuration to storage and then loading
   * it back should produce an equivalent configuration.
   */
  test("Property 2: Configuration persistence round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(spendingLimitConfigArbitrary, async (config) => {
        // Mock AsyncStorage to simulate actual storage behavior
        let storedValue: string | null = null;

        (AsyncStorage.setItem as jest.Mock).mockImplementation(
          async (key: string, value: string) => {
            storedValue = value;
          }
        );

        (AsyncStorage.getItem as jest.Mock).mockImplementation(
          async (key: string) => {
            return storedValue;
          }
        );

        // Save the configuration
        await spendingLimitStorage.saveConfig(config);

        // Load the configuration back
        const loadedConfig = await spendingLimitStorage.loadConfig();

        // Verify round-trip: loaded config should equal original config
        expect(loadedConfig).toEqual(config);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Test that loading from empty storage returns default config
   */
  test("Loading from empty storage returns default config", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const config = await spendingLimitStorage.loadConfig();

    expect(config).toEqual({ weekly: null, monthly: null });
  });

  /**
   * Test that invalid stored data returns default config
   */
  test("Loading invalid data returns default config", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid json");

    const config = await spendingLimitStorage.loadConfig();

    expect(config).toEqual({ weekly: null, monthly: null });
  });

  /**
   * Test updateLimit for weekly period
   */
  test("updateLimit correctly updates weekly limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        spendingLimitArbitrary(BudgetPeriodType.MONTHLY),
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        async (initialWeekly, initialMonthly, newWeekly) => {
          let storedValue: string | null = null;

          (AsyncStorage.setItem as jest.Mock).mockImplementation(
            async (key: string, value: string) => {
              storedValue = value;
            }
          );

          (AsyncStorage.getItem as jest.Mock).mockImplementation(
            async (key: string) => {
              return storedValue;
            }
          );

          // Set initial config
          const initialConfig: SpendingLimitConfig = {
            weekly: initialWeekly,
            monthly: initialMonthly,
          };
          await spendingLimitStorage.saveConfig(initialConfig);

          // Update weekly limit
          await spendingLimitStorage.updateLimit(
            BudgetPeriodType.WEEKLY,
            newWeekly
          );

          // Load and verify
          const loadedConfig = await spendingLimitStorage.loadConfig();
          expect(loadedConfig.weekly).toEqual(newWeekly);
          expect(loadedConfig.monthly).toEqual(initialMonthly);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test updateLimit for monthly period
   */
  test("updateLimit correctly updates monthly limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        spendingLimitArbitrary(BudgetPeriodType.MONTHLY),
        spendingLimitArbitrary(BudgetPeriodType.MONTHLY),
        async (initialWeekly, initialMonthly, newMonthly) => {
          let storedValue: string | null = null;

          (AsyncStorage.setItem as jest.Mock).mockImplementation(
            async (key: string, value: string) => {
              storedValue = value;
            }
          );

          (AsyncStorage.getItem as jest.Mock).mockImplementation(
            async (key: string) => {
              return storedValue;
            }
          );

          // Set initial config
          const initialConfig: SpendingLimitConfig = {
            weekly: initialWeekly,
            monthly: initialMonthly,
          };
          await spendingLimitStorage.saveConfig(initialConfig);

          // Update monthly limit
          await spendingLimitStorage.updateLimit(
            BudgetPeriodType.MONTHLY,
            newMonthly
          );

          // Load and verify
          const loadedConfig = await spendingLimitStorage.loadConfig();
          expect(loadedConfig.weekly).toEqual(initialWeekly);
          expect(loadedConfig.monthly).toEqual(newMonthly);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test deleteLimit for weekly period
   */
  test("deleteLimit correctly removes weekly limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        spendingLimitArbitrary(BudgetPeriodType.MONTHLY),
        async (initialWeekly, initialMonthly) => {
          let storedValue: string | null = null;

          (AsyncStorage.setItem as jest.Mock).mockImplementation(
            async (key: string, value: string) => {
              storedValue = value;
            }
          );

          (AsyncStorage.getItem as jest.Mock).mockImplementation(
            async (key: string) => {
              return storedValue;
            }
          );

          // Set initial config
          const initialConfig: SpendingLimitConfig = {
            weekly: initialWeekly,
            monthly: initialMonthly,
          };
          await spendingLimitStorage.saveConfig(initialConfig);

          // Delete weekly limit
          await spendingLimitStorage.deleteLimit(BudgetPeriodType.WEEKLY);

          // Load and verify
          const loadedConfig = await spendingLimitStorage.loadConfig();
          expect(loadedConfig.weekly).toBeNull();
          expect(loadedConfig.monthly).toEqual(initialMonthly);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test deleteLimit for monthly period
   */
  test("deleteLimit correctly removes monthly limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        spendingLimitArbitrary(BudgetPeriodType.WEEKLY),
        spendingLimitArbitrary(BudgetPeriodType.MONTHLY),
        async (initialWeekly, initialMonthly) => {
          let storedValue: string | null = null;

          (AsyncStorage.setItem as jest.Mock).mockImplementation(
            async (key: string, value: string) => {
              storedValue = value;
            }
          );

          (AsyncStorage.getItem as jest.Mock).mockImplementation(
            async (key: string) => {
              return storedValue;
            }
          );

          // Set initial config
          const initialConfig: SpendingLimitConfig = {
            weekly: initialWeekly,
            monthly: initialMonthly,
          };
          await spendingLimitStorage.saveConfig(initialConfig);

          // Delete monthly limit
          await spendingLimitStorage.deleteLimit(BudgetPeriodType.MONTHLY);

          // Load and verify
          const loadedConfig = await spendingLimitStorage.loadConfig();
          expect(loadedConfig.weekly).toEqual(initialWeekly);
          expect(loadedConfig.monthly).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
