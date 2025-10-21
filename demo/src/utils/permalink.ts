import {
  PLAYGROUND_DEFAULT_STATE,
  type PlaygroundState,
  type ThemeName,
} from '../state/playgroundStore';
import { playgroundThemeMetadata } from '../themes/customThemes';

export type PlaygroundOrientation = 'white' | 'black';

const DEFAULT_ORIENTATION: PlaygroundOrientation = 'white';

const PARAM_KEYS = {
  orientation: 'o',
  theme: 'theme',
  showCoordinates: 'coords',
  highlightLegal: 'highlight',
  interactive: 'interactive',
  autoFlip: 'flip',
  allowDrawingArrows: 'arrows',
  animationDurationInMs: 'anim',
  dragActivationDistance: 'drag',
} as const;

const VALID_THEMES = new Set<ThemeName>(playgroundThemeMetadata.map((theme) => theme.id));

const encodeBoolean = (value: boolean): string => (value ? '1' : '0');

const parseBooleanParam = (value: string | null): boolean | undefined => {
  if (value === null) {
    return undefined;
  }

  if (value === '1' || value.toLowerCase() === 'true') {
    return true;
  }

  if (value === '0' || value.toLowerCase() === 'false') {
    return false;
  }

  return undefined;
};

const parseNumberParam = (value: string | null): number | undefined => {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const encodeOrientation = (orientation: PlaygroundOrientation): string =>
  orientation === 'white' ? 'w' : 'b';

const parseOrientationParam = (value: string | null): PlaygroundOrientation | undefined => {
  if (value === null) {
    return undefined;
  }

  if (value === 'white' || value === 'black') {
    return value;
  }

  if (value === 'w') {
    return 'white';
  }

  if (value === 'b') {
    return 'black';
  }

  return undefined;
};

const isDefaultState = (state: PlaygroundState): boolean =>
  state.theme === PLAYGROUND_DEFAULT_STATE.theme &&
  state.showCoordinates === PLAYGROUND_DEFAULT_STATE.showCoordinates &&
  state.highlightLegal === PLAYGROUND_DEFAULT_STATE.highlightLegal &&
  state.interactive === PLAYGROUND_DEFAULT_STATE.interactive &&
  state.autoFlip === PLAYGROUND_DEFAULT_STATE.autoFlip &&
  state.allowDrawingArrows === PLAYGROUND_DEFAULT_STATE.allowDrawingArrows &&
  state.animationDurationInMs === PLAYGROUND_DEFAULT_STATE.animationDurationInMs &&
  state.dragActivationDistance === PLAYGROUND_DEFAULT_STATE.dragActivationDistance;

export interface PlaygroundPermalinkPayload {
  orientation: PlaygroundOrientation;
  state: PlaygroundState;
}

export interface PlaygroundPermalinkSnapshot {
  orientation?: PlaygroundOrientation;
  state?: Partial<PlaygroundState>;
}

export const serializePlaygroundPermalink = (
  payload: PlaygroundPermalinkPayload,
): URLSearchParams => {
  const params = new URLSearchParams();

  if (payload.orientation !== DEFAULT_ORIENTATION) {
    params.set(PARAM_KEYS.orientation, encodeOrientation(payload.orientation));
  }

  if (payload.state.theme !== PLAYGROUND_DEFAULT_STATE.theme) {
    params.set(PARAM_KEYS.theme, payload.state.theme);
  }

  if (payload.state.showCoordinates !== PLAYGROUND_DEFAULT_STATE.showCoordinates) {
    params.set(PARAM_KEYS.showCoordinates, encodeBoolean(payload.state.showCoordinates));
  }

  if (payload.state.highlightLegal !== PLAYGROUND_DEFAULT_STATE.highlightLegal) {
    params.set(PARAM_KEYS.highlightLegal, encodeBoolean(payload.state.highlightLegal));
  }

  if (payload.state.interactive !== PLAYGROUND_DEFAULT_STATE.interactive) {
    params.set(PARAM_KEYS.interactive, encodeBoolean(payload.state.interactive));
  }

  if (payload.state.autoFlip !== PLAYGROUND_DEFAULT_STATE.autoFlip) {
    params.set(PARAM_KEYS.autoFlip, encodeBoolean(payload.state.autoFlip));
  }

  if (payload.state.allowDrawingArrows !== PLAYGROUND_DEFAULT_STATE.allowDrawingArrows) {
    params.set(PARAM_KEYS.allowDrawingArrows, encodeBoolean(payload.state.allowDrawingArrows));
  }

  if (payload.state.animationDurationInMs !== PLAYGROUND_DEFAULT_STATE.animationDurationInMs) {
    params.set(PARAM_KEYS.animationDurationInMs, String(payload.state.animationDurationInMs));
  }

  if (payload.state.dragActivationDistance !== PLAYGROUND_DEFAULT_STATE.dragActivationDistance) {
    params.set(PARAM_KEYS.dragActivationDistance, String(payload.state.dragActivationDistance));
  }

  return params;
};

export const parsePlaygroundPermalink = (search: string): PlaygroundPermalinkSnapshot => {
  const snapshot: PlaygroundPermalinkSnapshot = {};

  if (!search) {
    return snapshot;
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const orientation = parseOrientationParam(params.get(PARAM_KEYS.orientation));
  if (orientation) {
    snapshot.orientation = orientation;
  }

  const state: Partial<PlaygroundState> = {};
  let hasState = false;

  const theme = params.get(PARAM_KEYS.theme);
  if (theme && VALID_THEMES.has(theme as ThemeName)) {
    state.theme = theme as ThemeName;
    hasState = true;
  }

  const showCoordinates = parseBooleanParam(params.get(PARAM_KEYS.showCoordinates));
  if (typeof showCoordinates === 'boolean') {
    state.showCoordinates = showCoordinates;
    hasState = true;
  }

  const highlightLegal = parseBooleanParam(params.get(PARAM_KEYS.highlightLegal));
  if (typeof highlightLegal === 'boolean') {
    state.highlightLegal = highlightLegal;
    hasState = true;
  }

  const interactive = parseBooleanParam(params.get(PARAM_KEYS.interactive));
  if (typeof interactive === 'boolean') {
    state.interactive = interactive;
    hasState = true;
  }

  const autoFlip = parseBooleanParam(params.get(PARAM_KEYS.autoFlip));
  if (typeof autoFlip === 'boolean') {
    state.autoFlip = autoFlip;
    hasState = true;
  }

  const allowDrawingArrows = parseBooleanParam(params.get(PARAM_KEYS.allowDrawingArrows));
  if (typeof allowDrawingArrows === 'boolean') {
    state.allowDrawingArrows = allowDrawingArrows;
    hasState = true;
  }

  const animationDurationInMs = parseNumberParam(params.get(PARAM_KEYS.animationDurationInMs));
  if (typeof animationDurationInMs === 'number') {
    state.animationDurationInMs = animationDurationInMs;
    hasState = true;
  }

  const dragActivationDistance = parseNumberParam(params.get(PARAM_KEYS.dragActivationDistance));
  if (typeof dragActivationDistance === 'number') {
    state.dragActivationDistance = dragActivationDistance;
    hasState = true;
  }

  if (hasState) {
    snapshot.state = state;
  }

  return snapshot;
};

export const syncPlaygroundPermalink = (payload: PlaygroundPermalinkPayload): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const params = serializePlaygroundPermalink(payload);
  const query = params.toString();
  const hash = window.location.hash ?? '';
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${hash}`;

  window.history.replaceState(null, '', url);
};

export const clearPlaygroundPermalink = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const hash = window.location.hash ?? '';
  window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
};

export const isDefaultPlaygroundPermalink = (payload: PlaygroundPermalinkPayload): boolean =>
  payload.orientation === DEFAULT_ORIENTATION && isDefaultState(payload.state);

export { DEFAULT_ORIENTATION };
