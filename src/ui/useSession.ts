import { useCallback, useEffect, useReducer, useState } from 'react';
import { CONFIG } from '../config';
import type { PlayerAction } from '../engine/types';
import { Session, type SessionOptions } from '../game/session';

/**
 * Connects a Session to React. Bots act on a timer so play feels like a real
 * table; everything else is synchronous.
 */
export function useSession(options: SessionOptions) {
  const [session] = useState(() => new Session(options));
  const [version, bump] = useReducer((x: number) => x + 1, 0);
  const [thinking, setThinking] = useState<string | null>(null);

  // Deal the first hand.
  useEffect(() => {
    if (!session.hand && session.canDeal()) {
      session.dealNextHand();
      bump();
    }
  }, [session]);

  // Run bots whenever it is their turn.
  useEffect(() => {
    if (!session.isBotTurn()) {
      setThinking(null);
      return;
    }
    const seat = session.seatFor(session.hand!.toAct);
    setThinking(seat?.id ?? null);
    const [lo, hi] = CONFIG.BOT_DELAY_MS;
    const delay = lo + Math.random() * (hi - lo);
    const timer = window.setTimeout(() => {
      if (session.isBotTurn()) session.botAct();
      bump();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session, version]);

  const act = useCallback(
    (action: PlayerAction) => {
      if (!session.isHumanTurn()) return;
      session.humanAct(action);
      bump();
    },
    [session],
  );

  const deal = useCallback(() => {
    if (session.canDeal()) {
      session.dealNextHand();
      bump();
    }
  }, [session]);

  const rebuy = useCallback(() => {
    session.rebuy();
    session.dealNextHand();
    bump();
  }, [session]);

  return { session, version, thinking, act, deal, rebuy };
}
