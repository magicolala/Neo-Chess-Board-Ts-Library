import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlaygroundSnippets, SnippetKind } from '../utils/snippetBuilder';
import { ANALYTICS_EVENTS, trackEvent } from '../utils/analytics';

interface CodePanelProps {
  snippets: PlaygroundSnippets;
}

type ToastState = {
  intent: 'success' | 'error';
  message: string;
};

const panelStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  position: 'relative',
};

const tabListStyles: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
};

const tabGroupStyles: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const baseTabStyles: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid rgba(99, 102, 241, 0.35)',
  borderRadius: '999px',
  padding: '0.35rem 0.9rem',
  background: 'rgba(15, 23, 42, 0.55)',
  color: 'var(--playground-text)',
  fontWeight: 600,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease',
};

const copyButtonStyles: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  borderRadius: '999px',
  padding: '0.4rem 1.1rem',
  background: 'rgba(99, 102, 241, 0.22)',
  color: 'var(--playground-text)',
  fontWeight: 600,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
};

const codeBlockStyles: React.CSSProperties = {
  margin: 0,
  padding: '1rem 1.25rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
  fontFamily:
    "'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
  fontSize: '0.85rem',
  lineHeight: 1.6,
  maxHeight: '320px',
  overflow: 'auto',
  whiteSpace: 'pre',
  color: 'var(--playground-text)',
  boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.08)',
};

const toastStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '0.5rem',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '0.5rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.88)',
  color: 'var(--playground-text)',
  fontSize: '0.85rem',
  boxShadow: '0 18px 30px rgba(15, 23, 42, 0.55)',
  pointerEvents: 'none',
};

const TAB_LABELS: Record<SnippetKind, string> = {
  react: 'React',
  vanilla: 'Vanilla JS',
  ssr: 'SSR',
};

const TABS: SnippetKind[] = ['react', 'vanilla', 'ssr'];

const CodePanel: React.FC<CodePanelProps> = ({ snippets }) => {
  const [activeTab, setActiveTab] = useState<SnippetKind>('react');
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, 2400);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [toast]);

  const activeSnippet = useMemo(() => snippets[activeTab], [activeTab, snippets]);

  const handleTabSelect = useCallback((tab: SnippetKind) => {
    setActiveTab(tab);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = activeSnippet;
    if (!text) {
      trackEvent(ANALYTICS_EVENTS.COPY_CODE, {
        success: false,
        source: 'code-panel',
        reason: 'empty-snippet',
        format: activeTab,
      });
      return;
    }

    let success = false;
    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== 'function'
      ) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(text);
      setToast({ intent: 'success', message: 'Code copied to clipboard' });
      success = true;
    } catch (error: unknown) {
      console.error(error);
      setToast({ intent: 'error', message: 'Unable to copy code' });
      success = false;
    }

    trackEvent(ANALYTICS_EVENTS.COPY_CODE, {
      success,
      source: 'code-panel',
      format: activeTab,
    });
  }, [activeSnippet, activeTab]);

  return (
    <div style={panelStyles}>
      <div role="tablist" aria-label="Code snippet format" style={tabListStyles}>
        <div style={tabGroupStyles}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            const dynamicStyles: React.CSSProperties = {
              ...baseTabStyles,
              background: isActive ? 'rgba(99, 102, 241, 0.32)' : baseTabStyles.background,
              borderColor: isActive ? 'rgba(99, 102, 241, 0.55)' : 'rgba(99, 102, 241, 0.35)',
              boxShadow: isActive ? '0 12px 24px rgba(99, 102, 241, 0.35)' : 'none',
              transform: isActive ? 'translateY(-1px)' : undefined,
            };

            return (
              <button
                key={tab}
                type="button"
                style={dynamicStyles}
                role="tab"
                aria-selected={isActive}
                aria-controls={`code-panel-${tab}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabSelect(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={handleCopy} style={copyButtonStyles}>
          Copy
        </button>
      </div>
      <pre
        id={`code-panel-${activeTab}`}
        role="tabpanel"
        aria-label={`${TAB_LABELS[activeTab]} code example`}
        style={codeBlockStyles}
      >
        <code>{activeSnippet}</code>
      </pre>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            ...toastStyles,
            borderColor:
              toast.intent === 'success' ? 'rgba(74, 222, 128, 0.45)' : 'rgba(248, 113, 113, 0.45)',
            background:
              toast.intent === 'success' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
          }}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
};

export default CodePanel;
