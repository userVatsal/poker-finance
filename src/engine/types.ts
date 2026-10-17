import type { Card } from './cards';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

/**
 * `raise` covers both an opening bet and a raise. `amount` is the TOTAL the
 * player will have put in on this street ("raise to"), not the increment.
 */
export type ActionType = 'fold' | 'check' | 'call' | 'raise';

export interface PlayerAction {
  type: ActionType;
  amount?: number;
}

/** What a seat brings into a hand. Amounts are integers in the currency's minor units. */
export interface SeatInput {
  id: string;
  name: string;
  stack: number;
  isHuman: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  isHuman: boolean;
  stack: number;
  /** Chips put in on the current street. */
  streetBet: number;
  /** Chips put in across the whole hand. */
  totalBet: number;
  hole: Card[];
  folded: boolean;
  allIn: boolean;
  /** Has acted since the last full raise. Players who have acted can't re-raise a short all-in. */
  hasActed: boolean;
  lastAction: { type: ActionType | 'post'; amount: number } | null;
}

export type HandEvent =
  | { kind: 'post'; player: number; amount: number; blind: 'small' | 'big' }
  | {
      kind: 'action';
      player: number;
      street: Street;
      type: ActionType;
      amount: number;
      allIn: boolean;
    }
  | { kind: 'deal'; street: Street; cards: Card[] }
  | { kind: 'win'; player: number; amount: number; hand: string | null; potIndex: number };

export interface Pot {
  amount: number;
  /** Player indexes who can win this pot. */
  eligible: number[];
  winners: number[];
}

export interface HandResult {
  pots: Pot[];
  /** Chips each player receives (indexed like `players`). */
  winnings: number[];
  /** Hand score per player at showdown, null if folded or no showdown. */
  scores: (number | null)[];
  /** Plain-English hand names at showdown. */
  handNames: (string | null)[];
  wentToShowdown: boolean;
}

export interface HandState {
  handNumber: number;
  smallBlind: number;
  bigBlind: number;
  dealerIndex: number;
  sbIndex: number;
  bbIndex: number;
  players: PlayerState[];
  deck: Card[];
  board: Card[];
  street: Street;
  /** Index of the player to act, or -1 when nobody can act. */
  toAct: number;
  /** Highest street bet that must be matched. */
  currentBet: number;
  /** Size of the last full raise; the next raise must be at least this much more. */
  minRaise: number;
  lastAggressor: number;
  isComplete: boolean;
  result: HandResult | null;
  log: HandEvent[];
}

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  /** Smallest legal "raise to" total (may equal maxRaiseTo when only an all-in is possible). */
  minRaiseTo: number;
  /** Largest legal "raise to" total (all-in). */
  maxRaiseTo: number;
}
