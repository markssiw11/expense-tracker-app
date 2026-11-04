import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addCustomExpenseCategory,
  CUSTOM_EXPENSE_CATEGORIES_KEY,
  loadCustomExpenseCategories,
} from "../expenseCategoryStorage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedAsyncStorage = jest.mocked(AsyncStorage);

beforeEach(() => {
  jest.clearAllMocks();
  mockedAsyncStorage.getItem.mockResolvedValue(null);
  mockedAsyncStorage.setItem.mockResolvedValue(undefined);
});

describe("custom expense category storage", () => {
  it("loads valid categories saved on device", async () => {
    const categories = [
      { id: "custom-home", name: "Home", icon: "home", color: "#123456" },
    ];
    mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(categories));

    await expect(loadCustomExpenseCategories()).resolves.toEqual(categories);
  });

  it("stores a new custom category locally", async () => {
    const category = await addCustomExpenseCategory(
      "  Pets  ",
      "pricetag",
      "#2A8C75",
    );

    expect(category.name).toBe("Pets");
    expect(category.id).toMatch(/^custom-/);
    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      CUSTOM_EXPENSE_CATEGORIES_KEY,
      JSON.stringify([category]),
    );
  });

  it("rejects duplicate category names without overwriting stored data", async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(
      JSON.stringify([
        { id: "custom-pets", name: "Pets", icon: "paw", color: "#123456" },
      ]),
    );

    await expect(
      addCustomExpenseCategory("pets", "pricetag", "#2A8C75"),
    ).rejects.toThrow("Category already exists");
    expect(mockedAsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
