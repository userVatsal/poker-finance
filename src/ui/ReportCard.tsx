import { useState } from 'react';
import { describePlayer, vpipRate } from '../bots/opponentModel';
import { formatMoney, formatSigned } from '../currency/format';
import type { Session } from '../game/session';
import { track } from '../analytics/googleAnalytics';
import { Modal } from './Modal';
import { linkedInShareUrl, netResult, shareText } from './share';

interface Props {
  session: Session;
  busted: boolean;
  onClose: () => void;
  onRebuy: () => void;
  onNewTable: () => void;
  onLobby: () => void;
}

export function ReportCard({ session, busted, onClose, onRebuy, onNewTable, onLobby }: Props) {
  const [copied, setCopied] = useState(false);
  const c = session.currency;
  const st = session.stats;
  const net = netResult(session);
  const roi = st.startStack ? (net / st.startStack) * 100 : 0;
  const vpip = vpipRate(session.opponent);
  const leader = [...session.seats].sort((a, b) => b.stack - a.stack)[0]!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(session));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      title={busted ? 'You have been liquidated' : 'Your report card'}
      eyebrow={`${st.handsPlayed} hands · ${c.code}`}
      onClose={onClose}
    >
      {busted && (
        <p style={{ marginTop: 0 }}>
          Your stack hit zero. Even the best desks blow up sometimes. The question is what you
          learned.
        </p>
      )}
      <div className="stats">
        <div className="stat">
          <div className="stat-label">Profit and loss</div>
          <div className={`stat-value ${net >= 0 ? 'up' : 'down'}`}>{formatSigned(net, c)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Return</div>
          <div className={`stat-value ${roi >= 0 ? 'up' : 'down'}`}>
            {roi >= 0 ? '+' : '−'}
            {Math.abs(roi).toFixed(0)}%
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Hands won</div>
          <div className="stat-value">
            {st.handsWon}/{st.handsPlayed}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Peak stack</div>
          <div className="stat-value">{formatMoney(st.peakStack, c)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Biggest pot</div>
          <div className="stat-value">{formatMoney(st.biggestPotWon, c)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Hands played voluntarily</div>
          <div className="stat-value">{vpip === null ? '–' : `${Math.round(vpip * 100)}%`}</div>
        </div>
      </div>
      <h3>Your style</h3>
      <p>{describePlayer(session.opponent)}</p>
      {st.bestHandName && (
        <p>
          Best hand at showdown: <strong style={{ color: 'var(--text)' }}>{st.bestHandName}</strong>
          .
        </p>
      )}
      {st.firmsLiquidatedByYou.length > 0 && (
        <p>Firms you liquidated: {st.firmsLiquidatedByYou.join(', ')}.</p>
      )}
      <p>
        Chip leader: {leader.isHuman ? 'you' : leader.name} with {formatMoney(leader.stack, c)}.
      </p>

      <h3>Share it</h3>
      <p style={{ fontSize: 13 }}>
        Copy your result, then paste it into the LinkedIn post that opens. Tag DMU Quant Society.
      </p>
      <div className="row-actions">
        <button
          className="btn"
          onClick={() => {
            track('share', { method: 'copy' });
            copy();
          }}
        >
          {copied ? 'Copied' : 'Copy result'}
        </button>
        <a
          className="btn btn-primary"
          href={linkedInShareUrl()}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            track('share', { method: 'linkedin' });
            copy();
          }}
        >
          Share on LinkedIn
        </a>
      </div>
      <div className="row-actions">
        {busted ? (
          <button className="btn btn-red" onClick={onRebuy}>
            Rebuy {formatMoney(session.startingStack, c)}
          </button>
        ) : (
          <button className="btn btn-red" onClick={onClose}>
            Keep playing
          </button>
        )}
        <button className="btn" onClick={onNewTable}>
          New table
        </button>
        <button className="btn btn-ghost" onClick={onLobby}>
          Back to lobby
        </button>
      </div>
    </Modal>
  );
}
