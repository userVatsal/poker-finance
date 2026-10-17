import { useState } from 'react';
import type { SessionOptions } from './game/session';
import { track } from './analytics/googleAnalytics';
import { ConsentBanner } from './ui/ConsentBanner';
import { FirmsGuide } from './ui/FirmsGuide';
import { Footer } from './ui/Footer';
import { HowToPlay } from './ui/HowToPlay';
import { Lobby } from './ui/Lobby';
import { TableView } from './ui/TableView';

type Modal = 'how' | 'firms' | null;

export default function App() {
  const [game, setGame] = useState<{ key: number; options: SessionOptions } | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  return (
    <>
      {game ? (
        <TableView
          key={game.key}
          options={game.options}
          onExit={() => setGame(null)}
          onRestart={() =>
            setGame({ key: game.key + 1, options: { ...game.options, seed: undefined } })
          }
          onHowToPlay={() => {
            track('tutorial_open');
            setModal('how');
          }}
          onFirms={() => {
            track('firms_guide_open');
            setModal('firms');
          }}
        />
      ) : (
        <Lobby
          onStart={(options) => {
            track('game_start', {
              currency: options.currency ?? 'USD',
              opponents_picked: options.firmIds?.length ?? 0,
            });
            setGame({ key: Date.now(), options });
          }}
          onHowToPlay={() => {
            track('tutorial_open');
            setModal('how');
          }}
          onFirms={() => {
            track('firms_guide_open');
            setModal('firms');
          }}
        />
      )}
      <Footer />
      <ConsentBanner />
      {modal === 'how' && <HowToPlay onClose={() => setModal(null)} />}
      {modal === 'firms' && <FirmsGuide onClose={() => setModal(null)} />}
    </>
  );
}
