/**
 * Web Worker pour exécuter Stockfish et gérer la communication UCI
 *
 * Ce worker charge le binaire Stockfish (WASM) et gère toutes les
 * communications UCI avec le moteur d'échecs.
 *
 * Pour utiliser avec le vrai Stockfish, vous devez :
 * 1. Installer stockfish.js : npm install stockfish.js
 * 2. Importer et initialiser Stockfish dans ce worker
 * 3. Connecter les callbacks onmessage de Stockfish aux messages du worker
 */

// Variable globale pour stocker l'instance Stockfish
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let stockfishInstance: any = null;
let stockfishReady = false;

/**
 * Initialise Stockfish en chargeant le binaire WASM
 *
 * @param stockfishPath Chemin vers le binaire Stockfish (optionnel pour l'instant)
 */
async function initStockfish(stockfishPath?: string): Promise<void> {
  if (stockfishInstance) {
    return;
  }

  try {
    // Option 1: Utiliser stockfish.js (recommandé)
    // Décommentez et installez: npm install stockfish.js
    /*
    const Stockfish = await import('stockfish.js');
    stockfishInstance = Stockfish.default();
    stockfishInstance.onmessage = (line: string) => {
      if (line) {
        self.postMessage({ type: 'output', content: line });
      }
    };
    */

    // Option 2: Charger depuis un fichier WASM externe
    // Si vous avez un fichier stockfish.wasm dans public/
    /*
    const wasmUrl = stockfishPath || '/stockfish.wasm';
    const response = await fetch(wasmUrl);
    const wasmBuffer = await response.arrayBuffer();
    // Initialiser Stockfish avec le buffer WASM
    */

    // Option 3: Simulation pour le développement (actuellement actif)
    // Cette simulation permet de tester l'intégration sans le vrai Stockfish
    stockfishInstance = createMockStockfish();

    stockfishReady = true;
    self.postMessage({ type: 'ready' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({
      type: 'error',
      content: `Erreur lors du chargement de Stockfish: ${errorMessage}`,
    });
  }
}

/**
 * Crée une simulation de Stockfish pour le développement
 * Remplacez cette fonction par l'initialisation réelle de Stockfish
 */
function createMockStockfish(): { postMessage: (message: string) => void } {
  let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  let analysisDepth = 0;
  let analysisTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    postMessage: (message: string) => {
      const [command] = message.split(' ');

      if (command === 'uci') {
        self.postMessage({ type: 'output', content: 'id name Stockfish Mock' });
        self.postMessage({ type: 'output', content: 'id author Stockfish Team' });
        self.postMessage({ type: 'output', content: 'uciok' });
        return;
      }

      if (command === 'isready') {
        self.postMessage({ type: 'output', content: 'readyok' });
        return;
      }

      if (command === 'ucinewgame') {
        // Nouvelle partie, réinitialiser
        return;
      }

      if (command === 'position') {
        const fenMatch = message.match(/fen\s+(.+?)(?:\s+moves|$)/);
        if (fenMatch) {
          currentFen = fenMatch[1];
        } else if (message.includes('startpos')) {
          currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        }
        return;
      }

      if (command === 'go') {
        // Arrêter l'analyse précédente si elle existe
        if (analysisTimer) {
          clearTimeout(analysisTimer);
        }

        // Extraire la profondeur de la commande
        const depthMatch = message.match(/depth\s+(\d+)/);
        const targetDepth = depthMatch ? Number.parseInt(depthMatch[1], 10) : 20;

        // Simuler une analyse progressive
        analysisDepth = 0;
        const simulateDepth = () => {
          if (analysisDepth >= targetDepth) {
            // Envoyer le bestmove final
            self.postMessage({ type: 'output', content: 'bestmove e2e4' });
            return;
          }

          analysisDepth += 1;
          const score = Math.floor(Math.random() * 100) - 50; // Score simulé
          const pv = analysisDepth === 1 ? 'e2e4' : 'e2e4 e7e5';

          self.postMessage({
            type: 'output',
            content: `info depth ${analysisDepth} score cp ${score} pv ${pv}`,
          });

          // Continuer l'analyse jusqu'à la profondeur cible
          analysisTimer = setTimeout(simulateDepth, 50);
        };

        simulateDepth();
        return;
      }

      if (command === 'stop') {
        if (analysisTimer) {
          clearTimeout(analysisTimer);
          analysisTimer = null;
        }
        self.postMessage({ type: 'output', content: 'bestmove 0000' });
        return;
      }
    },
  };
}

/**
 * Gère les messages reçus du thread principal
 */
globalThis.onmessage = async (event: MessageEvent) => {
  const { type, command, stockfishPath } = event.data as {
    type?: string;
    command?: string;
    stockfishPath?: string;
  };

  if (type === 'init' && stockfishPath) {
    await initStockfish(stockfishPath);
    return;
  }

  if (type === 'command' && typeof command === 'string') {
    if (!stockfishReady && !stockfishInstance) {
      // Initialiser automatiquement si pas encore fait
      await initStockfish();
    }

    if (stockfishInstance) {
      // Envoyer la commande UCI à Stockfish
      stockfishInstance.postMessage(command);
    } else {
      self.postMessage({
        type: 'error',
        content: 'Stockfish non initialisé',
      });
    }
  }
};

/**
 * Gère les erreurs du Worker
 */
self.addEventListener('error', (error: ErrorEvent) => {
  self.postMessage({
    type: 'error',
    content: `Erreur du Worker: ${error.message}`,
  });
});
