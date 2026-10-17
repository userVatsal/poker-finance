import { ARCHETYPES, type ArchetypeId } from '../bots/archetypes';
import { decide, type BotDecision, type BotMemory } from '../bots/botBrain';
import { deskNoteFor } from '../bots/deskNotes';
import { displayName, FIRMS, firmProfile, getFirm } from '../bots/firms';
import { emptyModel, type OpponentModel } from '../bots/opponentModel';
import { getCurrency, stakes, type Currency } from '../currency/currencies';
import { applyAction, legalActions, startHand } from '../engine/hand';
import { createRng, randomSeed, shuffle, type Rng } from '../engine/rng';
import type { HandState, PlayerAction } from '../engine/types';

/**
 * A playing session: you plus up to five firm bots at one table.
 *
 * Owns everything that lasts longer than a single hand: stacks, the dealer
 * button, bot memory, what the bots have learned about you, desk notes and
 * your report-card stats. React only renders it (see src/ui/useSession.ts).
 */

export const HUMAN_ID = 'you';

export interface Seat {
  id: string;
  firmId: string | null;
  name: string;
  archetype: ArchetypeId | null;
  stack: number;
  isHuman: boolean;
  memory: BotMemory;
}

export interface Note {
  id: number;
  handNumber: number;
  seatId: string;
  firmName: string;
  archetype: ArchetypeId;
  concept: string;
  text: string;
  /** True if shown live; false if held back until the hand ended (so it could not leak a bot's hand). */
  live: boolean;
}

export interface TableEvent {
  id: number;
  handNumber: number;
  kind: 'liquidated' | 'joined';
  name: string;
  byYou?: boolean;
}

export interface SessionStats {
  startStack: number;
  peakStack: number;
  handsPlayed: number;
  handsWon: number;
  showdownsWon: number;
  biggestPotWon: number;
  bestHandScore: number;
  bestHandName: string | null;
  firmsLiquidatedByYou: string[];
}

export interface SessionOptions {
  currency?: string;
  /** Specific firms to sit down; filled up randomly to `opponents`. */
  firmIds?: string[];
  opponents?: number;
  seed?: number;
  useRealNames?: boolean;
  playerName?: string;
}

export class Session {
  readonly currency: Currency;
  readonly seed: number;
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly startingStack: number;
  readonly useRealNames: boolean;

  seats: Seat[] = [];
  hand: HandState | null = null;
  notes: Note[] = [];
  events: TableEvent[] = [];
  opponent: OpponentModel = emptyModel();
  stats: SessionStats;
  /** Reason behind each bot's most recent action this hand, keyed by seat id. */
  lastDecisions: Record<string, BotDecision> = {};

  private rng: Rng;
  private bench: string[];
  private dealerSeat = 0;
  private handCounter = 0;
  private noteCounter = 0;
  private eventCounter = 0;
  private seatCounter = 0;
  private heldNotes: Note[] = [];
  private stacksAtHandStart: Record<string, number> = {};
  private countedVpip = false;
  private countedPfr = false;

  constructor(opts: SessionOptions = {}) {
    this.currency = getCurrency(opts.currency ?? 'USD');
    const s = stakes(this.currency);
    this.smallBlind = s.smallBlind;
    this.bigBlind = s.bigBlind;
    this.startingStack = s.startingStack;
    this.seed = opts.seed ?? randomSeed();
    this.rng = createRng(this.seed);
    this.useRealNames = opts.useRealNames ?? true;

    const count = Math.min(Math.max(opts.opponents ?? 5, 1), 5);
    const chosen = (opts.firmIds ?? [])
      .filter((id) => FIRMS.some((f) => f.id === id))
      .slice(0, count);
    const others = shuffle(
      FIRMS.map((f) => f.id).filter((id) => !chosen.includes(id)),
      this.rng,
    );
    const seated = [...chosen, ...others.slice(0, count - chosen.length)];
    this.bench = others.slice(count - chosen.length);

    this.seats.push({
      id: HUMAN_ID,
      firmId: null,
      name: opts.playerName?.trim() || 'You',
      archetype: null,
      stack: this.startingStack,
      isHuman: true,
      memory: this.freshMemory(),
    });
    for (const id of seated) this.seats.push(this.makeBotSeat(id));
    this.dealerSeat = Math.floor(this.rng() * this.seats.length);

    this.stats = {
      startStack: this.startingStack,
      peakStack: this.startingStack,
      handsPlayed: 0,
      handsWon: 0,
      showdownsWon: 0,
      biggestPotWon: 0,
      bestHandScore: -1,
      bestHandName: null,
      firmsLiquidatedByYou: [],
    };
  }

