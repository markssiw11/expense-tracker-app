import {
  formatCurrency,
  formatCurrencyIntl,
  formatDate,
  formatDateWithDay,
  formatDateObject,
  formatDateWithMonthName,
  formatMonthYear,
  getWeekStartDay,
} from "../formatUtils";

describe("formatUtils", () => {
  describe("formatCurrency", () => {
    it("should format currency with Vietnamese locale and ₫ symbol", () => {
      expect(formatCurrency(1000000)).toBe("1.000.000₫");
      expect(formatCurrency(500)).toBe("500₫");
      expect(formatCurrency(0)).toBe("0₫");
    });

    it("should handle decimal amounts", () => {
      expect(formatCurrency(1234.56)).toBe("1.234,56₫");
    });
  });

  describe("formatCurrencyIntl", () => {
    it("should format currency using Intl.NumberFormat", () => {
      const result = formatCurrencyIntl(1000000);
      expect(result).toContain("1.000.000");
      expect(result).toContain("₫");
    });
  });

  describe("formatDate", () => {
    it("should format ISO date string to dd/MM/yyyy", () => {
      expect(formatDate("2024-01-15")).toBe("15/01/2024");
      expect(formatDate("2024-12-31")).toBe("31/12/2024");
    });

    it("should handle custom format strings", () => {
      expect(formatDate("2024-01-15", "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it("should return original string on error", () => {
      expect(formatDate("invalid-date")).toBe("invalid-date");
    });
  });

  describe("formatDateObject", () => {
    it("should format Date object to dd/MM/yyyy", () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDateObject(date)).toBe("15/01/2024");
    });
  });

  describe("formatDateWithDay", () => {
    it("should format date with Vietnamese day name", () => {
      const result = formatDateWithDay("2024-01-15");
      expect(result).toContain("15/01/2024");
      // Day name will be in Vietnamese
    });
  });

  describe("formatDateWithMonthName", () => {
    it("should format date with Vietnamese month name", () => {
      const result = formatDateWithMonthName("2024-01-15");
      expect(result).toContain("15");
      expect(result).toContain("2024");
      // Month name will be in Vietnamese
    });
  });

  describe("formatMonthYear", () => {
    it("should format YYYY-MM to Vietnamese month year", () => {
      const result = formatMonthYear("2024-01");
      expect(result).toContain("2024");
      // Month name will be in Vietnamese
    });

    it("should handle ISO date strings", () => {
      const result = formatMonthYear("2024-01-15");
      expect(result).toContain("2024");
    });
  });

  describe("getWeekStartDay", () => {
    it("should return 1 for Monday (Vietnamese locale)", () => {
      expect(getWeekStartDay()).toBe(1);
    });
  });
});
