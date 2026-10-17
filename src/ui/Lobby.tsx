import { useState } from 'react';
import { ARCHETYPES, ARCHETYPE_ORDER } from '../bots/archetypes';
import { displayName, FIRMS } from '../bots/firms';
import { CONFIG } from '../config';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrency, stakes } from '../currency/currencies';
import { formatMoney } from '../currency/format';
import type { SessionOptions } from '../game/session';
import { Brand } from './Logo';

interface Props {
  onStart: (options: SessionOptions) => void;
  onHowToPlay: () => void;
  onFirms: () => void;
}

const NAME_KEY = 'pf.playerName';

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function Lobby({ onStart, onHowToPlay, onFirms }: Props) {
  const [name, setName] = useState(loadName);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [picked, setPicked] = useState<string[]>([]);
  const c = getCurrency(currency);
  const s = stakes(c);
  const max = CONFIG.OPPONENTS;

  const toggle = (id: string) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < max ? [...p, id] : p,
    );

  const start = () => {
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      /* storage unavailable: fine */
    }
    onStart({
      currency,
      firmIds: picked,
      playerName: name,
      useRealNames: CONFIG.USE_REAL_NAMES,
      opponents: max,
    });
  };

  const firmName = (id: string) =>
    displayName(
      FIRMS.find((f) => f.id === id)!,
      CONFIG.USE_REAL_NAMES,
    );

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <Brand />
          <div className="topbar-spacer" />
          <button className="btn btn-ghost btn-sm" onClick={onHowToPlay}>
            How to play
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onFirms}>
            The firms
          </button>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="eyebrow">{CONFIG.SOCIETY_NAME} presents</div>
          <h1>
            Can you beat Wall Street <em>at poker?</em>
          </h1>
          <p className="hero-sub">
            Texas Hold'em against {FIRMS.length} banks, HFTs and hedge funds. Every bot plays the
            way its firm trades, and desk notes explain the finance behind each move. Free, no
            sign-up, play money only.
          </p>

          <div className="setup">
            <div className="panel">
              <h2>Pick your table</h2>
              <p className="panel-sub">
                Choose up to {max} opponents, or leave it empty for a random table. Busted firms get
                replaced.
              </p>
              <div className="field">
                <span className="field-label">
                  Opponents ({picked.length}/{max})
                </span>
                <div className="picked">
                  {picked.length === 0 && <span className="picked-empty">Random table</span>}
                  {picked.map((id) => (
                    <button
                      key={id}
                      className="chip"
                      aria-pressed="true"
                      onClick={() => toggle(id)}
                    >
                      {firmName(id)} <span aria-hidden="true">×</span>
                      <span className="sr-only">remove</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="roster">
                {ARCHETYPE_ORDER.map((a) => (
                  <div key={a} className="roster-group">
                    <h3>
                      <span className="dot" style={{ background: ARCHETYPES[a].color }} />
                      {ARCHETYPES[a].name} <span className="muted">· {ARCHETYPES[a].tag}</span>
                    </h3>
                    <div className="chip-row">
                      {FIRMS.filter((f) => f.archetype === a).map((f) => (
                        <button
                          key={f.id}
                          className="chip"
                          aria-pressed={picked.includes(f.id)}
                          onClick={() => toggle(f.id)}
                          disabled={!picked.includes(f.id) && picked.length >= max}
                        >
                          {displayName(f, CONFIG.USE_REAL_NAMES)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Your seat</h2>
              <p className="panel-sub">
                You start with {formatMoney(s.startingStack, c)}. Blinds{' '}
                {formatMoney(s.smallBlind, c)} / {formatMoney(s.bigBlind, c)}.
              </p>
              <div className="field">
                <label htmlFor="name">Display name (optional)</label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  maxLength={24}
                  placeholder="You"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <span className="field-label">Currency</span>
                <div className="chip-row">
                  {CURRENCIES.slice(0, 6).map((cur) => (
                    <button
                      key={cur.code}
                      className="chip"
                      aria-pressed={currency === cur.code}
                      disabled={cur.status !== 'live'}
                      onClick={() => setCurrency(cur.code)}
                      title={
                        cur.status === 'live' ? cur.name : `${cur.name}, coming in ${cur.release}`
                      }
                    >
                      <span className="mono">{cur.symbol}</span> {cur.code}
                      {cur.status !== 'live' && <span className="muted">soon</span>}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-red"
                style={{ width: '100%', minHeight: 52 }}
                onClick={start}
              >
                Take a seat
              </button>
              <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
                New to poker? Read{' '}
                <a href="#" onClick={(e) => (e.preventDefault(), onHowToPlay())}>
                  how to play
                </a>{' '}
                first. It takes two minutes.
              </p>
            </div>
          </div>
        </section>

        <h2 className="section-title">Six trading styles, six poker styles</h2>
        <p className="muted" style={{ margin: 0, maxWidth: 680 }}>
          Every firm belongs to an archetype. Learn the style, then use it against them.
        </p>
        <div className="archetype-grid">
          {ARCHETYPE_ORDER.map((a) => (
            <div key={a} className="archetype-card">
              <h3>
                <span className="dot" style={{ background: ARCHETYPES[a].color }} />
                {ARCHETYPES[a].name}
              </h3>
              <p>{ARCHETYPES[a].poker}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
