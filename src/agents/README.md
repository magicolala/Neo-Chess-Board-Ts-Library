# StockfishAgent

Agent d'analyse Stockfish qui s'intègre avec `ChessGame` pour fournir des analyses en temps réel.

## Description

Le `StockfishAgent` s'abonne automatiquement aux mises à jour de position d'une instance `ChessGame` et publie les résultats d'analyse via un système d'événements. L'analyse s'exécute dans un Web Worker pour maintenir l'interface utilisateur réactive.

## Utilisation

```typescript
import { ChessGame } from 'neo-chess-board';
import { StockfishAgent } from 'neo-chess-board';

// Créer une instance de ChessGame
const game = new ChessGame({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
});

// Créer l'agent Stockfish
const agent = new StockfishAgent(game, '/stockfish.js', 20);

// S'abonner aux mises à jour d'analyse
const unsubscribe = agent.on('analysisUpdate', (analysis) => {
  console.log('Profondeur:', analysis.depth);
  console.log('Score:', analysis.score);
  console.log('Variante principale:', analysis.pv);
  console.log('Meilleur coup:', analysis.bestMove);
});

// S'abonner aux erreurs
agent.on('error', (error) => {
  console.error('Erreur Stockfish:', error.message);
});

// S'abonner à l'événement ready
agent.on('ready', () => {
  console.log('Stockfish est prêt');
});

// Quand le jeu change (l'agent analyse automatiquement)
game.move({ from: 'e2', to: 'e4' });

// Arrêter l'analyse en cours
agent.stop();

// Nettoyer les ressources
agent.terminate();
unsubscribe();
```

## Intégration avec React

```typescript
import { useEffect, useState } from 'react';
import { ChessGame } from 'neo-chess-board';
import { StockfishAgent, type EngineAnalysis } from 'neo-chess-board';

function ChessAnalysis() {
  const [game] = useState(() => new ChessGame());
  const [analysis, setAnalysis] = useState<EngineAnalysis | null>(null);
  const [agent, setAgent] = useState<StockfishAgent | null>(null);

  useEffect(() => {
    const stockfishAgent = new StockfishAgent(game, '/stockfish.js', 15);
    setAgent(stockfishAgent);

    const unsubscribe = stockfishAgent.on('analysisUpdate', (result) => {
      setAnalysis(result);
    });

    return () => {
      unsubscribe();
      stockfishAgent.terminate();
    };
  }, [game]);

  return (
    <div>
      {analysis && (
        <div>
          <p>Score: {analysis.score.value} ({analysis.score.type})</p>
          <p>Profondeur: {analysis.depth}</p>
          <p>Meilleur coup: {analysis.bestMove || 'En cours...'}</p>
        </div>
      )}
    </div>
  );
}
```

## API

### Constructeur

```typescript
constructor(
  gameInstance: ChessGame,
  stockfishPath?: string,
  depth?: number
)
```

- `gameInstance`: Instance de `ChessGame` à surveiller
- `stockfishPath`: Chemin vers le binaire Stockfish (défaut: `'/stockfish.js'`)
- `depth`: Profondeur d'analyse (défaut: `20`)

### Méthodes

#### `on<K>(event: K, handler: (payload: StockfishAgentEventMap[K]) => void): () => void`

S'abonne à un événement de l'agent. Retourne une fonction pour se désabonner.

Événements disponibles:
- `analysisUpdate`: Émis à chaque mise à jour d'analyse
- `error`: Émis en cas d'erreur
- `ready`: Émis quand Stockfish est prêt

#### `stop(): void`

Arrête l'analyse en cours.

#### `setDepth(depth: number): void`

Définit la profondeur d'analyse.

#### `terminate(): void`

Nettoie les ressources et termine le Worker. Appelez cette méthode lors du nettoyage.

## Configuration du Worker

Le `StockfishWorker` utilise actuellement une simulation pour le développement. Pour utiliser le vrai Stockfish:

1. Installez `stockfish.js`:
   ```bash
   npm install stockfish.js
   ```

2. Modifiez `src/workers/StockfishWorker.ts` pour décommenter et utiliser l'import réel:
   ```typescript
   const Stockfish = await import('stockfish.js');
   stockfishInstance = Stockfish.default();
   ```

3. Placez le binaire Stockfish dans le dossier `public/` de votre projet.

## Notes

- L'agent s'abonne automatiquement à l'événement `update` de `ChessGame`
- L'analyse s'exécute dans un Web Worker pour maintenir l'UI réactive
- L'agent émet des mises à jour d'analyse au fur et à mesure de la progression
- Le Worker doit être configuré pour utiliser le vrai Stockfish en production

