import {
  PLAYGROUND_DEFAULT_STATE,
  type PlaygroundState,
  type ThemeName,
} from '../state/playgroundStore';
import { playgroundThemeMetadata } from '../themes/customThemes';
import { playgroundPieceSets } from '../pieces';

export type PlaygroundOrientation = 'white' | 'black';

const DEFAULT_ORIENTATION: PlaygroundOrientation = 'white';

const PARAM_KEYS = {
  orientation: 'o',
  theme: 'theme',
  pieceSet: 'pieces',
  showCoordinates: 'coords',
  highlightLegal: 'highlight',
  interactive: 'interactive',
  autoFlip: 'flip',
  allowDrawingArrows: 'arrows',
  animationDurationInMs: 'anim',
  dragActivationDistance: 'drag',
  promotionUi: 'promo',
  autoQueen: 'autoq',
  fen: 'fen',
} as const;

const VALID_THEMES = new Set<ThemeName>(playgroundThemeMetadata.map((theme) => theme.id));
const VALID_PIECE_SETS = new Set<string>(playgroundPieceSets.map((pieceSet) => pieceSet.id));

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
  state.pieceSetId === PLAYGROUND_DEFAULT_STATE.pieceSetId &&
  state.showCoordinates === PLAYGROUND_DEFAULT_STATE.showCoordinates &&
  state.highlightLegal === PLAYGROUND_DEFAULT_STATE.highlightLegal &&
  state.interactive === PLAYGROUND_DEFAULT_STATE.interactive &&
  state.autoFlip === PLAYGROUND_DEFAULT_STATE.autoFlip &&
  state.allowDrawingArrows === PLAYGROUND_DEFAULT_STATE.allowDrawingArrows &&
  state.animationDurationInMs === PLAYGROUND_DEFAULT_STATE.animationDurationInMs &&
  state.dragActivationDistance === PLAYGROUND_DEFAULT_STATE.dragActivationDistance &&
  state.promotionUi === PLAYGROUND_DEFAULT_STATE.promotionUi &&
  state.autoQueen === PLAYGROUND_DEFAULT_STATE.autoQueen;

export interface PlaygroundPermalinkPayload {
  orientation: PlaygroundOrientation;
  state: PlaygroundState;
  fen?: string;
}

export interface PlaygroundPermalinkSnapshot {
  orientation?: PlaygroundOrientation;
  state?: Partial<PlaygroundState>;
  fen?: string;
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

  if (payload.state.pieceSetId !== PLAYGROUND_DEFAULT_STATE.pieceSetId) {
    params.set(PARAM_KEYS.pieceSet, payload.state.pieceSetId);
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

  if (payload.state.promotionUi !== PLAYGROUND_DEFAULT_STATE.promotionUi) {
    params.set(PARAM_KEYS.promotionUi, payload.state.promotionUi);
  }

  if (payload.state.autoQueen !== PLAYGROUND_DEFAULT_STATE.autoQueen) {
    params.set(PARAM_KEYS.autoQueen, encodeBoolean(payload.state.autoQueen));
  }

  if (typeof payload.fen === 'string' && payload.fen.trim().length > 0) {
    params.set(PARAM_KEYS.fen, payload.fen.trim());
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

  const pieceSet = params.get(PARAM_KEYS.pieceSet);
  if (pieceSet && VALID_PIECE_SETS.has(pieceSet)) {
    state.pieceSetId = pieceSet;
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

  const promotionUi = params.get(PARAM_KEYS.promotionUi);
  if (promotionUi === 'inline' || promotionUi === 'dialog') {
    state.promotionUi = promotionUi;
    hasState = true;
  }

  const autoQueen = parseBooleanParam(params.get(PARAM_KEYS.autoQueen));
  if (typeof autoQueen === 'boolean') {
    state.autoQueen = autoQueen;
    hasState = true;
  }

  if (hasState) {
    snapshot.state = state;
  }

  const fen = params.get(PARAM_KEYS.fen);
  if (typeof fen === 'string' && fen.trim().length > 0) {
    snapshot.fen = fen.trim();
  }

  return snapshot;
};

export const syncPlaygroundPermalink = (payload: PlaygroundPermalinkPayload): void => {
  if (globalThis.window === undefined) {
    return;
  }

  const params = serializePlaygroundPermalink(payload);
  const query = params.toString();
  const hash = globalThis.location.hash ?? '';
  const queryString = query ? `?${query}` : '';
  const url = `${globalThis.location.pathname}${queryString}${hash}`;

  globalThis.history.replaceState(null, '', url);
};

export const clearPlaygroundPermalink = (): void => {
  if (globalThis.window === undefined) {
    return;
  }

  const hash = globalThis.location.hash ?? '';
  globalThis.history.replaceState(null, '', `${globalThis.location.pathname}${hash}`);
};

export const isDefaultPlaygroundPermalink = (payload: PlaygroundPermalinkPayload): boolean =>
  payload.orientation === DEFAULT_ORIENTATION && isDefaultState(payload.state);

export { DEFAULT_ORIENTATION };
