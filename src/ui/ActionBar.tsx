import { useEffect, useState } from 'react';
import type { Currency } from '../currency/currencies';
import { formatMoney } from '../currency/format';
import type { HandState, LegalActions, PlayerAction } from '../engine/types';

interface Props {
  hand: HandState;
  legal: LegalActions;
  potSize: number;
  currency: Currency;
  onAct: (action: PlayerAction) => void;
}

export function ActionBar({ hand, legal, potSize, currency, onAct }: Props) {
  const [raiseTo, setRaiseTo] = useState(legal.minRaiseTo);
  const step = hand.smallBlind;

  useEffect(() => setRaiseTo(legal.minRaiseTo), [legal.minRaiseTo, hand.toAct, hand.street]);

  // Keyboard shortcuts: F fold, C check/call, R raise.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'f' && legal.canFold) onAct({ type: 'fold' });
      else if (k === 'c') onAct(legal.canCheck ? { type: 'check' } : { type: 'call' });
      else if (k === 'r' && legal.canRaise) onAct({ type: 'raise', amount: raiseTo });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [legal, raiseTo, onAct]);

  const me = hand.players[hand.toAct]!;
  const clampTo = (x: number) =>
    Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, Math.round(x / step) * step));
  // "Pot" raise: call, then raise the size of the new pot.
  const potRaise = (fraction: number) =>
    clampTo(hand.currentBet + (potSize + legal.callAmount) * fraction);
  const openRaise = (bbs: number) => clampTo(hand.bigBlind * bbs);
  const unopenedPreflop = hand.street === 'preflop' && hand.currentBet <= hand.bigBlind;
  const isAllIn = raiseTo >= legal.maxRaiseTo;
  const verb = hand.currentBet === 0 ? 'Bet' : 'Raise to';

  return (
    <div className="actions">
      <div className="action-buttons">
        <button
          className="btn"
          onClick={() => onAct({ type: 'fold' })}
          disabled={!legal.canFold}
          title="Shortcut: F"
        >
          Fold
        </button>
        {legal.canCheck ? (
          <button className="btn" onClick={() => onAct({ type: 'check' })} title="Shortcut: C">
            Check
          </button>
        ) : (
          <button className="btn" onClick={() => onAct({ type: 'call' })} title="Shortcut: C">
            {legal.callAmount >= me.stack ? 'All-in' : 'Call'}{' '}
            {formatMoney(legal.callAmount, currency)}
          </button>
        )}
        <button
          className="btn btn-red"
          onClick={() => onAct({ type: 'raise', amount: raiseTo })}
          disabled={!legal.canRaise}
          title="Shortcut: R"
        >
          {isAllIn ? 'All-in' : verb} {legal.canRaise ? formatMoney(raiseTo, currency) : ''}
        </button>
      </div>
      {legal.canRaise && legal.maxRaiseTo > legal.minRaiseTo && (
        <div className="raise-row">
          <label htmlFor="raise" className="sr-only">
            Raise amount
          </label>
          <input
            id="raise"
            type="range"
            min={legal.minRaiseTo}
            max={legal.maxRaiseTo}
            step={step}
            value={raiseTo}
            onChange={(e) => setRaiseTo(clampTo(Number(e.target.value)))}
          />
          <div className="presets">
            {unopenedPreflop ? (
              <>
                <button className="btn btn-sm" onClick={() => setRaiseTo(openRaise(2.5))}>
                  2.5 BB
                </button>
                <button className="btn btn-sm" onClick={() => setRaiseTo(openRaise(3))}>
                  3 BB
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-sm" onClick={() => setRaiseTo(potRaise(0.5))}>
                  ½ pot
                </button>
                <button className="btn btn-sm" onClick={() => setRaiseTo(potRaise(1))}>
                  Pot
                </button>
              </>
            )}
            <button className="btn btn-sm" onClick={() => setRaiseTo(legal.maxRaiseTo)}>
              All-in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
