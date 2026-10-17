import { ARCHETYPES, type StrategyProfile } from '../bots/archetypes';
import { firmProfile, getFirm } from '../bots/firms';
import { CONFIG } from '../config';
import { Modal } from './Modal';

const DIALS: { key: keyof StrategyProfile; label: string; help: string }[] = [
  { key: 'looseness', label: 'Hands played', help: 'How many hands it is willing to play.' },
  { key: 'aggression', label: 'Aggression', help: 'Raises rather than calls.' },
  { key: 'bluff', label: 'Bluffing', help: 'Bets with weak hands.' },
  { key: 'pressureFold', label: 'Folds to pressure', help: 'Gives up against big bets.' },
  { key: 'adaptivity', label: 'Learns your style', help: 'Adjusts to how you play.' },
  { key: 'riskLimit', label: 'Risk appetite', help: 'Share of stack it will risk in one hand.' },
];

export function FirmProfile({ firmId, onClose }: { firmId: string; onClose: () => void }) {
  const firm = getFirm(firmId);
  const arch = ARCHETYPES[firm.archetype];
  const p = firmProfile(firm);
  const name = CONFIG.USE_REAL_NAMES ? firm.name : firm.alias;

  return (
    <Modal title={name} eyebrow={`${arch.name} · ${firm.hq}`} onClose={onClose}>
      {CONFIG.USE_REAL_NAMES && <p style={{ marginTop: 0 }}>{firm.knownFor}</p>}
      <h3>How it trades</h3>
      <p>{arch.trading}</p>
      <h3>How it plays poker</h3>
      <p>{arch.poker}</p>
      <h3>Strategy dials</h3>
      <div className="dial-grid">
        {DIALS.map((d) => (
          <div key={d.key} className="dial" title={d.help}>
            {d.label}
            <div className="dial-bar">
              <span style={{ width: `${Math.round((p[d.key] as number) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {p.stopLoss < 1 && (
        <p style={{ fontSize: 13 }}>
          Tightens up after losing {Math.round(p.stopLoss * 100)}% from its peak stack.
        </p>
      )}
      {p.momentum > 0.3 && (
        <p style={{ fontSize: 13 }}>Plays bigger after wins and smaller after losses.</p>
      )}
      {p.sizing === 'kelly' && (
        <p style={{ fontSize: 13 }}>Sizes bets by its estimated edge (half-Kelly).</p>
      )}
      <p style={{ fontSize: 12, color: 'var(--faint)' }}>
        Lesson: {arch.lesson} This profile is a caricature built from public descriptions, not the
        firm's real strategy.
      </p>
    </Modal>
  );
}
