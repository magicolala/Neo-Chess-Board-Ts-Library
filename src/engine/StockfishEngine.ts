import { Chess } from 'chess.js';
import { EventBus } from '../core/EventBus';
import {
  buildGoCommand,
  buildPositionCommand,
  buildUciCommand,
  parseBestMove,
  parseInfo,
} from './UCIProtocol';
import type {
  EngineAnalysisRequest,
  EngineAnalysisResult,
  EngineCreateOptions,
  EngineEventMap,
  EngineLine,
  EngineTransport,
} from './types';

const DEFAULT_THROTTLE_MS = 150;
const DEFAULT_STOP_TIMEOUT_MS = 1500;
const DEFAULT_MOVETIME_MS = 500;

class MockStockfishTransport implements EngineTransport {
  private listeners: Array<(message: string) => void> = [];
  private errorListeners: Array<(error: ErrorEvent | MessageEvent) => void> = [];
  private fen: string = 'startpos';
  private disposed = false;

  onMessage(callback: (message: string) => void): void {
    this.listeners.push(callback);
  }

  onError(callback: (error: ErrorEvent | MessageEvent) => void): void {
    this.errorListeners.push(callback);
  }

  postMessage(message: string): void {
    if (this.disposed) return;
    this.handleMessage(message).catch((error) => {
      this.errorListeners.forEach((listener) =>
        listener(new MessageEvent('error', { data: error })),
      );
    });
  }

  terminate(): void {
    this.disposed = true;
    this.listeners = [];
    this.errorListeners = [];
  }

  private async handleMessage(message: string): Promise<void> {
    const [command] = message.split(' ');
    if (command === 'uci') {
      this.emit('id name mock-stockfish');
      this.emit('uciok');
      return;
    }
    if (command === 'isready') {
      this.emit('readyok');
      return;
    }
    if (command === 'position') {
      const fenIndex = message.indexOf('fen');
      if (fenIndex !== -1) {
        this.fen = message.slice(fenIndex + 4).trim();
      }
      return;
    }
    if (command === 'go') {
      await this.simulateSearch();
      return;
    }
    if (command === 'stop') {
      this.emit('bestmove 0000');
    }
  }

  private async simulateSearch(): Promise<void> {
    const chess = new Chess(this.fen);
    const moves = chess.moves({ verbose: true });
    const best = moves[0];
    const moveString = best ? `${best.from}${best.to}${best.promotion ?? ''}` : '0000';
    const score = this.evaluateMaterial(chess);
    const infoLine = `info depth 12 score cp ${score} pv ${moveString}`;
    await new Promise((resolve) => setTimeout(resolve, 30));
    this.emit(infoLine);
    await new Promise((resolve) => setTimeout(resolve, 40));
    this.emit(`bestmove ${moveString}`);
  }

  private evaluateMaterial(chess: Chess): number {
    const values: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    let score = 0;
    chess.board().forEach((rank) => {
      rank.forEach((piece) => {
        if (!piece) return;
        const value = values[piece.type];
        score += piece.color === 'w' ? value : -value;
      });
    });
    return score;
  }

  private emit(message: string): void {
    this.listeners.forEach((listener) => listener(message));
  }
}

export class StockfishEngine {
  private readonly bus = new EventBus<EngineEventMap>();
  private readonly options: EngineCreateOptions;
  private transport: EngineTransport | null = null;
  private ready = false;
  private currentRequest: EngineAnalysisRequest | null = null;
  private latestLines = new Map<number, EngineLine>();
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEmit = 0;

  constructor(options: EngineCreateOptions = {}) {
    this.options = options;
  }

  async init(): Promise<void> {
    if (this.ready && this.transport) return;
    this.transport = (this.options.transportFactory ?? (() => new MockStockfishTransport()))();
    this.transport.onMessage((message) => this.handleMessage(message));
    this.transport.onError((error) => {
      this.bus.emit('error', { message: 'Engine transport error', cause: error });
    });
    await new Promise<void>((resolve) => {
      const dispose = this.on('ready', () => {
        dispose();
        resolve();
      });
      this.transport?.postMessage('uci');
      this.transport?.postMessage('isready');
    });
  }

  on<K extends keyof EngineEventMap>(
    event: K,
    handler: (payload: EngineEventMap[K]) => void,
  ): () => void {
    return this.bus.on(event, handler);
  }

  setOption(name: string, value: string | number | boolean): void {
    this.transport?.postMessage(buildUciCommand('setoption name', name, 'value', value));
  }

  async analyze(request: EngineAnalysisRequest): Promise<EngineAnalysisResult> {
    await this.init();
    this.currentRequest = request;
    this.latestLines.clear();

    const depth = request.depth ?? this.options.depth;
    const movetimeMs =
      request.movetimeMs ?? (depth === undefined ? DEFAULT_MOVETIME_MS : undefined);
    const multiPv = request.multiPv ?? this.options.multiPv;

    this.transport?.postMessage(buildPositionCommand(request.fen, request.limitMoves));
    this.transport?.postMessage(
      buildGoCommand({
        depth,
        movetimeMs,
        multiPv,
      }),
    );

    return new Promise<EngineAnalysisResult>((resolve, reject) => {
      const disposeError = this.on('error', (err) => {
        disposeAll();
        reject(new Error(err.message));
      });
      const disposeResult = this.on('bestmove', (payload) => {
        disposeAll();
        resolve(this.buildResult(payload.move, payload.ponder));
      });
      const stopGuard = setTimeout(() => {
        disposeAll();
        reject(new Error('Engine timeout'));
      }, this.options.stopTimeoutMs ?? DEFAULT_STOP_TIMEOUT_MS);

      const disposeAll = () => {
        clearTimeout(stopGuard);
        disposeError();
        disposeResult();
      };
    });
  }

  async getBestMove(fen: string, movetimeMs?: number): Promise<string | null> {
    const result = await this.analyze({ fen, movetimeMs, multiPv: 1 });
    return result.bestMove ?? null;
  }

  stop(reason?: string): void {
    this.transport?.postMessage('stop');
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => {
      this.bus.emit('stopped', { reason });
    }, this.options.stopTimeoutMs ?? DEFAULT_STOP_TIMEOUT_MS);
  }

  terminate(): void {
    this.transport?.terminate();
    this.transport = null;
    this.ready = false;
  }

  private handleMessage(message: string): void {
    if (message === 'uciok' || message === 'readyok') {
      if (!this.ready) {
        this.ready = true;
        this.bus.emit('ready', { options: { ...this.options } });
      }
      return;
    }

    const info = parseInfo(message);
    if (info) {
      this.latestLines.set(info.id, info);
      const now = Date.now();
      if (now - this.lastEmit >= (this.options.throttleMs ?? DEFAULT_THROTTLE_MS)) {
        this.lastEmit = now;
        this.bus.emit('info', info);
        this.bus.emit('result', this.buildResult());
      }
      return;
    }

    const bestMove = parseBestMove(message);
    if (bestMove && this.currentRequest) {
      const payload = {
        move: bestMove.move,
        ponder: bestMove.ponder,
        fen: this.currentRequest.fen,
      };
      this.bus.emit('bestmove', payload);
      this.bus.emit('result', this.buildResult(bestMove.move, bestMove.ponder));
    }
  }

  private buildResult(bestMove?: string, ponder?: string): EngineAnalysisResult {
    const lines = [...this.latestLines.values()].sort((a, b) => a.id - b.id);
    return {
      fen: this.currentRequest?.fen ?? '',
      lines,
      bestMove,
      ponder,
    };
  }
}
