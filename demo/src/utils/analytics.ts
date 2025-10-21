/**
 * Lightweight analytics wrapper used by the playground UI.
 *
 * Required events:
 * - `playground_page_view`: fired when the playground page is viewed (tracked via `trackPageView`).
 * - `playground_theme_switch`: fired whenever the user toggles between themes.
 * - `playground_import_pgn`: fired after a PGN import attempt, alongside metadata about the origin.
 * - `playground_copy_code`: fired when users copy share links, embed snippets, or code samples.
 */
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'playground_page_view',
  THEME_SWITCH: 'playground_theme_switch',
  IMPORT_PGN: 'playground_import_pgn',
  COPY_CODE: 'playground_copy_code',
} as const;

export type PlaygroundAnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface AnalyticsReporter {
  trackEvent?: (eventName: PlaygroundAnalyticsEvent, payload?: Record<string, unknown>) => void;
  trackPageView?: (
    pageName: PlaygroundAnalyticsEvent | string,
    payload?: Record<string, unknown>,
  ) => void;
}

interface AnalyticsConfig {
  enabled: boolean;
  reporter: AnalyticsReporter | null;
  logger: Pick<typeof console, 'info' | 'error'>;
}

let config: AnalyticsConfig = {
  enabled:
    typeof window !== 'undefined' &&
    typeof (window as { __PLAYGROUND_ANALYTICS__?: unknown }).__PLAYGROUND_ANALYTICS__ === 'object',
  reporter:
    typeof window !== 'undefined'
      ? ((window as { __PLAYGROUND_ANALYTICS__?: { reporter?: AnalyticsReporter } })
          .__PLAYGROUND_ANALYTICS__?.reporter ?? null)
      : null,
  logger: console,
};

type ConfigureAnalyticsOptions = Partial<Omit<AnalyticsConfig, 'logger'>> & {
  logger?: AnalyticsConfig['logger'];
};

export const configureAnalytics = (overrides: ConfigureAnalyticsOptions = {}): void => {
  config = {
    enabled: overrides.enabled ?? config.enabled,
    reporter: overrides.reporter ?? config.reporter,
    logger: overrides.logger ?? config.logger,
  };
};

const logFallback = (
  type: 'event' | 'page',
  name: PlaygroundAnalyticsEvent | string,
  payload?: Record<string, unknown>,
): void => {
  const label = type === 'page' ? 'pageview' : 'event';
  config.logger.info(`[analytics disabled] ${label} "${name}"`, payload ?? {});
};

export const trackEvent = (
  eventName: PlaygroundAnalyticsEvent,
  payload?: Record<string, unknown>,
): void => {
  if (!config.enabled || !config.reporter?.trackEvent) {
    logFallback('event', eventName, payload);
    return;
  }

  try {
    config.reporter.trackEvent(eventName, payload);
  } catch (error) {
    config.logger.error('[analytics] trackEvent failed', error);
    logFallback('event', eventName, payload);
  }
};

export const trackPageView = (
  pageName: PlaygroundAnalyticsEvent | string,
  payload?: Record<string, unknown>,
): void => {
  if (!config.enabled || !config.reporter?.trackPageView) {
    logFallback('page', pageName, payload);
    return;
  }

  try {
    config.reporter.trackPageView(pageName, payload);
  } catch (error) {
    config.logger.error('[analytics] trackPageView failed', error);
    logFallback('page', pageName, payload);
  }
};
