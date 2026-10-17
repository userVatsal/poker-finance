/**
 * Google Analytics 4, loaded only after the visitor agrees.
 *
 * GA4 sets cookies, so under UK GDPR and PECR it must not load until the
 * visitor opts in. Until then nothing is sent to Google. The Measurement ID
 * comes from the VITE_GA_MEASUREMENT_ID environment variable (set it in
 * Vercel → Settings → Environment Variables). Without it, everything here is
 * a no-op and the consent banner is hidden.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_ID: string = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();
const CONSENT_KEY = 'pf.analyticsConsent';

export type Consent = 'granted' | 'denied' | null;

export const gaEnabled = () => /^G-[A-Z0-9]+$/.test(GA_ID);

export function storedConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

let loaded = false;

function load() {
  if (loaded || !gaEnabled() || typeof document === 'undefined') return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Saves the visitor's choice and loads GA if they agreed. */
export function setConsent(choice: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage unavailable: choice lasts for this visit only */
  }
  if (choice === 'granted') load();
  else if (loaded) {
    // Withdrawn after loading: stop collection and remove GA cookies.
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0]!.trim();
      if (name.startsWith('_ga')) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    });
  }
}

/** Call once at start-up: loads GA if the visitor agreed on a previous visit. */
export function initAnalytics() {
  if (storedConsent() === 'granted') load();
}

/** Sends a GA4 event. Silently does nothing without consent or an ID. */
export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (!loaded || storedConsent() !== 'granted') return;
  window.gtag?.('event', event, params);
}

export const COOKIE_SETTINGS_EVENT = 'pf:open-cookie-settings';

/** Re-opens the consent banner, e.g. from the footer's "Cookie settings" link. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
