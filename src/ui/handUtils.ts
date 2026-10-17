import type { Currency } from '../currency/currencies';
import { formatMoney } from '../currency/format';
import type { HandResult, PlayerState } from '../engine/types';

/** Did this player win a contested pot (not just get an uncalled bet back)? */
export function isWinner(result: HandResult | null | undefined, playerIndex: number): boolean {
  if (!result || playerIndex < 0) return false;
  return result.pots.some(
    (p) => p.winners.includes(playerIndex) && (p.eligible.length > 1 || !result.wentToShowdown),
  );
}

export function actionText(p: PlayerState, currency: Currency): string {
  const a = p.lastAction;
  if (!a) return '';
  switch (a.type) {
    case 'post':
      return `Blind ${formatMoney(a.amount, currency)}`;
    case 'fold':
      return 'Fold';
    case 'check':
      return 'Check';
    case 'call':
      return `Call ${formatMoney(a.amount, currency)}`;
    case 'raise':
      return `${p.allIn ? 'All-in' : 'Raise to'} ${formatMoney(a.amount, currency)}`;
  }
}
