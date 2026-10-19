import AsyncStorage from "@react-native-async-storage/async-storage";
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

export async function loadSplitTrips(): Promise<SplitTrip[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const trips: unknown = JSON.parse(stored);
  return Array.isArray(trips) ? (trips as SplitTrip[]) : [];
}

export async function saveSplitTrips(trips: SplitTrip[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}
