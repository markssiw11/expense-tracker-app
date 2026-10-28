export interface SplitParticipant {
  id: string;
  name: string;
}

export interface SplitShare {
  participantId: string;
  amount: number;
}

export interface SplitExpense {
  id: string;
  title: string;
  amount: number;
  paidById: string;
  shares: SplitShare[];
  date: string;
}

export interface SplitTrip {
  id: string;
  name: string;
  participants: SplitParticipant[];
  expenses: SplitExpense[];
  includeInPersonalExpenses?: boolean;
  personalParticipantId?: string;
  createdAt: string;
}

export interface SplitBalance {
  participantId: string;
  paid: number;
  share: number;
  balance: number;
}
