import AsyncStorage from "@react-native-async-storage/async-storage";
import { Income } from "../../types/income.types";

const STORAGE_KEY = "@expense_tracker:incomes";

class IncomeStorageService {
  async saveIncomes(incomes: Income[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(incomes));
    } catch (error) {
      console.error("Error saving incomes:", error);
      throw new Error("Failed to save incomes");
    }
  }

  async loadIncomes(): Promise<Income[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) return [];
      const incomes = JSON.parse(jsonValue);
      if (!Array.isArray(incomes)) {
        console.warn("Invalid incomes data structure, returning empty array");
        return [];
      }
      return incomes;
    } catch (error) {
      console.error("Error loading incomes:", error);
      throw new Error("Failed to load incomes");
    }
  }

  async addIncome(income: Income): Promise<void> {
    const incomes = await this.loadIncomes();
    incomes.push(income);
    await this.saveIncomes(incomes);
  }

  async updateIncome(id: string, data: Partial<Income>): Promise<void> {
    const incomes = await this.loadIncomes();
    const index = incomes.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("Income not found");
    incomes[index] = {
      ...incomes[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await this.saveIncomes(incomes);
  }

  async deleteIncome(id: string): Promise<void> {
    const incomes = await this.loadIncomes();
    const filtered = incomes.filter((e) => e.id !== id);
    if (filtered.length === incomes.length) {
      throw new Error("Income not found");
    }
    await this.saveIncomes(filtered);
  }
}

export default new IncomeStorageService();
