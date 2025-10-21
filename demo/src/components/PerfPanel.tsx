import React, { useCallback, useMemo } from 'react';

interface PerfPanelProps {
  id?: string;
  showFpsBadge: boolean;
  onShowFpsBadgeChange: (next: boolean) => void;
  showDirtyOverlay: boolean;
  onShowDirtyOverlayChange: (next: boolean) => void;
  resizeLoopEnabled: boolean;
  onResizeLoopEnabledChange: (next: boolean) => void;
  resizeIntervalInMs: number;
  onResizeIntervalInMsChange: (next: number) => void;
  resizeAnimationInMs: number;
  onResizeAnimationInMsChange: (next: number) => void;
  resizeMinWidth: number;
  onResizeMinWidthChange: (next: number) => void;
  resizeMaxWidth: number;
  onResizeMaxWidthChange: (next: number) => void;
}

const panelStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const sectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '0.85rem 1rem',
  borderRadius: '0.85rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
};

const sectionTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '0.95rem',
  fontWeight: 600,
  letterSpacing: '0.01em',
  color: 'var(--playground-text)',
};

const sectionDescriptionStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '0.8rem',
  color: 'var(--playground-muted)',
  lineHeight: 1.5,
};

const toggleRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.85rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(99, 102, 241, 0.28)',
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  cursor: 'pointer',
};

const toggleTextBlockStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  flex: '1 1 auto',
};

const toggleTitleStyles: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--playground-text)',
  letterSpacing: '0.01em',
};

const toggleDescriptionStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--playground-muted)',
  lineHeight: 1.4,
};

const checkboxInputStyles: React.CSSProperties = {
  width: '1.25rem',
  height: '1.25rem',
  accentColor: '#6366f1',
};

const sliderContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const sliderHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
};

const sliderValueStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  backgroundColor: 'rgba(99, 102, 241, 0.25)',
  color: 'var(--playground-text)',
};

const rangeInputStyles: React.CSSProperties = {
  width: '100%',
  accentColor: '#6366f1',
};

const numberInputRowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.75rem',
};

const numberInputFieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const numberInputLabelStyles: React.CSSProperties = {
  fontWeight: 600,
  letterSpacing: '0.01em',
  color: 'var(--playground-text)',
  fontSize: '0.85rem',
};

const numberInputDescriptionStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--playground-muted)',
  lineHeight: 1.4,
};

const numberInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  borderRadius: '0.65rem',
  border: '1px solid var(--playground-border)',
  backgroundColor: 'rgba(15, 23, 42, 0.85)',
  color: 'var(--playground-text)',
  fontSize: '0.85rem',
};

const disabledFieldStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

const formatMs = (value: number): string => `${value} ms`;
const formatPx = (value: number): string => `${value} px`;

