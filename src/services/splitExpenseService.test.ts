import {
  calculateSplitBalances,
  createEqualShares,
} from "./splitExpenseService";

describe("split expense calculations", () => {
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
