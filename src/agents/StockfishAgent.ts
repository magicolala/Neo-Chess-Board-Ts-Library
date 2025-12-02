import { type ChessGame } from '../core/logic/ChessGame';
import { EventBus } from '../core/EventBus';
import type { EngineLine, EngineScore } from '../engine/types';
import {
  parseInfo,
  parseBestMove,
  buildPositionCommand,
  buildGoCommand,
} from '../engine/UCIProtocol';

/**
 * Interface pour les résultats d'analyse du moteur
 */
export interface EngineAnalysis {
  readonly fen: string;
  readonly depth: number;
  readonly score: EngineScore;
  readonly pv: string[];
  readonly bestMove?: string;
  readonly ponder?: string;
  readonly nodes?: number;
  readonly nps?: number;
  readonly time?: number;
}

/**
 * Map des événements émis par StockfishAgent
 */
export interface StockfishAgentEventMap {
  analysisUpdate: EngineAnalysis;
  error: { message: string; cause?: unknown };
  ready: void;
  [event: string]: unknown;
}

/**
 * Agent Stockfish qui s'abonne aux mises à jour de ChessGame
 * et publie les résultats d'analyse pour la couche UI
 */
export class StockfishAgent {
  private readonly game: ChessGame;
  private readonly bus: EventBus<StockfishAgentEventMap>;
  private worker: Worker | null = null;
  private stockfishPath: string;
  private isReady = false;
  private currentFen: string | null = null;
  private unsubscribeUpdate: (() => void) | null = null;
  private depth: number;

  /**
   * @param gameInstance Instance de ChessGame à surveiller
   * @param stockfishPath Chemin vers le binaire Stockfish (défaut: '/stockfish.js')
   * @param depth Profondeur d'analyse (défaut: 20)
   */
  constructor(
    gameInstance: ChessGame,
    stockfishPath: string = '/stockfish.js',
    depth: number = 20,
  ) {
    this.game = gameInstance;
    this.stockfishPath = stockfishPath;
    this.depth = depth;
    this.bus = new EventBus<StockfishAgentEventMap>();

    // S'abonner aux mises à jour du jeu
    this.unsubscribeUpdate = this.game.bus.on('update', (payload) => {
      this.analyzeNewFen(payload.fen);
    });

    this.initWorker();
  }

  /**
   * S'abonner aux événements de l'agent
   */
  on<K extends keyof StockfishAgentEventMap>(
    event: K,
    handler: (payload: StockfishAgentEventMap[K]) => void,
  ): () => void {
    return this.bus.on(event, handler);
  }

  /**
   * Initialise le Web Worker pour Stockfish
   */
  private initWorker(): void {
    try {
      // Utiliser new URL pour l'intégration Vite
      this.worker = new Worker(new URL('../workers/StockfishWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error: ErrorEvent) => {
        this.bus.emit('error', {
          message: 'Erreur du Worker Stockfish',
          cause: error,
        });
      };

      // Envoyer le chemin Stockfish au worker (optionnel pour l'instant)
      if (this.worker) {
        this.worker.postMessage({
          type: 'init',
          stockfishPath: this.stockfishPath,
        });
      }

      // Initialiser le moteur UCI
      this.sendToWorker('uci');
      this.sendToWorker('isready');
    } catch (error) {
      this.bus.emit('error', {
        message: 'Impossible de créer le Worker Stockfish',
        cause: error,
      });
    }
  }

  /**
   * Envoie un message au Worker
   */
  private sendToWorker(message: string): void {
    if (this.worker) {
      this.worker.postMessage({
        type: 'command',
        command: message,
      });
    }
  }

  /**
   * Gère les messages reçus du Worker
   */
  private handleWorkerMessage(data: unknown): void {
    if (typeof data !== 'object' || data === null) {
      return;
    }

    const message = data as { type: string; content?: string };

    if (message.type === 'output' && typeof message.content === 'string') {
      this.parseUCIOutput(message.content);
    } else if (message.type === 'ready') {
      this.isReady = true;
      this.bus.emit('ready', undefined);
    } else if (message.type === 'error') {
      this.bus.emit('error', {
        message: message.content || 'Erreur inconnue du Worker',
      });
    }
  }

  /**
   * Parse la sortie UCI et émet les résultats d'analyse
   */
  private parseUCIOutput(line: string): void {
    // Parser les lignes 'info'
    const info = parseInfo(line);
    if (info && this.currentFen) {
      const analysis: EngineAnalysis = {
        fen: this.currentFen,
        depth: info.depth,
        score: info.score,
        pv: info.pv,
        nodes: info.nodes,
        nps: info.nps,
        time: info.time,
      };
      this.emitAnalysis(analysis);
    }

    // Parser les lignes 'bestmove'
    const bestMove = parseBestMove(line);
    if (bestMove && this.currentFen) {
      const analysis: EngineAnalysis = {
        fen: this.currentFen,
        depth: 0, // bestmove n'inclut pas de depth
        score: { type: 'cp', value: 0 }, // placeholder
        pv: bestMove.move ? [bestMove.move] : [],
        bestMove: bestMove.move,
        ponder: bestMove.ponder,
      };
      this.emitAnalysis(analysis);
    }

    // Gérer les réponses UCI standard
    if ((line === 'uciok' || line === 'readyok') && !this.isReady) {
      this.isReady = true;
      this.bus.emit('ready', undefined);
    }
  }

  /**
   * Analyse une nouvelle position FEN
   */
  private analyzeNewFen(fen: string): void {
    if (!this.isReady || !this.worker) {
      return;
    }

    this.currentFen = fen;

    // Envoyer les commandes UCI pour analyser la position
    this.sendToWorker('ucinewgame');
    this.sendToWorker(buildPositionCommand(fen));
    this.sendToWorker(buildGoCommand({ depth: this.depth }));
  }

  /**
   * Émet les résultats d'analyse
   */
  private emitAnalysis(analysis: EngineAnalysis): void {
    this.bus.emit('analysisUpdate', analysis);
  }

  /**
   * Arrête l'analyse en cours
   */
  stop(): void {
    if (this.worker) {
      this.sendToWorker('stop');
    }
  }

  /**
   * Définit la profondeur d'analyse
   */
  setDepth(depth: number): void {
    this.depth = depth;
  }

  /**
   * Nettoie les ressources et termine le Worker
   */
  terminate(): void {
    if (this.unsubscribeUpdate) {
      this.unsubscribeUpdate();
      this.unsubscribeUpdate = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.isReady = false;
    this.currentFen = null;
  }
}
