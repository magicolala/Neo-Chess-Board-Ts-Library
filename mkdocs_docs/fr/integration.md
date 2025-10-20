# Guide d'intégration simplifiée

Ce guide explique comment intégrer Neo Chess Board dans un site Web et le personnaliser rapidement. Nous couvrons l'installation via GitHub Packages, le rendu du plateau en JavaScript ou React, puis les principales options de customisation.

## Prérequis

- Un projet capable de servir des assets statiques (Vite, Next.js, Create React App, etc.).
- Node.js 18 ou version supérieure.
- Un accès au scope npm `@magicolala` hébergé sur GitHub Packages.

> Pour un rappel des bases, consultez la section [Quick Start](https://github.com/magicolala/Neo-Chess-Board-Ts-Library#-quick-start) du README principal.

## 1. Configurer le registre et installer la librairie

Ajoutez ces lignes à votre fichier `.npmrc` (à la racine du projet ou dans votre dossier utilisateur) :

```ini
@magicolala:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Remplacez `${GITHUB_TOKEN}` par un jeton d'accès personnel disposant du droit `read:packages`. Installez ensuite le paquet :

```bash
npm install @magicolala/neo-chess-board
# ou
yarn add @magicolala/neo-chess-board
# ou
pnpm add @magicolala/neo-chess-board
```

## 2. Afficher le plateau

### Vanilla JavaScript

```ts
import { NeoChessBoard } from '@magicolala/neo-chess-board';

const board = new NeoChessBoard(document.getElementById('board'), {
  theme: 'classic',
  interactive: true,
});

board.on('move', ({ from, to, fen }) => {
  console.log(`${from} → ${to}`);
});
```

```html
<div id="board" style="width: 420px; height: 420px;"></div>
```

### React

```tsx
import { useState } from 'react';
import { NeoChessBoard } from '@magicolala/neo-chess-board/react';

export function AireDeJeu() {
  const [fen, setFen] = useState<string | undefined>();

  return (
    <NeoChessBoard
      fen={fen}
      theme="midnight"
      onMove={({ fen: prochaineFen }) => setFen(prochaineFen)}
      style={{ width: 440, height: 440, borderRadius: '1rem', overflow: 'hidden' }}
    />
  );
}
```

## 3. Personnaliser l'apparence

### Thèmes intégrés

Les presets fournis sont accessibles via la prop `theme`. Les noms correspondent au catalogue de la page [Thèmes](../themes.md).

```tsx
<NeoChessBoard theme="classic" />
<NeoChessBoard theme="midnight" />
```

### Créer un thème sur mesure

```ts
import { registerTheme } from '@magicolala/neo-chess-board';

const themeAurore = {
  light: '#f5f3ff',
  dark: '#1e1b4b',
  highlight: '#fbbf24',
  check: '#f59e0b',
  coordinates: '#312e81',
  // ...complétez les autres champs du thème
};

registerTheme('aurore', themeAurore);

new NeoChessBoard(container, { theme: 'aurore' });
```

> Astuce : l'outil [Theme Creator](https://magicolala.github.io/Neo-Chess-Board-Ts-Library/demo/theme-creator.html) permet d'expérimenter visuellement et d'exporter le code du thème en un clic.

### Jeux de pièces personnalisés

```ts
import type { PieceSet } from '@magicolala/neo-chess-board';
import whiteKing from './pieces/wK.svg';
import blackKing from './pieces/bK.svg';

const piecesBrillantes: PieceSet = {
  defaultScale: 0.92,
  pieces: {
    K: { image: whiteKing },
    k: { image: blackKing },
    // ajoutez le reste des sprites selon vos besoins
  },
};

const board = new NeoChessBoard(container, {
  pieceSet: piecesBrillantes,
  background: '#0f172a',
});
```

Les pièces non définies utilisent automatiquement le set minimaliste par défaut. Ajustez `offsetX`, `offsetY` ou `scale` pour recadrer chaque sprite.

## 4. Ajuster les interactions

### Mise en évidence et coordonnées

```ts
const board = new NeoChessBoard(container, {
  showCoordinates: true,
  highlightMoves: true,
  highlightLastMove: true,
  highlightCheck: true,
});
```

### Cycle des événements

Abonnez-vous aux événements (`move`, `promotion`, `select`, etc.) pour synchroniser le plateau avec le reste de votre interface.

```ts
board.on('promotion', ({ square, setPiece }) => {
  ouvrirFenetrePromotion({
    square,
    onChoice(piece) {
      setPiece(piece);
    },
  });
});
```

Dans React, utilisez les props dédiées : `onMove`, `onPromotion`, `onSquareClick`, etc.

### Sons et habillage du plateau

Les bascules à chaud s'appuient désormais sur les gestionnaires audio et DOM, ce qui permet d'ajuster l'ambiance ou le style sans reconstruire le plateau.

```ts
board.setSoundEnabled(true);
board.setSoundUrls({
  white: '/sons/coup-blanc.mp3',
  black: '/sons/coup-noir.mp3',
});

// Appliquer du CSS en ligne à l'enveloppe superposée
board.setBoardStyle({
  borderRadius: '18px',
  boxShadow: '0 12px 35px rgba(15, 23, 42, 0.25)',
});
```

Les changements sont immédiats : `BoardDomManager` maintient un `ResizeObserver` actif et `BoardAudioManager` recharge les sources sonores à la volée.

## 5. Mise en page et responsivité

Enveloppez le plateau dans un conteneur flexible et contrôlez ses dimensions via le CSS. Le `<canvas>` se redimensionne en douceur lorsque `width` ou `height` changent.

```tsx
<div className="board-shell">
  <NeoChessBoard theme="classic" autoFlip style={{ width: '100%', aspectRatio: '1 / 1' }} />
</div>
```

```css
.board-shell {
  max-width: 520px;
  margin: 0 auto;
}
```

## 6. Persister l'état de la partie

Combinez les helpers PGN/FEN avec un stockage local pour retrouver une partie ultérieurement.

```ts
import { NeoChessBoard, parsePgn, toPgn } from '@magicolala/neo-chess-board';

const sauvegarde = localStorage.getItem('neo-chess-game');
const board = new NeoChessBoard(container, { fen: sauvegarde ?? undefined });

board.on('move', () => {
  localStorage.setItem('neo-chess-game', board.getFen());
});
```

## 7. Déployer

La librairie ne nécessite pas d'assets spéciaux : une fois bundlée, elle fonctionne sur n'importe quel hébergement statique ou CDN. Si vous utilisez des sprites externes, vérifiez qu'ils sont copiés par votre bundler ou accessibles via des URLs publiques.

---

Avec ces étapes, vous pouvez intégrer Neo Chess Board dans une landing page, un tableau de bord ou une plateforme de jeu complète tout en respectant votre identité visuelle.
