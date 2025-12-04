/**
 * Manager pour gérer le Web Worker de parsing PGN
 *
 * Fournit une API asynchrone pour parser les fichiers PGN sans bloquer le thread principal
 */

import type {
  PgnParserWorkerMessage,
  PgnParserWorkerResponse,
  ParsedPgnResult,
} from '../workers/PgnParserWorker';

type ParsedPgnWorkerResult = ParsedPgnResult | ParsedPgnResult[] | boolean;

export interface PgnParserWorkerManagerOptions {
  /**
   * Délai d'attente maximum pour une requête (en ms)
   * @default 30000
   */
  timeout?: number;
}

export class PgnParserWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (result: ParsedPgnWorkerResult) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  private requestIdCounter = 0;
  private readonly timeout: number;

  constructor(options: PgnParserWorkerManagerOptions = {}) {
    this.timeout = options.timeout ?? 30_000; // 30s pour les gros fichiers
    this.initWorker();
  }

  /**
   * Initialise le Web Worker
   */
  private initWorker(): void {
    if (typeof Worker === 'undefined') {
      this.worker = null;
      return;
    }

    try {
      const baseUrl = globalThis.location?.href ?? 'http://localhost/';
      this.worker = new Worker(new URL('../workers/PgnParserWorker.ts', baseUrl), {
        type: 'module',
      });

      this.worker.addEventListener('message', (event: MessageEvent<PgnParserWorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      });

      this.worker.addEventListener('error', (error: ErrorEvent) => {
        console.error('PgnParserWorker error:', error);
        // Rejeter toutes les requêtes en attente
        for (const request of this.pendingRequests.values()) {
          clearTimeout(request.timeout);
          request.reject(new Error(`Worker error: ${error.message}`));
        }
        this.pendingRequests.clear();
      });
    } catch (error) {
      console.error('Failed to initialize PgnParserWorker:', error);
      this.worker = null;
    }
  }

  /**
   * Gère les messages reçus du Worker
   */
  private handleWorkerMessage(data: PgnParserWorkerResponse): void {
    const request = data.id ? this.pendingRequests.get(data.id) : null;

    if (!request) {
      return;
    }

    clearTimeout(request.timeout);
    this.pendingRequests.delete(data.id!);

    if (data.type === 'success') {
      if (data.result !== undefined) {
        request.resolve(data.result);
      } else if (data.results !== undefined) {
        request.resolve(data.results);
      } else if (data.valid === undefined) {
        request.reject(new Error('Invalid response from worker'));
      } else {
        request.resolve(data.valid);
      }
    } else {
      request.reject(new Error(data.error || 'Unknown error from worker'));
    }
  }

  /**
   * Envoie une requête au Worker et retourne une Promise
   */
  private sendRequest<T extends ParsedPgnWorkerResult>(
    message: Omit<PgnParserWorkerMessage, 'id'>,
  ): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const id = `req_${this.requestIdCounter++}_${Date.now()}`;
    const requestMessage: PgnParserWorkerMessage = { ...message, id };

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (result: ParsedPgnWorkerResult) => void,
        reject,
        timeout,
      });
      this.worker!.postMessage(requestMessage);
    });
  }

  /**
   * Parse un PGN de manière asynchrone
   */
  async parsePgn(
    pgn: string,
    options?: { includeAnnotations?: boolean },
  ): Promise<ParsedPgnResult> {
    return this.sendRequest<ParsedPgnResult>({
      type: 'parsePgn',
      pgn,
      options,
    });
  }

  /**
   * Parse plusieurs PGN en batch
   */
  async parsePgnBatch(
    pgns: string[],
    options?: { includeAnnotations?: boolean },
  ): Promise<ParsedPgnResult[]> {
    return this.sendRequest<ParsedPgnResult[]>({
      type: 'parsePgnBatch',
      pgns,
      options,
    });
  }

  /**
   * Valide un PGN de manière asynchrone
   */
  async validatePgn(pgn: string): Promise<boolean> {
    return this.sendRequest<boolean>({
      type: 'validatePgn',
      pgn,
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
    for (const request of this.pendingRequests.values()) {
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
