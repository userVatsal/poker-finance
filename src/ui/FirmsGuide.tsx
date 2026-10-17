import { useState } from 'react';
import { ARCHETYPES, ARCHETYPE_ORDER } from '../bots/archetypes';
import { displayName, FIRMS } from '../bots/firms';
import { CONFIG } from '../config';
import { FirmProfile } from './FirmProfile';
import { Modal } from './Modal';

export function FirmsGuide({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  if (open) return <FirmProfile firmId={open} onClose={() => setOpen(null)} />;

  return (
    <Modal
      title="The firms"
      eyebrow={`${FIRMS.length} opponents · 6 styles`}
      onClose={onClose}
      wide
    >
      <p style={{ marginTop: 0 }}>
        Each firm is a caricature built from public descriptions of how it makes money. Pick one to
        see how it plays.
      </p>
      {ARCHETYPE_ORDER.map((a) => {
        const arch = ARCHETYPES[a];
        return (
          <section key={a}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="dot" style={{ background: arch.color }} />
              {arch.name}
            </h3>
            <p style={{ marginTop: 0, fontSize: 14 }}>{arch.trading}</p>
            <div className="chip-row">
              {FIRMS.filter((f) => f.archetype === a).map((f) => (
                <button key={f.id} className="chip" onClick={() => setOpen(f.id)}>
                  {displayName(f, CONFIG.USE_REAL_NAMES)}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </Modal>
  );
}
