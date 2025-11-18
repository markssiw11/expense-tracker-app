import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense } from "../../types";

const STORAGE_KEY = "@expense_tracker:expenses";

class ExpenseStorageService {
  /**
   * Save expenses array to AsyncStorage
   */
  async saveExpenses(expenses: Expense[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(expenses);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error("Error saving expenses:", error);
      throw new Error("Failed to save expenses");
    }
  }

  /**
   * Load expenses from AsyncStorage
   */
  async loadExpenses(): Promise<Expense[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) {
        return [];
      }
      const expenses = JSON.parse(jsonValue);

      // Validate data structure
      if (!Array.isArray(expenses)) {
        console.warn("Invalid expenses data structure, returning empty array");
        return [];
      }

      return expenses;
    } catch (error) {
      console.error("Error loading expenses:", error);
      throw new Error("Failed to load expenses");
    }
  }

  /**
   * Add a single expense
   */
  async addExpense(expense: Expense): Promise<void> {
    try {
      const expenses = await this.loadExpenses();
      expenses.push(expense);
      await this.saveExpenses(expenses);
    } catch (error) {
      console.error("Error adding expense:", error);
      throw new Error("Failed to add expense");
    }
  }

  /**
   * Update an existing expense
   */
  async updateExpense(
    id: string,
    updatedExpense: Partial<Expense>
  ): Promise<void> {
    try {
      const expenses = await this.loadExpenses();
      const index = expenses.findIndex((e) => e.id === id);

      if (index === -1) {
        throw new Error("Expense not found");
      }

      expenses[index] = {
        ...expenses[index],
        ...updatedExpense,
        id, // Ensure id doesn't change
        updatedAt: new Date().toISOString(),
      };

      await this.saveExpenses(expenses);
    } catch (error) {
      console.error("Error updating expense:", error);
      throw new Error("Failed to update expense");
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<void> {
    try {
      const expenses = await this.loadExpenses();
      const filteredExpenses = expenses.filter((e) => e.id !== id);

      if (filteredExpenses.length === expenses.length) {
        throw new Error("Expense not found");
      }

      await this.saveExpenses(filteredExpenses);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw new Error("Failed to delete expense");
    }
  }
}

export default new ExpenseStorageService();
