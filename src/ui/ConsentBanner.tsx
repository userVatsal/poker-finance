import { useEffect, useState } from 'react';
import {
  COOKIE_SETTINGS_EVENT,
  gaEnabled,
  setConsent,
  storedConsent,
} from '../analytics/googleAnalytics';

export function ConsentBanner() {
  const [open, setOpen] = useState(() => gaEnabled() && storedConsent() === null);

  useEffect(() => {
    const reopen = () => gaEnabled() && setOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (c: 'granted' | 'denied') => {
    setConsent(c);
    setOpen(false);
  };

  return (
    <div className="consent" role="dialog" aria-label="Cookie choice" aria-live="polite">
      <p>
        We'd like to use Google Analytics cookies to see how people use Poker Finance, so we can
        improve it. No ads, and nothing is sold. The game works the same either way.{' '}
        <a
          href="https://github.com/userVatsal/poker-finance/blob/main/docs/privacy.md"
          target="_blank"
          rel="noreferrer"
        >
          Privacy notice
        </a>
      </p>
      <div className="consent-actions">
        <button className="btn btn-sm" onClick={() => choose('denied')}>
          Decline
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => choose('granted')}>
          Accept analytics
        </button>
      </div>
    </div>
  );
}
