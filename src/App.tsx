import { useState } from 'react';
import type { SessionOptions } from './game/session';
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
          onHowToPlay={() => setModal('how')}
          onFirms={() => setModal('firms')}
        />
      ) : (
        <Lobby
          onStart={(options) => setGame({ key: Date.now(), options })}
          onHowToPlay={() => setModal('how')}
          onFirms={() => setModal('firms')}
        />
      )}
      <Footer />
      {modal === 'how' && <HowToPlay onClose={() => setModal(null)} />}
      {modal === 'firms' && <FirmsGuide onClose={() => setModal(null)} />}
    </>
  );
}
