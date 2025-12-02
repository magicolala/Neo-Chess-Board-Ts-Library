export * from './core/types';
export * from './core/themes';
export * from './core/EventBus';
export * from './core/LightRules';
export * from './core/ChessJsRules';
export * from './core/PgnNotation';
export * from './core/FlatSprites';
export * from './core/PGN';
export * from './core/utils';
export * from './core/NeoChessBoard';
export * from './core/logic/ChessGame';
export * from './core/errors';
export * from './clock';
export * from './effects/CameraEffects';
export * from './effects/easing';
export * from './effects/types';
export * from './extensions/ArrowHighlightExtension';
export * from './extensions/PromotionDialogExtension';
export * from './extensions/clockExtension';
export * from './extensions/createCameraEffectsExtension';
export * from './extensions/createEngineExtension';
export * from './extensions/createAIPlayerExtension';
export * from './core/extensions/AccessibilityExtension';
export * from './engine/StockfishEngine';
export * from './engine/UCIProtocol';
export * from './engine/types';
// Agents module uses Web Workers and import.meta which is not compatible with Node/Jest ESM transform
// Re-exporting agents from the main index pulls the module into the Node test environment and
// causes TypeScript compile errors (import.meta). Keep agents separate to avoid runtime type errors
// and allow Node-based tests to import core utilities safely. If you need agents in consuming code,
// import directly from 'neo-chess-board/src/agents' or add a browser-only entry point.
// export * from './agents';
export * from './utils/chess960';
