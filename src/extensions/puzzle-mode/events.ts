import type {
  PuzzleEventPayload,
  PuzzleEventType,
  PuzzleModeConfig,
  PuzzleTelemetryEvent,
} from './types';

export function emitPuzzleTelemetry<N extends PuzzleEventType>(
  config: PuzzleModeConfig | undefined,
  event: N,
  payload: PuzzleEventPayload<N>,
): void {
  if (!config) {
    return;
  }

  const telemetryEvent: PuzzleTelemetryEvent<N> = {
    type: event,
    payload,
  };

  if (config.onPuzzleEvent) {
    try {
      config.onPuzzleEvent(telemetryEvent);
    } catch (error) {
      console.error('[PuzzleMode] onPuzzleEvent handler failed', error);
    }
  }

  if (config.onEvent) {
    try {
      config.onEvent(event, payload);
    } catch (error) {
      console.error('[PuzzleMode] onEvent handler failed', error);
    }
  }
}
