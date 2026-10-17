import { CONFIG } from '../config';

/** The "Signal" mark: a ring of ticks with a red tail that turns it into a Q. */
export function SignalMark({ size = 28 }: { size?: number }) {
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    if (i === 4) continue; // gap where the tail exits
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r1 = 14;
    const r2 = 20;
    ticks.push(
      <line
        key={i}
        x1={32 + Math.cos(a) * r1}
        y1={32 + Math.sin(a) * r1}
        x2={32 + Math.cos(a) * r2}
        y2={32 + Math.sin(a) * r2}
      />,
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        {ticks}
      </g>
      <line
        x1="40"
        y1="40"
        x2="54"
        y2="54"
        stroke="var(--red)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Poker Finance home">
      <SignalMark />
      <span style={{ display: 'grid', lineHeight: 1.15, textAlign: 'left' }}>
        <span className="brand-name">Poker Finance</span>
        <span className="brand-handle">
          {CONFIG.SOCIETY_HANDLE.replace(/_$/, '')}
          <span className="cursor">_</span>
        </span>
      </span>
    </button>
  );
}
