/**
 * App-wide settings. Change these, not the code.
 */
export const CONFIG = {
  /**
   * Show real firm names. Set to false to replace every firm with its
   * fictional alias (see src/bots/firms.ts), e.g. if a firm or the
   * Students' Union asks us to.
   */
  USE_REAL_NAMES: true,

  /** Bots at the table (you make the sixth seat). */
  OPPONENTS: 5,

  /** Bot "thinking" delay range in milliseconds, so play feels human. */
  BOT_DELAY_MS: [550, 1150] as const,

  /** Pause after a hand finishes before the next can be dealt automatically. */
  AUTO_NEXT_HAND_MS: 0,

  /** Public URL used for sharing. Update after connecting a custom domain in Vercel. */
  SITE_URL: 'https://poker-finance.vercel.app',

  SOCIETY_NAME: 'DMU Quant Society',
  SOCIETY_HANDLE: 'dmu/quant_',
  REPO_URL: 'https://github.com/userVatsal/poker-finance',
} as const;