  private freshMemory(): BotMemory {
    return { startStack: this.startingStack, peakStack: this.startingStack, recentResults: [] };
  }

  private makeBotSeat(firmId: string): Seat {
    const firm = getFirm(firmId);
    return {
      id: `${firm.id}#${++this.seatCounter}`,
      firmId: firm.id,
      name: displayName(firm, this.useRealNames),
      archetype: firm.archetype,
      stack: this.startingStack,
      isHuman: false,
      memory: this.freshMemory(),
    };
  }

  get human(): Seat {
    return this.seats.find((s) => s.isHuman)!;
  }

  get isOver(): boolean {
    return this.human.stack <= 0 && (!this.hand || this.hand.isComplete);
  }

  get handInProgress(): boolean {
    return !!this.hand && !this.hand.isComplete;
  }

  /** Seat for a player index in the current hand. */
  seatFor(playerIndex: number): Seat | undefined {
    const id = this.hand?.players[playerIndex]?.id;
    return this.seats.find((s) => s.id === id);
  }

  get humanIndex(): number {
    return this.hand ? this.hand.players.findIndex((p) => p.isHuman) : -1;
  }

  isHumanTurn(): boolean {
    return !!this.hand && !this.hand.isComplete && this.hand.toAct === this.humanIndex;
  }

  isBotTurn(): boolean {
    return !!this.hand && !this.hand.isComplete && this.hand.toAct !== this.humanIndex;
  }

  canDeal(): boolean {
    return (
      !this.handInProgress &&
      this.human.stack > 0 &&
      this.seats.filter((s) => s.stack > 0).length >= 2
    );
  }

  dealNextHand(): HandState {
    if (!this.canDeal()) throw new Error('Cannot deal a new hand now');
    const live = this.seats.filter((s) => s.stack > 0);

    // Move the button to the next seat that still has chips.
    const n = this.seats.length;
    if (this.handCounter > 0) {
      for (let k = 1; k <= n; k++) {
        const i = (this.dealerSeat + k) % n;
        if (this.seats[i]!.stack > 0) {
          this.dealerSeat = i;
          break;
        }
      }
    } else if (this.seats[this.dealerSeat]!.stack <= 0) {
      this.dealerSeat = this.seats.indexOf(live[0]!);
    }
    const dealerIndex = live.indexOf(this.seats[this.dealerSeat]!);

    this.stacksAtHandStart = Object.fromEntries(live.map((s) => [s.id, s.stack]));
    this.lastDecisions = {};
    this.heldNotes = [];
    this.countedVpip = false;
    this.countedPfr = false;
    this.opponent = { ...this.opponent, hands: this.opponent.hands + 1 };

    this.hand = startHand({
      seats: live.map((s) => ({ id: s.id, name: s.name, stack: s.stack, isHuman: s.isHuman })),
      dealerIndex,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      handNumber: ++this.handCounter,
      rng: this.rng,
    });
    if (this.hand.isComplete) this.finishHand();
    return this.hand;
  }

  /** Your action. */
  humanAct(action: PlayerAction): void {
    if (!this.hand || !this.isHumanTurn()) throw new Error('It is not your turn');
    this.learnFromHuman(action);
    this.hand = applyAction(this.hand, action);
    if (this.hand.isComplete) this.finishHand();
  }

  /** Lets the bot whose turn it is act. Returns its decision. */
  botAct(): BotDecision {
    if (!this.hand || !this.isBotTurn()) throw new Error('It is not a bot turn');
    const seat = this.seatFor(this.hand.toAct)!;
    const firm = getFirm(seat.firmId!);
    const decision = decide({
      hand: this.hand,
      archetype: firm.archetype,
      profile: firmProfile(firm),
      memory: seat.memory,
      opponent: this.opponent,
      rng: this.rng,
    });
    this.lastDecisions[seat.id] = decision;

    const note = deskNoteFor(decision.reason, seat.name, this.rng);
    const handNo = this.hand.handNumber;
    const repeat =
      note &&
      [...this.heldNotes, ...this.notes].some(
        (n) => n.handNumber === handNo && (n.seatId === seat.id || n.concept === note.concept),
      );
    if (note && !repeat) {
      const isFold = decision.action.type === 'fold';
      const entry: Note = {
        id: ++this.noteCounter,
        handNumber: this.hand.handNumber,
        seatId: seat.id,
        firmName: seat.name,
        archetype: firm.archetype,
        concept: note.concept,
        text: note.text,
        live: isFold,
      };
      // A note about a bet or call could give away the bot's hand, so hold it until the hand ends.
      if (isFold) this.pushNote(entry);
      else this.heldNotes.push(entry);
    }

    this.hand = applyAction(this.hand, decision.action);
    if (this.hand.isComplete) this.finishHand();
    return decision;
  }

