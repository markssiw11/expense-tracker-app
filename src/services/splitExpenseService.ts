import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense, ExpenseCategory } from "../types";
import {
  SplitBalance,
  SplitExpense,
  SplitParticipant,
  SplitTrip,
} from "../types/splitExpense.types";

const STORAGE_KEY = "@expense_tracker:split_trips";

export function createEqualShares(
  amount: number,
  participantIds: string[],
): { participantId: string; amount: number }[] {
  if (participantIds.length === 0) return [];
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / participantIds.length);
  const remainder = totalCents - baseCents * participantIds.length;

  return participantIds.map((participantId, index) => ({
    participantId,
    amount: (baseCents + (index < remainder ? 1 : 0)) / 100,
  }));
}

export function calculateSplitBalances(
  participants: SplitParticipant[],
  expenses: SplitExpense[],
): SplitBalance[] {
  const balances = new Map(
    participants.map((participant) => [
      participant.id,
      { participantId: participant.id, paid: 0, share: 0 },
    ]),
  );

  for (const expense of expenses) {
    const payer = balances.get(expense.paidById);
    if (payer) payer.paid += expense.amount;

    for (const share of expense.shares) {
      const participant = balances.get(share.participantId);
      if (participant) participant.share += share.amount;
    }
  }

  return Array.from(balances.values()).map((balance) => ({
    ...balance,
    balance: Math.round((balance.paid - balance.share) * 100) / 100,
  }));
}

export function buildPersonalSplitExpenses(trips: SplitTrip[]): Expense[] {
  return trips.flatMap((trip) => {
    if (!trip.includeInPersonalExpenses || !trip.personalParticipantId) {
      return [];
    }

    const participant = trip.participants.find(
      (item) => item.id === trip.personalParticipantId,
    );
    if (!participant) return [];

    return trip.expenses.flatMap((expense) => {
      const share = expense.shares.find(
        (item) => item.participantId === participant.id,
      );
      if (!share || share.amount <= 0) return [];

      const timestamp = `${expense.date}T12:00:00.000Z`;
      return [
        {
          id: `split:${trip.id}:${expense.id}`,
          amount: share.amount,
          category: ExpenseCategory.OTHER,
          date: timestamp,
          note: `${trip.name}: ${expense.title}`,
          splitExpenseSource: { tripId: trip.id, expenseId: expense.id },
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    });
  });
}

export async function loadSplitTrips(): Promise<SplitTrip[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const trips: unknown = JSON.parse(stored);
  return Array.isArray(trips) ? (trips as SplitTrip[]) : [];
}

export async function saveSplitTrips(trips: SplitTrip[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}
