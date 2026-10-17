import { Modal } from './Modal';

const RANKS: [string, string][] = [
  ['Royal flush', 'A K Q J 10, same suit'],
  ['Straight flush', 'Five in a row, same suit'],
  ['Four of a kind', 'Four cards of one rank'],
  ['Full house', 'Three of a kind plus a pair'],
  ['Flush', 'Five cards of one suit'],
  ['Straight', 'Five in a row, any suits'],
  ['Three of a kind', 'Three cards of one rank'],
  ['Two pair', 'Two different pairs'],
  ['Pair', 'Two cards of one rank'],
  ['High card', 'None of the above'],
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" eyebrow="Texas Hold'em in two minutes" onClose={onClose} wide>
      <h3>The goal</h3>
      <p style={{ marginTop: 0 }}>
        Win chips. You win a pot by having the best five-card hand at the end, or by betting so that
        everyone else folds.
      </p>

      <h3>A hand, step by step</h3>
      <ol>
        <li>Two players post forced bets called blinds. You get two private cards.</li>
        <li>
          <strong>Pre-flop:</strong> a round of betting. On your turn you can fold (give up), check
          (pass if nobody has bet), call (match the bet) or raise (bet more).
        </li>
        <li>
          <strong>Flop:</strong> three shared cards are dealt face up, then another betting round.
        </li>
        <li>
          <strong>Turn</strong> and <strong>river:</strong> one more shared card each, each followed
          by betting.
        </li>
        <li>
          <strong>Showdown:</strong> remaining players show their cards. Best five cards from your
          two plus the five shared cards wins.
        </li>
      </ol>

      <h3>Hand rankings, best to worst</h3>
      <div className="hand-ranks">
        {RANKS.map(([name, desc]) => (
          <div key={name} className="hand-rank">
            <span>{name}</span>
            <span>{desc}</span>
          </div>
        ))}
      </div>

      <h3>The two numbers that matter</h3>
      <p>
        <strong style={{ color: 'var(--text)' }}>Win chance</strong> is your estimated equity: how
        often your hand would win if the hand played out thousands of times. We work it out by
        simulating the unknown cards, the same Monte Carlo method quants use to price options.
      </p>
      <p>
        <strong style={{ color: 'var(--text)' }}>Pot odds</strong> are the share of the final pot
        you pay to call. If you must pay 20 into a pot that will be 100, you need to win more than
        20% of the time for the call to make money. Call when win chance beats pot odds. That is
        expected value, the core idea of all trading.
      </p>

      <h3>Reading the firms</h3>
      <p>
        Every opponent is a real bank, HFT or fund with a poker style modelled on how it trades.
        Click any seat to see its strategy dials. Desk notes on the right explain the finance idea
        behind their moves.
      </p>

      <h3>Shortcuts</h3>
      <p>
        <span className="mono">F</span> fold, <span className="mono">C</span> check or call,{' '}
        <span className="mono">R</span> raise.
      </p>
    </Modal>
  );
}