const PerfPanel: React.FC<PerfPanelProps> = ({
  id,
  showFpsBadge,
  onShowFpsBadgeChange,
  showDirtyOverlay,
  onShowDirtyOverlayChange,
  resizeLoopEnabled,
  onResizeLoopEnabledChange,
  resizeIntervalInMs,
  onResizeIntervalInMsChange,
  resizeAnimationInMs,
  onResizeAnimationInMsChange,
  resizeMinWidth,
  onResizeMinWidthChange,
  resizeMaxWidth,
  onResizeMaxWidthChange,
}) => {
  const handleFpsToggle = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      onShowFpsBadgeChange(event.target.checked);
    },
    [onShowFpsBadgeChange],
  );

  const handleDirtyToggle = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      onShowDirtyOverlayChange(event.target.checked);
    },
    [onShowDirtyOverlayChange],
  );

  const handleResizeToggle = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      onResizeLoopEnabledChange(event.target.checked);
    },
    [onResizeLoopEnabledChange],
  );

  const handleIntervalChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const next = Number.parseInt(event.target.value, 10);
      if (Number.isFinite(next)) {
        onResizeIntervalInMsChange(next);
      }
    },
    [onResizeIntervalInMsChange],
  );

  const handleAnimationChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const next = Number.parseInt(event.target.value, 10);
      if (Number.isFinite(next)) {
        onResizeAnimationInMsChange(next);
      }
    },
    [onResizeAnimationInMsChange],
  );

  const handleMinWidthChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const next = Number.parseInt(event.target.value, 10);
      if (Number.isFinite(next)) {
        onResizeMinWidthChange(next);
      }
    },
    [onResizeMinWidthChange],
  );

  const handleMaxWidthChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const next = Number.parseInt(event.target.value, 10);
      if (Number.isFinite(next)) {
        onResizeMaxWidthChange(next);
      }
    },
    [onResizeMaxWidthChange],
  );

  const minWidthDisplay = useMemo(() => formatPx(resizeMinWidth), [resizeMinWidth]);
  const maxWidthDisplay = useMemo(() => formatPx(resizeMaxWidth), [resizeMaxWidth]);

  return (
    <div id={id} style={panelStyles}>
      <section style={sectionStyles} aria-labelledby={id ? `${id}-instrumentation` : undefined}>
        <div>
          <h3 id={id ? `${id}-instrumentation` : undefined} style={sectionTitleStyles}>
            Instrumentation
          </h3>
          <p style={sectionDescriptionStyles}>
            Toggle lightweight diagnostics that surface rendering performance feedback while the
            playground is running.
          </p>
        </div>
        <label style={toggleRowStyles}>
          <span style={toggleTextBlockStyles}>
            <span style={toggleTitleStyles}>Show FPS badge</span>
            <span style={toggleDescriptionStyles}>
              Overlay a live frame-rate badge in the upper-left corner of the board.
            </span>
          </span>
          <input
            type="checkbox"
            style={checkboxInputStyles}
            checked={showFpsBadge}
            onChange={handleFpsToggle}
          />
        </label>
        <label style={toggleRowStyles}>
          <span style={toggleTextBlockStyles}>
            <span style={toggleTitleStyles}>Highlight dirty rectangles</span>
            <span style={toggleDescriptionStyles}>
              Visualize the regions of the canvas that re-render during animations.
            </span>
          </span>
          <input
            type="checkbox"
            style={checkboxInputStyles}
            checked={showDirtyOverlay}
            onChange={handleDirtyToggle}
          />
        </label>
      </section>

      <section style={sectionStyles} aria-labelledby={id ? `${id}-stress` : undefined}>
        <div>
          <h3 id={id ? `${id}-stress` : undefined} style={sectionTitleStyles}>
            Stress test resize loop
          </h3>
          <p style={sectionDescriptionStyles}>
            Fine-tune the oscillating resize cycle that runs during the automated stress test.
          </p>
        </div>

        <label style={toggleRowStyles}>
          <span style={toggleTextBlockStyles}>
            <span style={toggleTitleStyles}>Enable resize loop</span>
            <span style={toggleDescriptionStyles}>
              When disabled, the stress test keeps the board at its original size.
            </span>
          </span>
          <input
            type="checkbox"
            style={checkboxInputStyles}
            checked={resizeLoopEnabled}
            onChange={handleResizeToggle}
          />
        </label>

        <div style={sliderContainerStyles}>
          <div style={sliderHeaderStyles}>
            <span style={toggleTitleStyles}>Interval between resizes</span>
            <span style={sliderValueStyles}>{formatMs(resizeIntervalInMs)}</span>
          </div>
          <input
            type="range"
            min={120}
            max={1500}
            step={20}
            value={resizeIntervalInMs}
            onChange={handleIntervalChange}
            style={rangeInputStyles}
            disabled={!resizeLoopEnabled}
          />
        </div>

        <div style={sliderContainerStyles}>
          <div style={sliderHeaderStyles}>
            <span style={toggleTitleStyles}>Resize animation duration</span>
            <span style={sliderValueStyles}>{formatMs(resizeAnimationInMs)}</span>
          </div>
          <input
            type="range"
            min={60}
            max={600}
            step={10}
            value={resizeAnimationInMs}
            onChange={handleAnimationChange}
            style={rangeInputStyles}
            disabled={!resizeLoopEnabled}
          />
        </div>

        <div style={numberInputRowStyles}>
          <label style={numberInputFieldStyles}>
            <span style={numberInputLabelStyles}>Minimum width</span>
            <span style={numberInputDescriptionStyles}>
              Smallest board dimension reached during the loop.
            </span>
            <input
              type="number"
              inputMode="numeric"
              style={{
                ...numberInputStyles,
                ...(resizeLoopEnabled ? null : disabledFieldStyles),
              }}
              min={280}
              max={resizeMaxWidth}
              step={10}
              value={resizeMinWidth}
              onChange={handleMinWidthChange}
              disabled={!resizeLoopEnabled}
              aria-describedby={id ? `${id}-min-width-display` : undefined}
            />
            <span
              id={id ? `${id}-min-width-display` : undefined}
              style={numberInputDescriptionStyles}
            >
              {minWidthDisplay}
            </span>
          </label>

          <label style={numberInputFieldStyles}>
            <span style={numberInputLabelStyles}>Maximum width</span>
            <span style={numberInputDescriptionStyles}>
              Largest board dimension reached during the loop.
            </span>
            <input
              type="number"
              inputMode="numeric"
              style={{
                ...numberInputStyles,
                ...(resizeLoopEnabled ? null : disabledFieldStyles),
              }}
              min={resizeMinWidth}
              max={640}
              step={10}
              value={resizeMaxWidth}
              onChange={handleMaxWidthChange}
              disabled={!resizeLoopEnabled}
              aria-describedby={id ? `${id}-max-width-display` : undefined}
            />
            <span
              id={id ? `${id}-max-width-display` : undefined}
              style={numberInputDescriptionStyles}
            >
              {maxWidthDisplay}
            </span>
          </label>
        </div>
      </section>
    </div>
  );
};

export default PerfPanel;
