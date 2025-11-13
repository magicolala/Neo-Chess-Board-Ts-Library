import React from 'react';

export interface StickyHeaderCtaLinks {
  tryPlayground: string;
  docs: string;
  install: string;
  github: string;
}

export interface StickyHeaderProps {
  onFlip: () => void;
  onReset: () => void;
  onStressTest: () => void;
  onAccessibilityAudit: () => void;
  onPerfToggle: () => void;
  onThemeToggle: () => void;
  isStressTestRunning: boolean;
  isPerfPanelVisible: boolean;
  perfPanelId?: string;
  ctaLinks?: Partial<StickyHeaderCtaLinks>;
}

const DEFAULT_CTA_LINKS: StickyHeaderCtaLinks = {
  tryPlayground: 'https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/',
  docs: 'https://magicolala.github.io/Neo-Chess-Board-Ts-Library/docs/',
  install: 'https://www.npmjs.com/package/@magicolala/neo-chess-board',
  github: 'https://github.com/magicolala/Neo-Chess-Board-Ts-Library',
};

const StickyHeader: React.FC<StickyHeaderProps> = ({
  onFlip,
  onReset,
  onStressTest,
  onAccessibilityAudit,
  onPerfToggle,
  onThemeToggle,
  isStressTestRunning,
  isPerfPanelVisible,
  perfPanelId,
  ctaLinks,
}) => {
  const links = React.useMemo(
    () => ({
      ...DEFAULT_CTA_LINKS,
      ...ctaLinks,
    }),
    [ctaLinks],
  );

  return (
    <header className="playground__sticky-header" aria-label="Playground navigation and actions">
      <div className="playground__sticky-header-inner">
        <div className="playground__sticky-header-left">
          <div className="playground__brand">
            <h1>NeoChessBoard Playground</h1>
            <p>Experiment with layouts, themes, and integrations in a dedicated workspace.</p>
          </div>

          <ul className="playground__badge-list" aria-label="Technology stack badges">
            <li className="playground__badge">MIT</li>
            <li className="playground__badge">TypeScript</li>
            <li className="playground__badge">Canvas</li>
            <li className="playground__badge">~15&nbsp;kb bundle</li>
          </ul>
        </div>

        <div className="playground__sticky-header-right">
          <nav className="playground__cta-links" aria-label="Primary library links">
            <a
              className="playground__cta-link playground__cta-link--primary"
              href={links.tryPlayground}
              target="_blank"
              rel="noreferrer noopener"
            >
              Try Playground
            </a>
            <a
              className="playground__cta-link"
              href={links.docs}
              target="_blank"
              rel="noreferrer noopener"
            >
              Docs
            </a>
            <a
              className="playground__cta-link"
              href={links.install}
              target="_blank"
              rel="noreferrer noopener"
            >
              Install
            </a>
            <a
              className="playground__cta-link"
              href={links.github}
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub ⭐
            </a>
          </nav>

          <div className="playground__actions" role="group" aria-label="Playground actions">
            <button type="button" onClick={onFlip}>
              Flip
            </button>
            <button type="button" onClick={onReset}>
              Reset
            </button>
            <button type="button" onClick={onStressTest} disabled={isStressTestRunning}>
              {isStressTestRunning ? 'Running…' : 'Stress Test'}
            </button>
            <button type="button" onClick={onAccessibilityAudit}>
              A11y
            </button>
            <button
              type="button"
              onClick={onPerfToggle}
              aria-pressed={isPerfPanelVisible}
              aria-expanded={isPerfPanelVisible}
              aria-controls={isPerfPanelVisible ? perfPanelId : undefined}
            >
              Perf
            </button>
            <button type="button" onClick={onThemeToggle}>
              Theme
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StickyHeader;
