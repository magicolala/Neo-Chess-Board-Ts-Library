# Exemples d'utilisation

Ce document présente des exemples complets pour exploiter Neo Chess Board dans plusieurs scénarios.

## 🔗 Pages de démonstration en ligne

Découvrez la bibliothèque directement dans votre navigateur grâce aux démos hébergées :

- 🌐 [Starter Vanilla JS](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/vanilla-js-example.html) – Configuration HTML autonome avec changement de thème, historique des coups et export PGN.
- ♞ [Intégration Chess.js](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/chess-js-demo.html) – Met en avant l'adaptateur ChessJsRules synchronisé avec le moteur chess.js.
- 📈 [PGN + HUD d'évaluation](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/pgn-import-eval.html) – Importez des parties annotées, synchronisez l'orientation et suivez la barre d'évaluation.
- ⚡ [Vitrine des fonctionnalités avancées](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/examples/advanced-features.html) – Explorez les puzzles, aides à l'analyse et workflows pilotés au clavier.

---

## 🚀 Démarrages rapides

### Configuration Vanilla JavaScript basique

```typescript
import { NeoChessBoard } from '@magicolala/neo-chess-board';

const canvas = document.querySelector('#board') as HTMLCanvasElement;
const board = new NeoChessBoard(canvas, {
  theme: 'classic',
  showCoordinates: true,
  highlightLegal: true,
});

board.loadPosition('start');
```

### Utilisation React avec hooks

```tsx
import { useCallback } from 'react';
import { useNeoChessBoard } from '@magicolala/neo-chess-board/react';

export function PlateauInteractif() {
  const { containerRef, boardRef, isReady } = useNeoChessBoard({
    options: {
      theme: 'midnight',
      showCoordinates: true,
      highlightLegal: true,
    },
    onMove: ({ san }) => console.log(san),
  });

  const basculerOrientation = useCallback(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }

    const prochaineOrientation =
      board.getOrientation() === 'white' ? 'black' : 'white';
    board.setOrientation(prochaineOrientation);
  }, [boardRef]);

  return (
    <div className="board-wrapper">
      <div
        ref={containerRef}
        style={{ width: 460, height: 460, borderRadius: '1rem', overflow: 'hidden' }}
      />
      <button onClick={basculerOrientation} disabled={!isReady}>
        Inverser l'orientation
      </button>
    </div>
  );
}
```

### Import/Export PGN

```typescript
import { PgnNotation } from '@magicolala/neo-chess-board';

const notation = new PgnNotation();

notation.loadPgnWithAnnotations('[Event "Casual Game"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *');
console.log(notation.getMovesWithAnnotations());

const exported = notation.toPgn();
console.log(exported);
```

## 🧩 Extensions pratiques

- **`useBoardTheme`** – Hook React pour basculer instantanément entre plusieurs thèmes.
- **`useMoveHistory`** – Conserve un historique synchronisé avec l'état PGN interne.
- **`AnalysisOverlayExtension`** – Dessine des flèches, cercles et surbrillances animées.
- **`KeyboardControlsExtension`** – Ajoute des raccourcis pour naviguer dans les coups et inverser le plateau.

## ✅ Bonnes pratiques

- Lancez `npm run build` pour vérifier que les exemples restent compatibles avec la dernière API.
- Réutilisez les helpers fournis (`board.loadPosition`, `board.on('move', …)`, `new PgnNotation().toPgn()`) pour garantir un comportement homogène.
- Ajoutez vos propres démos dans `examples/` afin d'illustrer des intégrations spécifiques (framework, moteur, UI).
