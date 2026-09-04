import { Income, IncomeCategory } from "../../types/income.types";
import { calculateIncomeTotal, filterIncomesByMonth } from "../incomeUtils";

const makeIncome = (amount: number, dateIso: string): Income => ({
  id: Math.random().toString(),
  amount,
  category: IncomeCategory.SALARY,
  date: dateIso,
  createdAt: dateIso,
  updatedAt: dateIso,
});

describe("incomeUtils", () => {
  describe("calculateIncomeTotal", () => {
    it("sums income amounts", () => {
      const incomes = [
        makeIncome(100, "2026-01-01"),
        makeIncome(250, "2026-01-15"),
      ];
      expect(calculateIncomeTotal(incomes)).toBe(350);
    });

    it("returns 0 for an empty list", () => {
      expect(calculateIncomeTotal([])).toBe(0);
    });
  });

  describe("filterIncomesByMonth", () => {
    const incomes = [
      makeIncome(100, new Date(2026, 0, 5).toISOString()), // Jan
      makeIncome(200, new Date(2026, 0, 28).toISOString()), // Jan
      makeIncome(300, new Date(2026, 1, 3).toISOString()), // Feb
    ];

    it("keeps only incomes within the given month", () => {
      const jan = filterIncomesByMonth(incomes, "2026-01");
      expect(jan).toHaveLength(2);
      expect(calculateIncomeTotal(jan)).toBe(300);
    });

    it("returns empty for a month with no incomes", () => {
      expect(filterIncomesByMonth(incomes, "2026-03")).toHaveLength(0);
    });
  });
});
