# Chess960 (Fischer Random Chess)

Neo Chess Board supporte le Chess960, également connu sous le nom de Fischer Random Chess, une variante des échecs où les pièces de la première rangée sont arrangées aléatoirement selon des règles spécifiques.

## Qu'est-ce que le Chess960 ?

Le Chess960 est une variante des échecs où les pièces de la première rangée (roi, dame, tours, fous, cavaliers) sont arrangées de manière aléatoire, mais avec des contraintes :

- Les fous doivent être placés sur des cases de couleurs opposées
- Le roi doit être positionné entre les deux tours
- Les autres pièces peuvent être placées librement

Cela donne 960 positions de départ possibles (d'où le nom Chess960).

## Utilisation de base

### Avec le composant React

```tsx
import { NeoChessBoard } from 'neo-chess-board';
import { generateChess960Start } from 'neo-chess-board';

function Chess960Game() {
  return (
    <NeoChessBoard 
      variant="chess960"
      fen={generateChess960Start()} // Position aléatoire
    />
  );
}
```

### Avec une position spécifique

Vous pouvez générer une position spécifique en utilisant un index (0-959) :

```tsx
import { NeoChessBoard } from 'neo-chess-board';
import { generateChess960Start } from 'neo-chess-board';

function Chess960Game() {
  // Position avec l'index 42 (déterministe)
  const position = generateChess960Start(42);
  
  return (
    <NeoChessBoard 
      variant="chess960"
      fen={position}
    />
  );
}
```

### Avec le hook useNeoChessBoard

```tsx
import { useNeoChessBoard } from 'neo-chess-board';
import { generateChess960Start } from 'neo-chess-board';

function Chess960Game() {
  const { containerRef, isReady, api } = useNeoChessBoard({
    fen: generateChess960Start(),
    options: {
      variant: 'chess960',
    },
  });

  return <div ref={containerRef} />;
}
```

## API des utilitaires Chess960

### `generateChess960Start(rankIndex?: number): string`

Génère une position de départ Chess960 en notation FEN.

**Paramètres :**
- `rankIndex` (optionnel) : Index de la position (0-959). Si non fourni, génère une position aléatoire.

**Retourne :** Une chaîne FEN représentant la position de départ Chess960.

**Exemple :**
```typescript
import { generateChess960Start } from 'neo-chess-board';

// Position aléatoire
const randomPosition = generateChess960Start();

// Position spécifique (index 0)
const position0 = generateChess960Start(0);

// Position spécifique (index 959)
const position959 = generateChess960Start(959);
```

### `isValidChess960Start(fen: string): boolean`

Valide qu'une chaîne FEN représente une position de départ Chess960 valide.

**Paramètres :**
- `fen` : Chaîne FEN à valider.

**Retourne :** `true` si la position est valide, `false` sinon.

**Exemple :**
```typescript
import { isValidChess960Start, generateChess960Start } from 'neo-chess-board';

const position = generateChess960Start(42);
console.log(isValidChess960Start(position)); // true

const invalidFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
console.log(isValidChess960Start(invalidFen)); // true (position standard est aussi valide)
```

### `getChess960IndexFromFen(fen: string): number | null`

Tente de déterminer l'index Chess960 (0-959) à partir d'une chaîne FEN.

**Paramètres :**
- `fen` : Chaîne FEN de la position.

**Retourne :** L'index Chess960 (0-959) si la position est valide, `null` sinon.

**Exemple :**
```typescript
import { generateChess960Start, getChess960IndexFromFen } from 'neo-chess-board';

const position = generateChess960Start(42);
const index = getChess960IndexFromFen(position);
console.log(index); // 42
```

## Règles du roque en Chess960

En Chess960, les règles du roque sont modifiées :

- Les positions finales du roi et de la tour après le roque sont identiques aux échecs classiques
- Le roque côté roi (0-0) : le roi se retrouve sur g1/g8 et la tour sur f1/f8
- Le roque côté dame (0-0-0) : le roi se retrouve sur c1/c8 et la tour sur d1/d8
- Les conditions préalables restent les mêmes : le roi et la tour ne doivent pas avoir bougé, le roi ne doit pas être en échec, etc.

## Intégration avec le moteur d'échecs

### Avec ChessJsRules

```typescript
import { ChessJsRules } from 'neo-chess-board';
import { generateChess960Start } from 'neo-chess-board';

const rules = new ChessJsRules({
  variant: 'chess960',
  fen: generateChess960Start(),
});

// Les mouvements et le roque sont gérés correctement
const moves = rules.movesFrom('e2');
```

### Avec StockfishEngine

```typescript
import { StockfishEngine } from 'neo-chess-board';

const engine = new StockfishEngine({
  variant: 'chess960',
});

await engine.init();
const bestMove = await engine.getBestMove(chess960Fen);
```

## Exemple complet

```tsx
import { useState } from 'react';
import { NeoChessBoard } from 'neo-chess-board';
import { generateChess960Start, getChess960IndexFromFen } from 'neo-chess-board';

function Chess960App() {
  const [position, setPosition] = useState(() => generateChess960Start());
  const [index, setIndex] = useState<number | null>(null);

  const handleNewPosition = () => {
    const newPosition = generateChess960Start();
    setPosition(newPosition);
    setIndex(getChess960IndexFromFen(newPosition));
  };

  const handlePositionChange = (newPosition: string) => {
    setPosition(newPosition);
    setIndex(getChess960IndexFromFen(newPosition));
  };

  return (
    <div>
      <div>
        <button onClick={handleNewPosition}>
          Nouvelle position Chess960
        </button>
        {index !== null && <p>Index de position : {index}</p>}
      </div>
      <NeoChessBoard
        variant="chess960"
        fen={position}
        onUpdate={(e) => handlePositionChange(e.fen)}
      />
    </div>
  );
}
```

## Notes importantes

- Le Chess960 utilise la même notation FEN que les échecs classiques
- La position standard des échecs (index 518) est également valide en Chess960
- Les règles de jeu sont identiques aux échecs classiques, seule la position de départ change
- Le moteur Stockfish doit supporter UCI_Chess960 pour fonctionner correctement avec cette variante

