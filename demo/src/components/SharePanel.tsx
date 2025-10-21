import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlaygroundState } from '../state/playgroundStore';
import { serializePlaygroundPermalink, type PlaygroundOrientation } from '../utils/permalink';
import { ANALYTICS_EVENTS, trackEvent } from '../utils/analytics';

export interface SharePanelProps {
  orientation: PlaygroundOrientation;
  state: PlaygroundState;
  fen?: string | null;
  shareUrl?: string | null;
  onCopy?: (value: string) => Promise<boolean> | boolean;
}

type CopyIntent = 'iframe' | 'link';

type CopyStatus = {
  intent: CopyIntent;
  success: boolean;
};

const FALLBACK_PLAYGROUND_URL = 'https://neo-chess-board.vercel.app/playground';

const fallbackCopyToClipboard = async (value: string): Promise<boolean> => {
  if (!value) {
    return false;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.error(error);
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const buildBaseUrl = (query: string): string => {
  if (typeof window === 'undefined') {
    return query ? `${FALLBACK_PLAYGROUND_URL}?${query}` : FALLBACK_PLAYGROUND_URL;
  }

  const url = new URL(window.location.href);
  url.search = query;
  url.hash = '';
  return url.toString();
};

const SharePanel: React.FC<SharePanelProps> = ({ orientation, state, fen, shareUrl, onCopy }) => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const permalinkParams = useMemo(
    () =>
      serializePlaygroundPermalink({
        orientation,
        state,
        fen: typeof fen === 'string' && fen.trim().length > 0 ? fen : undefined,
      }),
    [orientation, state, fen],
  );

  const resolvedShareUrl = useMemo(() => {
    if (shareUrl) {
      return shareUrl;
    }

    return buildBaseUrl(permalinkParams.toString());
  }, [shareUrl, permalinkParams]);

  const embedUrl = useMemo(() => {
    const embedParams = new URLSearchParams(permalinkParams);
    embedParams.set('embed', '1');
    return buildBaseUrl(embedParams.toString());
  }, [permalinkParams]);

  const iframeSnippet = useMemo(
    () =>
      [
        '<iframe',
        `  src="${embedUrl}"`,
        '  title="NeoChessBoard Playground"',
        '  style="border:0; width:100%; aspect-ratio: 1;"',
        '  loading="lazy"',
        '  allow="fullscreen"',
        '></iframe>',
      ].join('\n'),
    [embedUrl],
  );

  const handleCopy = useCallback(
    async (value: string, intent: CopyIntent) => {
      const copyFn = onCopy ?? fallbackCopyToClipboard;
      if (!value) {
        setCopyStatus({ intent, success: false });
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          setCopyStatus(null);
        }, 2400);
        trackEvent(ANALYTICS_EVENTS.COPY_CODE, {
          intent,
          success: false,
          source: 'share-panel',
          reason: 'empty-value',
        });
        return;
      }

      let success = false;
      try {
        const result = await copyFn(value);
        success = result !== false;
      } catch (error) {
        console.error(error);
        success = false;
      }

      setCopyStatus({ intent, success });
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopyStatus(null);
      }, 2400);
      trackEvent(ANALYTICS_EVENTS.COPY_CODE, {
        intent,
        success,
        source: 'share-panel',
      });
    },
    [onCopy],
  );

  const renderCopyToast = () => {
    if (!copyStatus) {
      return null;
    }

    const messages: Record<CopyIntent, { success: string; failure: string }> = {
      iframe: {
        success: 'Embed snippet copied to clipboard',
        failure: 'Unable to copy embed snippet',
      },
      link: {
        success: 'Share link copied to clipboard',
        failure: 'Unable to copy share link',
      },
    };

    const intentMessages = messages[copyStatus.intent];
    const message = copyStatus.success ? intentMessages.success : intentMessages.failure;
    const intentClass = copyStatus.success
      ? 'playground__share-toast--success'
      : 'playground__share-toast--error';

    return (
      <div className={`playground__share-toast ${intentClass}`} role="status" aria-live="polite">
        {message}
      </div>
    );
  };

  return (
    <div className="playground__share-panel">
      {resolvedShareUrl ? (
        <section className="playground__share-section" aria-label="Share link">
          <div className="playground__share-header">
            <h3 className="playground__share-title">Share link</h3>
            <button
              type="button"
              className="playground__share-copy-button"
              onClick={() => {
                void handleCopy(resolvedShareUrl, 'link');
              }}
            >
              Copy link
            </button>
          </div>
          <p className="playground__share-description">
            Send this URL to share the current board configuration with collaborators.
          </p>
          <div className="playground__share-value" tabIndex={0} role="textbox" aria-readonly="true">
            {resolvedShareUrl}
          </div>
        </section>
      ) : null}

      <section className="playground__share-section" aria-label="Embed snippet">
        <div className="playground__share-header">
          <h3 className="playground__share-title">Embed</h3>
          <button
            type="button"
            className="playground__share-copy-button"
            onClick={() => {
              void handleCopy(iframeSnippet, 'iframe');
            }}
          >
            Copy snippet
          </button>
        </div>
        <p className="playground__share-description">
          Use the following <code>&lt;iframe&gt;</code> snippet to embed this board with the current
          options.
        </p>
        <pre className="playground__share-code" aria-label="Embed iframe snippet">
          {iframeSnippet}
        </pre>
      </section>

      {renderCopyToast()}
    </div>
  );
};

export default SharePanel;
