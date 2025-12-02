export type EngineScoreType = 'cp' | 'mate';

export interface EngineScore {
  readonly type: EngineScoreType;
  readonly value: number;
}

export interface EngineOptionMap {
  readonly skillLevel?: number;
  readonly elo?: number;
  readonly depth?: number;
  readonly multiPv?: number;
  readonly threads?: number;
  readonly hash?: number;
  readonly wasmUrl?: string;
  readonly moves?: string[];
  readonly debug?: boolean;
  readonly variant?: 'standard' | 'chess960';
}

export interface EngineAnalysisRequest {
  readonly fen: string;
  readonly depth?: number;
  readonly movetimeMs?: number;
  readonly multiPv?: number;
  readonly limitMoves?: string[];
}

export interface EngineLine {
  readonly id: number;
  readonly depth: number;
  readonly score: EngineScore;
  readonly pv: string[];
  readonly nodes?: number;
  readonly nps?: number;
  readonly time?: number;
}

export interface EngineAnalysisResult {
  readonly fen: string;
  readonly lines: EngineLine[];
  readonly bestMove?: string;
  readonly ponder?: string;
}

export interface EngineReadyEvent {
  readonly options: EngineOptionMap;
}

export interface EngineErrorEvent {
  readonly message: string;
  readonly cause?: unknown;
}

export interface EngineBestMoveEvent {
  readonly move: string;
  readonly ponder?: string;
  readonly fen: string;
}

export interface EngineStoppedEvent {
  readonly reason?: string;
}

export interface EngineEventMap {
  ready: EngineReadyEvent;
  info: EngineLine;
  result: EngineAnalysisResult;
  bestmove: EngineBestMoveEvent;
  error: EngineErrorEvent;
  stopped: EngineStoppedEvent;
  [event: string]: unknown;
}

export type EngineEventName = keyof EngineEventMap;

export interface EngineTransport {
  postMessage(message: string): void;
  terminate(): void;
  onMessage(callback: (message: string) => void): void;
  onError(callback: (error: ErrorEvent | MessageEvent) => void): void;
}

export interface EngineCreateOptions extends EngineOptionMap {
  readonly transportFactory?: () => EngineTransport;
  readonly throttleMs?: number;
  readonly stopTimeoutMs?: number;
}