  /** Start again with a fresh stack after busting. Bots keep their stacks. */
  rebuy(): void {
    if (this.handInProgress) throw new Error('Finish the hand first');
    this.human.stack = this.startingStack;
    this.stats.startStack += this.startingStack;
  }

  private pushNote(note: Note) {
    this.notes = [note, ...this.notes].slice(0, 40);
  }

  private learnFromHuman(action: PlayerAction) {
    const hand = this.hand!;
    const legal = legalActions(hand);
    const m = { ...this.opponent };
    const facingBet = legal.callAmount > 0;
    const effective = action.type === 'fold' && !facingBet ? 'check' : action.type;

    if (hand.street === 'preflop') {
      if ((effective === 'call' || effective === 'raise') && !this.countedVpip) {
        m.vpipHands++;
        this.countedVpip = true;
      }
      if (effective === 'raise' && !this.countedPfr) {
        m.pfrHands++;
        this.countedPfr = true;
      }
    }
    if (facingBet && hand.currentBet > hand.bigBlind) {
      m.betsFaced++;
      if (effective === 'fold') m.foldsToBet++;
    } else if (facingBet && hand.street !== 'preflop') {
      m.betsFaced++;
      if (effective === 'fold') m.foldsToBet++;
    }
    if (effective === 'raise') m.aggressiveActions++;
    if (effective === 'call') m.passiveActions++;
    this.opponent = m;
  }

  private finishHand() {
    const hand = this.hand!;
    const result = hand.result!;
    const humanIdx = this.humanIndex;

    // Notes held back during the hand are revealed now.
    for (const note of this.heldNotes) this.pushNote(note);
    this.heldNotes = [];

    hand.players.forEach((p, i) => {
      const seat = this.seats.find((s) => s.id === p.id)!;
      const net = p.stack - (this.stacksAtHandStart[p.id] ?? p.stack);
      seat.stack = p.stack;
      if (!seat.isHuman) {
        seat.memory = {
          ...seat.memory,
          peakStack: Math.max(seat.memory.peakStack, p.stack),
          recentResults: [...seat.memory.recentResults, net].slice(-8),
        };
      }
      if (seat.isHuman) {
        this.stats.handsPlayed++;
        const won = result.winnings[i] ?? 0;
        if (won > 0 && net > 0) this.stats.handsWon++;
        if (won > 0 && result.wentToShowdown && !p.folded) this.stats.showdownsWon++;
        this.stats.biggestPotWon = Math.max(this.stats.biggestPotWon, won);
        this.stats.peakStack = Math.max(this.stats.peakStack, p.stack);
        const score = result.scores[i];
        if (score != null && result.wentToShowdown && score > this.stats.bestHandScore) {
          this.stats.bestHandScore = score;
          this.stats.bestHandName = result.handNames[i] ?? null;
        }
      }
    });

    // Busted bots are "liquidated" and a new firm takes the seat.
    const humanWon = humanIdx >= 0 && (result.winnings[humanIdx] ?? 0) > 0;
    this.seats = this.seats.map((seat) => {
      if (seat.isHuman || seat.stack > 0) return seat;
      this.events = [
        {
          id: ++this.eventCounter,
          handNumber: hand.handNumber,
          kind: 'liquidated' as const,
          name: seat.name,
          byYou: humanWon,
        },
        ...this.events,
      ].slice(0, 20);
      if (humanWon) this.stats.firmsLiquidatedByYou.push(seat.name);
      const nextFirm = this.bench.shift();
      if (!nextFirm) return seat;
      const replacement = this.makeBotSeat(nextFirm);
      this.events = [
        {
          id: ++this.eventCounter,
          handNumber: hand.handNumber,
          kind: 'joined' as const,
          name: replacement.name,
        },
        ...this.events,
      ].slice(0, 20);
      return replacement;
    });
  }

  /** Total chips on the table, for sanity checks. */
  totalChips(): number {
    const inHand = this.hand && !this.hand.isComplete ? this.hand.players : [];
    const seatChips = this.seats.reduce((a, s) => {
      const p = inHand.find((x) => x.id === s.id);
      return a + (p ? p.stack + p.totalBet : s.stack);
    }, 0);
    return seatChips;
  }
}

export function archetypeOf(seat: Seat) {
  return seat.archetype ? ARCHETYPES[seat.archetype] : null;
}
