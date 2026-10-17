import { useEffect, useMemo, useState } from 'react';
import { estimateEquity, potOdds } from '../engine/equity';
import { legalActions, pot } from '../engine/hand';
import { describeHand, evaluate } from '../engine/handEvaluator';
import { createRng } from '../engine/rng';
import { formatMoney, formatSigned } from '../currency/format';
import type { SessionOptions } from '../game/session';
import { ActionBar } from './ActionBar';
import { FirmProfile } from './FirmProfile';
import { actionText, isWinner } from './handUtils';
import { Brand } from './Logo';
import { PlayingCard } from './PlayingCard';
import { ReportCard } from './ReportCard';
import { SeatView } from './Seat';
import { DeskNotes, HandLog, TableEvents } from './Sidebar';
import { useSession } from './useSession';

interface Props {
  options: SessionOptions;
  onExit: () => void;
  onRestart: () => void;
  onHowToPlay: () => void;
  onFirms: () => void;
}

const STREET_LABEL = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
} as const;

export function TableView({ options, onExit, onRestart, onHowToPlay, onFirms }: Props) {
  const { session, version, thinking, act, deal, rebuy } = useSession(options);
  const [profile, setProfile] = useState<string | null>(null);
  const [report, setReport] = useState(false);
  const hand = session.hand;
  const c = session.currency;
  const humanIdx = session.humanIndex;
  const me = hand && humanIdx >= 0 ? hand.players[humanIdx] : undefined;
  const busted = session.isOver;

  useEffect(() => {
    if (busted) setReport(true);
  }, [busted]);

  // Your maths: equity against the players still in the hand.
  const opponentsLeft = hand
    ? hand.players.filter((p, i) => i !== humanIdx && !p.folded).length
    : 0;
  const equity = useMemo(() => {
    if (!hand || !me || me.folded || hand.isComplete || opponentsLeft === 0) return null;
    return estimateEquity(
      me.hole,
      hand.board,
      opponentsLeft,
      1500,
      createRng(hand.handNumber * 31 + hand.board.length),
    );
    // Recompute only when the cards or the number of opponents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand?.handNumber, hand?.board.length, opponentsLeft, me?.folded, hand?.isComplete]);

  const myTurn = session.isHumanTurn();
  const legal = hand && myTurn ? legalActions(hand) : null;
  const potSize = hand ? pot(hand) : 0;
  const odds = legal ? potOdds(legal.callAmount, potSize) : 0;
  const madeHand =
    me && hand && hand.board.length >= 3
      ? describeHand(evaluate([...me.hole, ...hand.board]))
      : null;

  const opponents = session.seats.filter((s) => !s.isHuman);
  const winnersText = useMemo(() => {
    if (!hand?.isComplete) return null;
    const totals = new Map<number, { amount: number; hand: string | null }>();
    for (const e of hand.log) {
      if (e.kind !== 'win') continue;
      const prev = totals.get(e.player);
      totals.set(e.player, { amount: (prev?.amount ?? 0) + e.amount, hand: prev?.hand ?? e.hand });
    }
    return [...totals.entries()]
      .filter(([i]) => isWinner(hand.result, i))
      .map(([i, w]) => {
        const who = hand.players[i]!.isHuman ? 'You win' : `${hand.players[i]!.name} wins`;
        return `${who} ${formatMoney(w.amount, c)}${w.hand ? ` with ${w.hand.toLowerCase()}` : ''}`;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand, version]);

  const myNet = hand?.isComplete && me ? (hand.result?.winnings[humanIdx] ?? 0) - me.totalBet : 0;

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Brand onClick={onExit} />
          <span className="muted mono hide-sm" style={{ fontSize: 12 }}>
            {c.code} · {formatMoney(session.smallBlind, c)}/{formatMoney(session.bigBlind, c)}
            {hand ? ` · hand ${hand.handNumber}` : ''}
          </span>
          <div className="topbar-spacer" />
          <button className="btn btn-ghost btn-sm" onClick={onHowToPlay}>
            How to play
          </button>
          <button className="btn btn-ghost btn-sm hide-sm" onClick={onFirms}>
            Firms
          </button>
          <button className="btn btn-sm" onClick={() => setReport(true)}>
            Cash out
          </button>
        </div>
      </header>

      <main className="container game">
        <div>
          <div className="opponents">
            {opponents.map((seat) => {
              const idx = hand ? hand.players.findIndex((p) => p.id === seat.id) : -1;
              return (
                <SeatView
                  key={seat.id}
                  seat={seat}
                  player={idx >= 0 ? hand!.players[idx] : undefined}
                  playerIndex={idx}
                  hand={hand}
                  currency={c}
                  thinking={thinking === seat.id}
                  onOpen={() => seat.firmId && setProfile(seat.firmId)}
                />
              );
            })}
          </div>

          <div className="felt">
            <div className="felt-inner">
              <div className="street">{hand ? STREET_LABEL[hand.street] : 'Shuffling'}</div>
              <div className="board">
                {Array.from({ length: 5 }, (_, i) => (
                  <PlayingCard key={hand?.board[i] ?? `slot${i}`} card={hand?.board[i]} size="lg" />
                ))}
              </div>
              <div className="pot">Pot {formatMoney(potSize, c)}</div>
              {winnersText && winnersText.length > 0 && (
                <div className="result-banner" role="status">
                  {winnersText.map((t) => (
                    <div key={t}>
                      <strong>{t}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className={`me${myTurn ? ' is-turn' : ''}${hand?.isComplete && isWinner(hand.result, humanIdx) ? ' is-winner' : ''}`}
          >
            <div className="me-head">
              <div style={{ display: 'flex', gap: 6 }}>
                {me
                  ? me.hole.map((card) => <PlayingCard key={card} card={card} size="lg" />)
                  : null}
              </div>
              <div className="me-info">
                <div className="me-name">
                  {session.human.name}
                  {hand && hand.dealerIndex === humanIdx && (
                    <span className="badge badge-dealer" style={{ marginLeft: 8 }}>
                      D
                    </span>
                  )}
                  {me?.allIn && (
                    <span className="badge badge-allin" style={{ marginLeft: 8 }}>
                      ALL-IN
                    </span>
                  )}
                </div>
                <div className="mono" style={{ fontSize: 18 }}>
                  {formatMoney(me ? me.stack : session.human.stack, c)}
                </div>
                <div className="maths" aria-label="Your maths">
                  {madeHand && !me?.folded && (
                    <span>
                      Hand <b>{madeHand}</b>
                    </span>
                  )}
                  {equity !== null && (
                    <span title="Estimated chance of winning against the players still in, from 1,500 simulated run-outs">
                      Win chance <b>{Math.round(equity * 100)}%</b> vs {opponentsLeft}
                    </span>
                  )}
                  {legal && legal.callAmount > 0 && (
                    <span title="The share of the final pot you pay to call. Call when your win chance is higher.">
                      Pot odds <b>{Math.round(odds * 100)}%</b>
                    </span>
                  )}
                  {me?.folded && !hand?.isComplete && <span>You folded</span>}
                </div>
              </div>
            </div>

            {hand && myTurn && legal && (
              <ActionBar hand={hand} legal={legal} potSize={potSize} currency={c} onAct={act} />
            )}
            {hand && !hand.isComplete && !myTurn && (
              <div className="waiting">
                {thinking
                  ? `Waiting for ${session.seats.find((s) => s.id === thinking)?.name ?? 'the table'}…`
                  : me && actionText(me, c)}
              </div>
            )}
            {hand?.isComplete && (
              <div className="raise-row">
                {busted ? (
                  <button className="btn btn-red" onClick={() => setReport(true)}>
                    See your report card
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={deal} autoFocus>
                    Deal next hand
                  </button>
                )}
                {me && (
                  <span className="mono muted" style={{ fontSize: 13 }}>
                    This hand: {formatSigned(myNet, c)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="sidebar">
          <TableEvents events={session.events} />
          <DeskNotes notes={session.notes} />
          <HandLog hand={hand} currency={c} />
        </aside>
      </main>

      {profile && <FirmProfile firmId={profile} onClose={() => setProfile(null)} />}
      {report && (
        <ReportCard
          session={session}
          busted={busted}
          onClose={() => setReport(false)}
          onRebuy={() => {
            rebuy();
            setReport(false);
          }}
          onNewTable={onRestart}
          onLobby={onExit}
        />
      )}
    </>
  );
}
