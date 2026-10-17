import {
  cardLabel,
  cardToString,
  RANK_NAMES,
  rankOf,
  SUIT_NAMES,
  suitOf,
  type Card,
} from '../engine/cards';

interface Props {
  card?: Card;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayingCard({ card, hidden, size = 'md' }: Props) {
  const sizeClass = size === 'md' ? '' : ` ${size}`;
  if (card === undefined) return <div className={`card slot${sizeClass}`} aria-hidden="true" />;
  if (hidden)
    return <div className={`card back${sizeClass}`} aria-label="Face-down card" role="img" />;
  const { rank, suit, red } = cardLabel(card);
  return (
    <div
      className={`card${red ? ' red' : ''}${sizeClass}`}
      role="img"
      aria-label={`${RANK_NAMES[rankOf(card)]} of ${SUIT_NAMES[suitOf(card)]}`}
      data-card={cardToString(card)}
    >
      <span className="card-rank">{rank}</span>
      <span className="card-suit">{suit}</span>
    </div>
  );
}
