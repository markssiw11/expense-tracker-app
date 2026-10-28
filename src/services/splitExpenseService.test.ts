import { ExpenseCategory } from "../types";
import {
  buildPersonalSplitExpenses,
  calculateSplitBalances,
  createEqualShares,
} from "./splitExpenseService";

describe("split expense calculations", () => {
  it("creates personal expenses from the selected participant's shares", () => {
    const expenses = buildPersonalSplitExpenses([
      {
        id: "trip-1",
        name: "Weekend trip",
        participants: [
          { id: "a", name: "Alex" },
          { id: "b", name: "Blair" },
        ],
        expenses: [
          {
            id: "meal-1",
            title: "Dinner",
            amount: 40,
            paidById: "b",
            shares: [
              { participantId: "a", amount: 15 },
              { participantId: "b", amount: 25 },
            ],
            date: "2026-10-19",
          },
        ],
        includeInPersonalExpenses: true,
        personalParticipantId: "a",
        createdAt: "2026-10-19T12:00:00.000Z",
      },
    ]);

    expect(expenses).toEqual([
      {
        id: "split:trip-1:meal-1",
        amount: 15,
        category: ExpenseCategory.OTHER,
        date: "2026-10-19T12:00:00.000Z",
        note: "Weekend trip: Dinner",
        splitExpenseSource: { tripId: "trip-1", expenseId: "meal-1" },
        createdAt: "2026-10-19T12:00:00.000Z",
        updatedAt: "2026-10-19T12:00:00.000Z",
      },
    ]);
  });

  it("distributes rounding cents without losing value", () => {
    expect(createEqualShares(10, ["a", "b", "c"])).toEqual([
      { participantId: "a", amount: 3.34 },
      { participantId: "b", amount: 3.33 },
      { participantId: "c", amount: 3.33 },
    ]);
  });

  it("calculates how much each participant should receive or pay", () => {
    const balances = calculateSplitBalances(
      [
        { id: "a", name: "Alex" },
        { id: "b", name: "Blair" },
      ],
      [
        {
          id: "meal",
          title: "Dinner",
          amount: 10,
          paidById: "a",
          shares: [
            { participantId: "a", amount: 5 },
            { participantId: "b", amount: 5 },
          ],
          date: "2026-10-19",
        },
      ],
    );

    expect(balances).toEqual([
      { participantId: "a", paid: 10, share: 5, balance: 5 },
      { participantId: "b", paid: 0, share: 5, balance: -5 },
    ]);
  });
});
