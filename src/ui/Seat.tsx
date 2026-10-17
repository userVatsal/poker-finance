import { ARCHETYPES } from '../bots/archetypes';
import type { Currency } from '../currency/currencies';
import { formatMoney } from '../currency/format';
import type { HandState, PlayerState } from '../engine/types';
import type { Seat as SeatModel } from '../game/session';
import { actionText, isWinner } from './handUtils';
import { PlayingCard } from './PlayingCard';

interface Props {
  seat: SeatModel;
  player: PlayerState | undefined;
  playerIndex: number;
  hand: HandState | null;
  currency: Currency;
  thinking: boolean;
  onOpen: () => void;
}

export function SeatView({ seat, player, playerIndex, hand, currency, thinking, onOpen }: Props) {
  const arch = seat.archetype ? ARCHETYPES[seat.archetype] : null;
  const inHand = !!player && !!hand;
  const result = hand?.result;
  const revealed = !!result?.wentToShowdown && !!player && !player.folded;
  const winner = isWinner(result, playerIndex);
  const stack = player ? player.stack : seat.stack;

  const classes = ['seat'];
  if (hand && !hand.isComplete && hand.toAct === playerIndex) classes.push('is-turn');
  if (player?.folded) classes.push('is-folded');
  if (winner) classes.push('is-winner');
  if (!inHand && seat.stack <= 0) classes.push('is-empty');

  const status = thinking ? (
    <span className="thinking">Thinking</span>
  ) : player ? (
    actionText(player, currency)
  ) : (
    'Sitting out'
  );

  return (
    <button
      className={classes.join(' ')}
      onClick={onOpen}
      aria-label={`${seat.name}, ${arch?.name ?? ''}. View profile.`}
    >
      <div className="badges">
        {hand?.dealerIndex === playerIndex && playerIndex >= 0 && (
          <span className="badge badge-dealer">D</span>
        )}
        {player?.allIn && <span className="badge badge-allin">ALL-IN</span>}
      </div>
      <div className="seat-name" title={seat.name}>
        {seat.name}
      </div>
      {arch && (
        <div className="seat-tag">
          <span className="dot" style={{ background: arch.color }} />
          {arch.tag}
        </div>
      )}
      <div className="seat-row">
        <span className="seat-stack">{formatMoney(stack, currency)}</span>
        {inHand && (
          <span className="seat-cards">
            {player!.folded ? null : revealed ? (
              player!.hole.map((c) => <PlayingCard key={c} card={c} size="sm" />)
            ) : (
              <>
                <PlayingCard card={0} hidden size="sm" />
                <PlayingCard card={0} hidden size="sm" />
              </>
            )}
          </span>
        )}
      </div>
      <div className={`seat-action${player?.lastAction?.type === 'raise' ? ' raise' : ''}`}>
        {revealed && result?.handNames[playerIndex] ? result.handNames[playerIndex] : status}
      </div>
    </button>
  );
}
