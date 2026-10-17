import { CONFIG } from '../config';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          Poker Finance is an educational game by {CONFIG.SOCIETY_NAME}, De Montfort University,
          Leicester. Play money only: nothing is wagered and there are no prizes.
        </p>
        <p>
          Firm names are used only to describe publicly reported trading styles. The bots are
          caricatures, not any firm's real strategy, and no firm is affiliated with or endorses this
          game.
        </p>
        <p>
          <a href={CONFIG.REPO_URL} target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
