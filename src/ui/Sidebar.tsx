import { ARCHETYPES } from '../bots/archetypes';
import type { Currency } from '../currency/currencies';
import { formatMoney } from '../currency/format';
import { cardLabel } from '../engine/cards';
import type { HandState } from '../engine/types';
import type { Note, TableEvent } from '../game/session';

export function DeskNotes({ notes }: { notes: Note[] }) {
  return (
    <section className="panel" aria-labelledby="notes-title">
      <h2 id="notes-title">Desk notes</h2>
      <p className="panel-sub" style={{ marginBottom: 12 }}>
        The trading idea behind the bots' moves. Notes on bets are held until the hand ends, so they
        never give a hand away.
      </p>
      <div className="notes" aria-live="polite">
        {notes.length === 0 && (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Notes appear as the bots play.
          </p>
        )}
        {notes.slice(0, 6).map((n) => (
          <article key={n.id} className="note">
            <div className="note-concept">{n.concept}</div>
            <div className="note-head">
              <span className="dot" style={{ background: ARCHETYPES[n.archetype].color }} />
              {n.firmName}
              <span className="muted mono" style={{ fontSize: 11, fontWeight: 400 }}>
                hand {n.handNumber}
              </span>
            </div>
            {n.text}
          </article>
        ))}
      </div>
    </section>
  );
}

export function TableEvents({ events }: { events: TableEvent[] }) {
  const recent = events.slice(0, 3);
  if (recent.length === 0) return null;
  return (
    <div className="notes">
      {recent.map((e) => (
        <div key={e.id} className="event">
          {e.kind === 'liquidated' ? (
            <>
              <strong>{e.name}</strong> was liquidated{e.byYou ? ' by you' : ''}.
            </>
          ) : (
            <>
              <strong>{e.name}</strong> takes the empty seat.
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const cards = (cs: number[]) =>
  cs
    .map((c) => {
      const l = cardLabel(c);
      return l.rank + l.suit;
    })
    .join(' ');

export function HandLog({ hand, currency }: { hand: HandState | null; currency: Currency }) {
  if (!hand) return null;
  const name = (i: number) => (hand.players[i]?.isHuman ? 'You' : (hand.players[i]?.name ?? '?'));
  // "You call" but "Optiver calls".
  const v = (i: number, verb: string) => (hand.players[i]?.isHuman ? verb : `${verb}s`);
  return (
    <section className="panel" aria-labelledby="log-title">
      <h2 id="log-title">Hand {hand.handNumber}</h2>
      <div className="log">
        {hand.log.map((e, i) => {
          switch (e.kind) {
            case 'post':
              return (
                <div key={i}>
                  {name(e.player)} {v(e.player, 'post')} {e.blind} blind{' '}
                  {formatMoney(e.amount, currency)}
                </div>
              );
            case 'deal':
              return (
                <div key={i} className="log-street">
                  {e.street[0]!.toUpperCase() + e.street.slice(1)}: {cards(e.cards)}
                </div>
              );
            case 'action': {
              const verb =
                e.type === 'raise'
                  ? `${e.allIn ? `${hand.players[e.player]?.isHuman ? 'go' : 'goes'} all-in to` : `${v(e.player, 'raise')} to`} ${formatMoney(e.amount, currency)}`
                  : e.type === 'call'
                    ? `${v(e.player, 'call')} ${formatMoney(e.amount, currency)}${e.allIn ? ' (all-in)' : ''}`
                    : e.type === 'check'
                      ? v(e.player, 'check')
                      : v(e.player, 'fold');
              return (
                <div key={i}>
                  {name(e.player)} {verb}
                </div>
              );
            }
            case 'win':
              return (
                <div key={i} style={{ color: 'var(--text)' }}>
                  {name(e.player)} {hand.players[e.player]?.isHuman ? 'win' : 'wins'}{' '}
                  {formatMoney(e.amount, currency)}
                  {e.hand ? ` with ${e.hand.toLowerCase()}` : ''}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </section>
  );
}
