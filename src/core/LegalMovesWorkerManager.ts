/**
 * Manager pour gérer le Web Worker de calcul des coups légaux
 *
 * Fournit une API asynchrone pour calculer les coups légaux sans bloquer le thread principal
 */

import type { Move, Square } from './types';
import type {
  LegalMovesWorkerMessage,
  LegalMovesWorkerResponse,
} from '../workers/LegalMovesWorker';

export interface LegalMovesWorkerManagerOptions {
  /**
   * Délai d'attente maximum pour une requête (en ms)
   * @default 5000
   */
  timeout?: number;
}

export class LegalMovesWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (moves: Move[]) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  private requestIdCounter = 0;
  private readonly timeout: number;

  constructor(options: LegalMovesWorkerManagerOptions = {}) {
    this.timeout = options.timeout ?? 5000;
    this.initWorker();
  }

  /**
   * Initialise le Web Worker
   */
  private initWorker(): void {
    try {
      this.worker = new Worker(
        new URL('../workers/LegalMovesWorker.ts', import.meta.url),
        { type: 'module' },
      );

      this.worker.addEventListener('message', (event: MessageEvent<LegalMovesWorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      });

      this.worker.addEventListener('error', (error: ErrorEvent) => {
        console.error('LegalMovesWorker error:', error);
        // Rejeter toutes les requêtes en attente
        for (const [_id, request] of this.pendingRequests.entries()) {
          clearTimeout(request.timeout);
          request.reject(new Error(`Worker error: ${error.message}`));
        }
        this.pendingRequests.clear();
      });
    } catch (error) {
      console.error('Failed to initialize LegalMovesWorker:', error);
      this.worker = null;
    }
  }

  /**
   * Gère les messages reçus du Worker
   */
  private handleWorkerMessage(data: LegalMovesWorkerResponse): void {
    const request = data.id ? this.pendingRequests.get(data.id) : null;

    if (!request) {
      return;
    }

    clearTimeout(request.timeout);
    this.pendingRequests.delete(data.id!);

    if (data.type === 'success' && data.moves) {
      request.resolve(data.moves);
    } else {
      request.reject(new Error(data.error || 'Unknown error from worker'));
    }
  }

  /**
   * Envoie une requête au Worker et retourne une Promise
   */
  private sendRequest(
    message: Omit<LegalMovesWorkerMessage, 'id'>,
  ): Promise<Move[]> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const id = `req_${this.requestIdCounter++}_${Date.now()}`;
    const requestMessage: LegalMovesWorkerMessage = { ...message, id };

    return new Promise<Move[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.worker!.postMessage(requestMessage);
    });
  }

  /**
   * Calcule tous les coups légaux depuis une position FEN
   */
  async calculateAllMoves(fen: string): Promise<Move[]> {
    return this.sendRequest({
      type: 'calculateAllMoves',
      fen,
    });
  }

  /**
   * Calcule les coups légaux d'une pièce spécifique
   */
  async calculateMovesFrom(fen: string, square: Square): Promise<Move[]> {
    return this.sendRequest({
      type: 'calculateMovesFrom',
      fen,
      square,
    });
  }

  /**
   * Calcule les coups légaux de manière approfondie
   */
  async calculateDeep(
    fen: string,
    options?: { includeAllPieces?: boolean },
  ): Promise<Move[]> {
    return this.sendRequest({
      type: 'calculateDeep',
      fen,
      options,
    });
  }

  /**
   * Vérifie si le Worker est disponible
   */
  isAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * Nettoie les ressources et termine le Worker
   */
  terminate(): void {
    // Annuler toutes les requêtes en attente
    for (const [_id, request] of this.pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error('Worker terminated'));
    }
    this.pendingRequests.clear();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

