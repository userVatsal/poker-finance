import { CONFIG } from '../config';
import { formatSigned } from '../currency/format';
import type { Session } from '../game/session';

export function netResult(session: Session): number {
  return session.human.stack - session.stats.startStack;
}

export function shareText(session: Session): string {
  const net = netResult(session);
  const opponents = session.seats
    .filter((s) => !s.isHuman)
    .slice(0, 3)
    .map((s) => s.name)
    .join(', ');
  const liquidated = session.stats.firmsLiquidatedByYou;
  const lines = [
    `I just played ${session.stats.handsPlayed} hands of Poker Finance against ${opponents} and more, and finished ${formatSigned(net, session.currency)}.`,
  ];
  if (liquidated.length) lines.push(`Firms I liquidated: ${liquidated.join(', ')}.`);
  lines.push(
    `Every bot plays poker the way its firm trades. Built by ${CONFIG.SOCIETY_NAME}. Can you beat Wall Street?`,
    CONFIG.SITE_URL,
  );
  return lines.join('\n\n');
}

export function linkedInShareUrl(): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(CONFIG.SITE_URL)}`;
}
