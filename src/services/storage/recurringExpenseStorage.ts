import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecurringExpense } from "../../types/recurringExpense.types";

const STORAGE_KEY = "@recurring_expenses";

class RecurringExpenseStorageService {
  async saveRules(rules: RecurringExpense[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error("Error saving recurring expenses:", error);
      throw new Error("Failed to save recurring expenses");
    }
  }

  async loadRules(): Promise<RecurringExpense[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) return [];
      const rules = JSON.parse(jsonValue);
      if (!Array.isArray(rules)) {
        console.warn(
          "Invalid recurring expenses data structure, returning empty array"
        );
        return [];
      }
      return rules;
    } catch (error) {
      console.error("Error loading recurring expenses:", error);
      throw new Error("Failed to load recurring expenses");
    }
  }

  async addRule(rule: RecurringExpense): Promise<void> {
    const rules = await this.loadRules();
    rules.push(rule);
    await this.saveRules(rules);
  }

  async updateRule(
    id: string,
    data: Partial<RecurringExpense>
  ): Promise<void> {
    const rules = await this.loadRules();
    const index = rules.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Recurring expense not found");
    rules[index] = {
      ...rules[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await this.saveRules(rules);
  }

  async deleteRule(id: string): Promise<void> {
    const rules = await this.loadRules();
    const filtered = rules.filter((r) => r.id !== id);
    await this.saveRules(filtered);
  }
}

export default new RecurringExpenseStorageService();
