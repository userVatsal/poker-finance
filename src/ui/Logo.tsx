import { CONFIG } from '../config';

/*
 * The DMU Quant Society "Signal" mark.
 * 24 positions every 15°: 23 off-white bars, and a longer red bar at 135° that
 * breaks out of the ring and turns the O into a Q.
 * Geometry matches brand/build_logo.py (400 × 400 box, centre 200, 200).
 */
const BAR = { w: 18, rIn: 85, rOut: 138 };
const TAIL = { w: 22.6, rIn: 63.6, rOut: 173.2 };
const ANGLES = Array.from({ length: 24 }, (_, k) => k * 15).filter((a) => a !== 135);

export const LOGO_RED = '#e5251b';

export function SignalMark({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g fill="currentColor">
        {ANGLES.map((a) => (
          <rect
            key={a}
            x={200 - BAR.w / 2}
            y={200 - BAR.rOut}
            width={BAR.w}
            height={BAR.rOut - BAR.rIn}
            transform={`rotate(${a} 200 200)`}
          />
        ))}
      </g>
      <rect
        x={200 - TAIL.w / 2}
        y={200 + TAIL.rIn}
        width={TAIL.w}
        height={TAIL.rOut - TAIL.rIn}
        fill={LOGO_RED}
        transform="rotate(-45 200 200)"
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
